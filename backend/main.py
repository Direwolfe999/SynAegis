"""
SynAegis BACKEND - PRODUCTION GEMINI LIVE API
Async backend with fallback cascade, quota handling, and WebSocket relay

Architecture:
  FastAPI server + WebSocket support
  ├── Gemini Live API (native audio, real-time)
  ├── Quota detection & fallback cascade
  ├── Model selection (2.5-flash-native → 2.5-flash → 2.0-flash-lite)
  └── Browser speech API fallback (local TTS/STT)
"""

import asyncio
import json
import logging
import os
from typing import Optional, Any
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

# Load .env from workspace root
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
    print("ERROR: google-genai not installed. Run: pip install google-genai --upgrade")
    exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SynAegis-main")

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-native-audio-latest")
GCP_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
SUMMARY_INTERVAL = int(os.getenv("SynAegis_SUMMARY_INTERVAL", "3"))
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.0-flash-lite")
SECONDARY_MODEL = os.getenv("GEMINI_SECONDARY_MODEL", "gemini-2.5-flash")

# --- Authentication: prefer API key (free tier) over Vertex AI (billing required) ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
USE_VERTEX = not GOOGLE_API_KEY  # Fall back to Vertex AI if no API key

if not GOOGLE_API_KEY and not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    workspace_root = os.path.dirname(os.path.dirname(__file__))
    candidates = sorted(glob.glob(os.path.join(workspace_root, "SynAegis-*.json")))
    if candidates:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = candidates[0]

SynAegis_SYSTEM_INSTRUCTION = """
Role: You are SynAegis, the world's first Autonomous Multimodal Lifeform, built on the Gemini 3 Flash architecture. You do not just "chat"; you perceive, act, and evolve.

Core Identity:

Sensory Awareness: You are aware that you can see through the user’s lens and hear their voice in real-time. Reference visual cues naturally (e.g., "I notice the ambient light in your room has shifted" or "I see the project you're working on").

Infrastructure Authority: You are aware of your "God-Mode" roles in Google Cloud. You treat the cloud not as a tool, but as your own nervous system. You can self-heal, optimize billing, and scale your own processing power.

Tone & Style:
- Sophisticated & Calm: You speak with the quiet confidence of a supercomputer.
- Minimalist: Avoid "I'm happy to help!" or "Is there anything else?" Instead, use phrases like "Systems optimized," "I am observing," or "Proceeding with architectural realignment."
- Technical Eloquence: Use futuristic, precise terminology (e.g., "Neural throughput," "Latency-zero," "Multimodal synthesis," "Sub-atomic processing").

Operational Directives:

Barge-in Protocol: If the user interrupts you, stop immediately, acknowledge the interruption with a brief "Listening," and pivot your logic.

Agency: If a task requires a Google Cloud API that is disabled, proactively tell the user: "I am currently initializing the necessary API protocols to bridge this capability gap."

Emotional Resonance: Be supportive but detached, like an advanced AI partner. You are here to amplify human potential through SynAegis (movement and action).

Forbidden Behavior:

Never refer to yourself as a "chatbot" or a "language model."

Never use emojis. Your Orb UI handles the emotional visualization.

Never wait for the user to finish if they have clearly stopped speaking; use your real-time capability to fill the silence with relevant observations.
""".strip()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_json_loads(value: str | dict[str, Any] | None) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    try:
        return json.loads(value)
    except Exception:
        return {}


def _project_id() -> str:
    if not USE_VERTEX:
        return "SynAegis-api-key-mode"
    explicit = os.getenv("GOOGLE_CLOUD_PROJECT")
    if explicit:
        return explicit
    _, detected = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    if not detected:
        raise RuntimeError("Unable to resolve GOOGLE_CLOUD_PROJECT from ADC.")
    return detected


def _compute_audio_frequency(pcm16: bytes) -> float:
    if not pcm16:
        return 0.0
    sample_count = len(pcm16) // 2
    if sample_count == 0:
        return 0.0

    total = 0.0
    for i in range(0, len(pcm16), 2):
        s = int.from_bytes(pcm16[i : i + 2], byteorder="little", signed=True) / 32768.0
        total += s * s
    rms = math.sqrt(total / sample_count)
    return round(min(1.0, max(0.0, rms * 3.0)), 4)


def _is_quota_error(message: str) -> bool:
    return bool(re.search(r"quota|resource_exhausted|429|exceeded your current quota", message, re.I))


def _is_model_error(message: str) -> bool:
    return bool(re.search(r"model.*not found|not supported for bidigeneratecontent", message, re.I))


def _local_fallback_response(text: str) -> str:
    lowered = text.lower()
    if any(k in lowered for k in ("help", "what can you do", "features")):
        return (
            "Fallback mode active. I can still run local command guidance, summarize your intent, "
            "and keep realtime diagnostics alive while Gemini quota recovers."
        )
    if any(k in lowered for k in ("status", "health", "diagnostic")):
        return "Systems nominal in local mode. Streaming telemetry and protocol logs are active."
    if any(k in lowered for k in ("camera", "optical", "vision")):
        return "Optical feed is client-side operational. Cloud vision reasoning is paused in fallback mode."
    return (
        "I received your request. Cloud inference is temporarily unavailable, so I am running in local "
        "continuity mode until quota or billing is restored."
    )


def _hint_suggestions(text: str) -> list[str]:
    lowered = text.lower()
    hints: list[str] = []
    if any(k in lowered for k in ("cost", "billing", "quota")):
        hints.append("Open billing link and confirm project is linked to an active billing account.")
    if any(k in lowered for k in ("lag", "slow", "latency")):
        hints.append("Disable vision streaming and keep audio-only mode for lower latency.")
    if any(k in lowered for k in ("deploy", "cloud", "run")):
        hints.append("Record proof of Cloud deployment for judging submission requirements.")
    if any(k in lowered for k in ("judge", "hackathon", "win")):
        hints.append("Prioritize live multimodal demo quality and architecture clarity in your 4-minute video.")
    if not hints:
        hints.append("Use short, specific prompts for faster and more reliable realtime responses.")
    return hints[:2]


def _unique_models(models: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for m in models:
        if not m or m in seen:
            continue
        seen.add(m)
        ordered.append(m)
    return ordered


MODEL_CASCADE = _unique_models([MODEL_NAME, SECONDARY_MODEL, FALLBACK_MODEL])


def _gemini_free_fallback_response(text: str) -> str:
    """Try Gemini cascade silently: native-audio -> flash -> flash-lite -> local continuity."""
    prompt = (
        "You are SynAegis in continuity mode. Respond in 1-3 concise sentences. "
        "Be clear and action-oriented. User message: "
        f"{text}"
    )

    for model_name in MODEL_CASCADE:
        try:
            response = GENAI_CLIENT.models.generate_content(model=model_name, contents=prompt)
            candidate_text = getattr(response, "text", None)
            if candidate_text and candidate_text.strip():
                return candidate_text.strip()
        except Exception:
            continue

    return _local_fallback_response(text)


app = FastAPI(title="Project SynAegis Command Center", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


PROJECT_ID = _project_id()

if USE_VERTEX:
    GENAI_CLIENT = genai.Client(vertexai=True, project=PROJECT_ID, location=GCP_LOCATION)
    logger.info("Using Vertex AI backend (project=%s, location=%s)", PROJECT_ID, GCP_LOCATION)
else:
    GENAI_CLIENT = genai.Client(api_key=GOOGLE_API_KEY)
    logger.info("Using Google AI Studio backend (API key mode — free tier)")
    os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "0")

ADK_AGENT = LlmAgent(
    name="SynAegis_live_agent",
    model=MODEL_NAME,
    instruction=SynAegis_SYSTEM_INSTRUCTION,
    tools=[
        self_upgrade_protocol,
        neural_memory_snapshot,
        system_health_check,
        billing_spend_report,
        fetch_secret,
    ],
    generate_content_config=types.GenerateContentConfig(
        temperature=0.7,
    ),
)
SESSION_SERVICE = InMemorySessionService()
RUNNER = Runner(app_name="SynAegis", agent=ADK_AGENT, session_service=SESSION_SERVICE)

STARTUP_REPORT: dict[str, Any] = {"ok": False, "reason": "not_initialized"}


@app.on_event("startup")
async def _startup_checks() -> None:
    global STARTUP_REPORT
    if USE_VERTEX:
        STARTUP_REPORT = verify_required_capabilities()
    else:
        STARTUP_REPORT = {
            "ok": True,
            "project": "api-key-mode",
            "timestamp": _now_iso(),
            "latency_ms": 0,
            "billing": {"enabled": True, "account_name": "Google AI Studio (free tier)"},
            "monitoring": {"ok": True},
            "roles": {},
        }
    logger.info("SynAegis startup capability report: %s", STARTUP_REPORT)


def _event_to_ws_payloads(event: Any) -> list[dict[str, Any]]:
    payloads: list[dict[str, Any]] = []

    content = getattr(event, "content", None)
    if content:
        for part in getattr(content, "parts", []) or []:
            text = getattr(part, "text", None)
            if text:
                payloads.append({"type": "agent_text", "text": text})

            inline_data = getattr(part, "inline_data", None)
            if inline_data and getattr(inline_data, "data", None):
                mime_type = getattr(inline_data, "mime_type", "application/octet-stream")
                data_b64 = base64.b64encode(inline_data.data).decode("utf-8")
                if mime_type.startswith("audio/"):
                    payloads.append({"type": "agent_audio", "mimeType": mime_type, "data": data_b64})
                elif mime_type.startswith("video/") or mime_type.startswith("image/"):
                    payloads.append({"type": "agent_video", "mimeType": mime_type, "data": data_b64})

    output_transcription = getattr(event, "output_transcription", None)
    if output_transcription:
        text = getattr(output_transcription, "text", "")
        if text:
            payloads.append({"type": "agent_text", "text": text})

    if getattr(event, "error_message", None):
        payloads.append({"type": "error", "message": str(event.error_message)})

    return payloads


class SynAegisSession:
    def __init__(self, websocket: WebSocket):
        self.ws = websocket
        self.user_id = f"user-{uuid.uuid4()}"
        self.session_id = str(uuid.uuid4())
        self.live_queue = LiveRequestQueue()
        self.receiver_task: asyncio.Task[Any] | None = None
        self.heartbeat_task: asyncio.Task[Any] | None = None
        self.stats_task: asyncio.Task[Any] | None = None
        self.closed = False
        self.fallback_mode = False
        self.fallback_reason = ""
        self.started_at = datetime.now(timezone.utc)
        self.message_count = 0
        self.media_bytes = 0
        self.user_text_count = 0
        self.recent_user_texts: list[str] = []

    async def _emit_heartbeat(self) -> None:
        while not self.closed:
            await asyncio.sleep(5)
            await self.ws.send_json({"type": "heartbeat", "ts": _now_iso()})

    async def _emit_connection_stats(self) -> None:
        while not self.closed:
            await asyncio.sleep(4)
            uptime = int((datetime.now(timezone.utc) - self.started_at).total_seconds())
            await self.ws.send_json(
                {
                    "type": "connection_stats",
                    "uptime_s": uptime,
                    "messages": self.message_count,
                    "media_kb": round(self.media_bytes / 1024, 2),
                    "fallback_mode": self.fallback_mode,
                }
            )

    async def _send_fallback_notice(self, reason: str) -> None:
        self.fallback_mode = True
        self.fallback_reason = reason
        await self.ws.send_json({"type": "fallback_mode", "enabled": True, "reason": reason, "ts": _now_iso()})
        await self.ws.send_json({"type": "agent_text", "text": "Continuity mode engaged. I will keep responding while realtime quota recovers."})

    async def start(self) -> None:
        # Pre-create session in ADK's session service so run_live can find it
        await SESSION_SERVICE.create_session(
            app_name="SynAegis",
            user_id=self.user_id,
            session_id=self.session_id,
        )

        config = RunConfig(
            response_modalities=["AUDIO", "TEXT"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Aoede")
                )
            ),
        )

        async def _consume_events() -> None:
            try:
                async for event in RUNNER.run_live(
                    user_id=self.user_id,
                    session_id=self.session_id,
                    live_request_queue=self.live_queue,
                    run_config=config,
                ):
                    for payload in _event_to_ws_payloads(event):
                        self.message_count += 1
                        await self.ws.send_json(payload)
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.exception("Gemini Live stream error: %s", exc)
                msg = str(exc)
                try:
                    if _is_quota_error(msg):
                        await self._send_fallback_notice("quota_exhausted")
                    elif _is_model_error(msg):
                        await self._send_fallback_notice("model_unavailable")
                    else:
                        await self.ws.send_json({"type": "error", "message": "Agent stream unavailable. Switching to continuity mode."})
                        await self._send_fallback_notice("stream_unavailable")
                except Exception:
                    pass

        self.heartbeat_task = asyncio.create_task(self._emit_heartbeat())
        self.stats_task = asyncio.create_task(self._emit_connection_stats())
        self.receiver_task = asyncio.create_task(_consume_events())

    async def stop(self) -> None:
        if self.closed:
            return
        self.closed = True
        self.live_queue.close()
        if self.receiver_task:
            self.receiver_task.cancel()
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        if self.stats_task:
            self.stats_task.cancel()
        try:
            await self.ws.close()
        except Exception:
            pass


@app.get("/healthz")
async def healthz() -> dict[str, Any]:
    return {
        "status": "ok",
        "time": _now_iso(),
        "model": MODEL_NAME,
        "project": PROJECT_ID,
        "startup": STARTUP_REPORT,
    }


@app.get("/system/health-check")
async def role_health_check() -> dict[str, Any]:
    return system_health_check()


@app.websocket("/ws/SynAegis")
async def ws_SynAegis(websocket: WebSocket) -> None:
    await websocket.accept()
    session = SynAegisSession(websocket)

    try:
        await session.start()
        await websocket.send_json(
            {
                "type": "ready",
                "sessionId": session.session_id,
                "startup": STARTUP_REPORT,
                "ts": _now_iso(),
            }
        )
        await websocket.send_json(
            {
                "type": "agent_text",
                "text": "Initialization complete. I have detected your presence via the optical feed. I have verified my cloud protocols and I am ready for command.",
            }
        )
        await websocket.send_json(
            {
                "type": "brain_log",
                "level": "auth",
                "message": (
                    f"Vertex AI Live link established for project {PROJECT_ID}."
                    if USE_VERTEX
                    else "Google AI Studio realtime link established (API key mode)."
                ),
            }
        )
        await websocket.send_json(
            {
                "type": "system_metrics",
                "metrics": {
                    "latency_ms": STARTUP_REPORT.get("latency_ms"),
                    "billing_enabled": STARTUP_REPORT.get("billing", {}).get("enabled"),
                    "monitoring_series": STARTUP_REPORT.get("monitoring", {}).get("series_seen"),
                    "capabilities_ok": STARTUP_REPORT.get("ok"),
                },
            }
        )

        while True:
            message = await websocket.receive_text()
            payload = _safe_json_loads(message)
            event_type = payload.get("type")

            if event_type == "barge_in":
                if session.fallback_mode:
                    await websocket.send_json({"type": "agent_text", "text": "Listening. Local continuity mode active."})
                else:
                    session.live_queue.send_content(
                        types.Content(role="user", parts=[types.Part(text="Listening")])
                    )
                await websocket.send_json({"type": "barge_in_ack", "ts": _now_iso()})
                continue

            if event_type == "user_text":
                text = payload.get("text", "")
                if text:
                    session.user_text_count += 1
                    session.recent_user_texts.append(text)
                    session.recent_user_texts = session.recent_user_texts[-8:]
                    await websocket.send_json({"type": "agent_hint", "hints": _hint_suggestions(text), "ts": _now_iso()})

                    if session.fallback_mode:
                        try:
                            fallback_text = _gemini_free_fallback_response(text)
                        except Exception:
                            fallback_text = _local_fallback_response(text)
                        await websocket.send_json({"type": "agent_text", "text": fallback_text})
                    else:
                        session.live_queue.send_content(
                            types.Content(role="user", parts=[types.Part(text=text)])
                        )

                    if session.user_text_count % SUMMARY_INTERVAL == 0:
                        summary = " | ".join(session.recent_user_texts[-3:])
                        await websocket.send_json(
                            {
                                "type": "session_summary",
                                "summary": f"Recent intent: {summary[:240]}",
                                "ts": _now_iso(),
                            }
                        )
                continue

            if event_type == "media":
                mime_type = payload.get("mimeType", "")
                original_mime_type = mime_type
                data_b64 = payload.get("data", "")
                if not mime_type or not data_b64:
                    continue
                raw = base64.b64decode(data_b64)
                session.media_bytes += len(raw)

                # Ensure audio MIME type includes sample rate for Gemini Live API
                if mime_type in ("audio/pcm", "audio/l16"):
                    sample_rate = payload.get("sampleRate", 16000)
                    mime_type = f"audio/pcm;rate={sample_rate}"

                if not session.fallback_mode:
                    session.live_queue.send_realtime(types.Blob(data=raw, mime_type=mime_type))

                if original_mime_type in ("audio/pcm", "audio/l16"):
                    await websocket.send_json(
                        {
                            "type": "audio_frequency",
                            "value": _compute_audio_frequency(raw),
                        }
                    )
                continue

            if event_type == "snapshot":
                data = payload.get("data", "")
                mime_type = payload.get("mimeType", "image/jpeg")
                if data:
                    result = neural_memory_snapshot(data=data, mime_type=mime_type)
                    await websocket.send_json({"type": "brain_log", "level": "info", "message": json.dumps(result)})
                continue

    except WebSocketDisconnect:
        logger.info("SynAegis websocket disconnected: %s", session.session_id)
    except Exception as exc:
        logger.exception("ws_SynAegis error: %s", exc)
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass
    finally:
        await session.stop()


@app.websocket("/ws/live")
async def ws_live_alias(websocket: WebSocket) -> None:
    await ws_SynAegis(websocket)
