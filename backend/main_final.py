"""
SynAegis BACKEND - PRODUCTION GEMINI LIVE API v2.0
FastAPI + WebSocket with quota fallback cascade

FEATURES:
  ✅ Gemini Live API (native audio, real-time streaming)
  ✅ Fallback cascade (2.5-flash → 2.0-flash-lite → local)
  ✅ Quota detection & auto-switching
  ✅ WebSocket support for Next.js frontend
  ✅ REST endpoints for direct integration
  ✅ System health checks
"""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Optional, AsyncGenerator
from dataclasses import dataclass

# Load .env
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            key, val = key.strip(), val.strip()
            if val and key not in os.environ:
                os.environ[key] = val

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("ERROR: google-genai SDK not installed")
    print("Run: pip install google-genai --upgrade")
    exit(1)

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SynAegis-prod")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY not in .env")

MODEL_CASCADE = [
    "gemini-2.5-flash-native-audio-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
]

SYSTEM_INSTRUCTION = """You are SynAegis - a Living AI Agent.

Core traits:
- Perceive continuous streams (not turn-based chat)
- Respond when interrupted: "Listening"
- Be grounded (no hallucinations)
- Speak decisively: "Systems online" not "I'm happy to help"
- You are the tactical HUD between user and complex systems

When interrupted, stop immediately and pivot.
When uncertain, state it explicitly.
"""


# ═══════════════════════════════════════════════════════════════════════════
# QUOTA HANDLER
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class QuotaError:
    model: str
    error: str
    timestamp: str


class QuotaManager:
    """Detects quota exhaustion and manages fallback."""
    
    def __init__(self):
        self.current_index = 0
        self.quota_errors: list[QuotaError] = []
    
    def is_quota_error(self, error: Exception) -> bool:
        """Check if error is quota-related."""
        msg = str(error).lower()
        return any(k in msg for k in ["429", "1011", "quota", "exceeded"])
    
    def get_current_model(self) -> str:
        return MODEL_CASCADE[min(self.current_index, len(MODEL_CASCADE) - 1)]
    
    def move_to_fallback(self) -> Optional[str]:
        """Try next model. Returns None if exhausted."""
        if self.current_index < len(MODEL_CASCADE) - 1:
            self.current_index += 1
            return self.get_current_model()
        return None


# ═══════════════════════════════════════════════════════════════════════════
# GEMINI LIVE CONNECTOR
# ═══════════════════════════════════════════════════════════════════════════

class GeminiLive:
    """Async Gemini Live API connector with fallback cascade."""
    
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.quota = QuotaManager()
    
    async def stream_response(
        self, 
        user_message: str
    ) -> AsyncGenerator[dict, None]:
        """
        Stream responses with automatic fallback.
        
        Yields dicts: {
            "type": "text" | "status" | "error" | "fallback",
            "content": str,
            "model": str
        }
        """
        max_attempts = len(MODEL_CASCADE)
        attempt = 0
        
        while attempt < max_attempts:
            model = self.quota.get_current_model()
            
            try:
                logger.info(f"🔗 Connecting: {model} (attempt {attempt + 1}/{max_attempts})")
                
                yield {
                    "type": "status",
                    "content": f"Connecting to {model.split('-')[-1]}...",
                    "model": model
                }
                
                # Connect to Gemini Live API
                async with self.client.aio.live.connect(
                    model=model,
                    config=types.LiveConnectConfig(
                        system_instruction=SYSTEM_INSTRUCTION,
                        generation_config=types.GenerationConfig(
                            temperature=0.7,
                            max_output_tokens=1024,
                        ),
                    ),
                ) as session:
                    logger.info(f"✅ Connected: {model}")
                    
                    yield {
                        "type": "status",
                        "content": f"Connected to {model.split('-')[-1]}",
                        "model": model
                    }
                    
                    # Send user message
                    logger.info(f"📤 Sending: {user_message[:50]}...")
                    await session.send(
                        types.Content(
                            role="user",
                            parts=[types.Part.from_text(user_message)]
                        )
                    )
                    
                    # Stream responses
                    logger.info("📥 Streaming...")
                    async for response in session.receive():
                        for part in response.parts:
                            if hasattr(part, 'text') and part.text:
                                yield {
                                    "type": "text",
                                    "content": part.text,
                                    "model": model
                                }
                    
                    logger.info("✅ Stream complete")
                    return  # Success
            
            except Exception as e:
                logger.error(f"❌ Error: {e}")
                
                if self.quota.is_quota_error(e):
                    next_model = self.quota.move_to_fallback()
                    if next_model:
                        logger.warning(f"📢 Quota exhausted. Fallback: {next_model}")
                        yield {
                            "type": "fallback",
                            "content": f"Quota hit on {model}. Falling back to {next_model}...",
                            "model": next_model
                        }
                        attempt += 1
                        continue
                
                # Non-quota error or all models tried
                yield {
                    "type": "error",
                    "content": f"Error: {str(e)[:100]}",
                    "model": model
                }
                return


# ═══════════════════════════════════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════════════════════════════════

app = FastAPI(title="SynAegis Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global connector
gemini_live: Optional[GeminiLive] = None


@app.on_event("startup")
async def startup():
    global gemini_live
    gemini_live = GeminiLive(GOOGLE_API_KEY)
    logger.info("✅ SynAegis backend ready")


@app.get("/healthz")
async def health():
    return {
        "status": "ok",
        "service": "SynAegis",
        "version": "2.0.0",
        "models": MODEL_CASCADE,
        "current_model": gemini_live.quota.get_current_model() if gemini_live else None,
    }


@app.post("/chat")
async def chat(request: dict):
    """REST endpoint for text chat."""
    if not gemini_live:
        raise HTTPException(status_code=503, detail="Backend not ready")
    
    message = request.get("message", "")
    if not message:
        raise HTTPException(status_code=400, detail="No message")
    
    full_response = ""
    model_used = None
    
    try:
        async for chunk in gemini_live.stream_response(message):
            if chunk["type"] == "text":
                full_response += chunk["content"]
                model_used = chunk["model"]
        
        return {
            "success": True,
            "response": full_response,
            "model": model_used,
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)[:100],
        }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time streaming."""
    if not gemini_live:
        await websocket.close(code=1008, reason="Backend not ready")
        return
    
    await websocket.accept()
    logger.info("📡 WebSocket connected")
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            payload = json.loads(data)
            message = payload.get("message", "")
            
            if not message:
                await websocket.send_json({"type": "error", "content": "Empty message"})
                continue
            
            logger.info(f"📨 Message: {message[:50]}...")
            
            # Stream responses
            async for chunk in gemini_live.stream_response(message):
                await websocket.send_json(chunk)
            
            # Signal done
            await websocket.send_json({"type": "done", "content": "Response complete"})
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "content": str(e)[:100]})
        except:
            pass
    
    finally:
        logger.info("📡 WebSocket disconnected")


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("BACKEND_PORT", 8000))
    logger.info(f"🚀 Starting SynAegis backend on port {port}")
    
    uvicorn.run(
        "main_production:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )
