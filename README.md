# Project SynAegis — Gemini Live Agent Challenge Submission

SynAegis is a realtime multimodal agent that listens, sees, speaks, explains its own runtime state, and remains demo-capable even under quota restrictions.

## 1) Why this project is competitive

This implementation is explicitly aligned to the Gemini Live Agent Challenge judging rubric:

- **Innovation & Multimodal UX (40%)**
  - Continuous mic + camera streams
  - Live orb state transitions (idle/listening/thinking/speaking)
  - Barge-in and interruption handling
  - Typed + voice interaction in one interface
- **Technical Implementation & Agent Architecture (30%)**
  - Google ADK + FastAPI websocket relay
  - Structured backend events (`heartbeat`, `connection_stats`, `agent_hint`, `session_summary`)
  - Quota/model failure containment with local continuity mode
  - Health endpoints and cloud capability probes
- **Demo & Presentation (30%)**
  - Protocol logs for proof of runtime events
  - Architecture file included (`architecture_diagram.md`)
  - Cloud deployment manifests in `deployment/`

> Note: there are no confirmed “secret judge requirements.” We optimize for what is explicitly scored and what consistently wins: polished UX, realtime reliability, clear architecture, and a tight demo narrative.

---

## 2) High-level architecture

```text
Browser (Next.js)
  ├─ Mic (16kHz PCM) + Camera frames
  ├─ Realtime websocket client
  └─ Status overlays, diagnostics, protocol logs
          │
          ▼
FastAPI backend (/ws/SynAegis)
  ├─ ADK LiveRequestQueue + Runner
  ├─ Event fan-out to frontend
  ├─ Fallback continuity mode when quota/model fails
  └─ Health + telemetry endpoints
          │
          ▼
Gemini Live / GenAI model (API key mode or Vertex mode)
```

Core paths:

- `backend/main.py` — websocket runtime, event routing, fallback mode
- `backend/tools.py` — cloud utility tools and health checks
- `frontend/app/page.tsx` — multimodal orchestrator and interactive HUD
- `frontend/components/` — orb, diagnostics, feed, logs, transcription

---

## 3) Realtime feature matrix (expanded)

### Judge-facing capabilities (5)
1. **Live multimodal loop** (audio + optional vision) over websocket.
2. **Interruption support** via explicit barge-in control.
3. **Realtime UX telemetry** (`heartbeat`, ping display, connection stats).
4. **Adaptive hints** (`agent_hint`) based on user intent keywords.
5. **Session context summaries** (`session_summary`) every few prompts.

### Reliability + “can still demo” capabilities (5)
6. **Quota-aware fallback mode** with explicit reason signaling.
7. **Local continuity responses** when cloud inference fails.
8. **Reconnect storm prevention** on quota errors.
9. **Runtime vision uplink toggle** (keyboard `V`) to reduce cost/latency.
10. **Runtime mic uplink mute toggle** (keyboard `M`) + quick test prompt (`T`).

---

## 4) Run locally

### Backend

```bash
cd /path/to/SynAegis
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --port 3000
```

Open: `http://localhost:3000`

---

## 4a) Reproducible Testing Instructions

### Prerequisites Check
```bash
# Verify Python version (need 3.10+)
python3 --version

# Verify Node version (need 16+)
node --version

# Verify npm
npm --version
```

### Automated Setup (One Command)
```bash
# From project root
chmod +x setup_env.sh
./setup_env.sh
```

### Manual Backend Test
```bash
# Test Python imports
python3 -c "import google.generativeai; print('✅ google-genai working')"

# Test FastAPI startup
cd backend
python3 -m py_compile main_production.py
echo "✅ Backend syntax valid"

# Start backend (shows startup)
GOOGLE_API_KEY=test BACKEND_PORT=8080 python3 main_production.py &
sleep 3
curl http://localhost:8080/healthz && echo "✅ Backend responding"
```

### Frontend Build Test
```bash
cd frontend
npm run build 2>&1 | tail -10
```
Expected: `✓ Generating static pages (4/4)`

### Full Integration Test (Local)
```bash
# Terminal 1: Backend
export GOOGLE_API_KEY="your_key_here"
cd backend
BACKEND_PORT=8080 python3 main_production.py

# Terminal 2: Frontend
cd frontend
npm run dev -- --port 3000

# Terminal 3: Verify connection
sleep 5
curl -s http://localhost:8080/healthz | grep "online" && echo "✅ Backend alive"
curl -s http://localhost:3000 | grep "SynAegis" && echo "✅ Frontend alive"
```

### Test Checklist
- [ ] Python 3.10+ installed
- [ ] Node 16+ installed  
- [ ] `pip install -r backend/requirements.txt` succeeds
- [ ] `npm install` in frontend succeeds
- [ ] Backend starts on port 8080 without errors
- [ ] Frontend builds successfully
- [ ] Web UI loads at http://localhost:3000
- [ ] Intro page displays with logo
- [ ] Microphone permission can be granted

---

## 5) Environment configuration

Root `.env`:

```env
GOOGLE_API_KEY=your_key_here
# Optional override
# GEMINI_MODEL=gemini-2.5-flash-native-audio-latest
```

Frontend optional flag:

```env
# default false in runtime toggles unless enabled
NEXT_PUBLIC_SEND_VIDEO_TO_AGENT=true
```

---

## 6) Fallback strategy (Google-ecosystem friendly)

When live generation errors occur (quota/resource/model availability):

1. Backend emits `fallback_mode` event with reason.
2. Frontend visibly switches to fallback status.
3. Local continuity assistant keeps interaction alive.
4. Heartbeat + connection stats keep proving realtime operation.
5. Typed command path remains functional for demo continuity.

This prevents dead demos when API keys are constrained.

---

## 7) Demo script (recommended <4 minutes)

1. Start with one-line problem statement.
2. Show voice + camera + orb response in realtime.
3. Interrupt model mid-speech (barge-in).
4. Toggle vision (`V`) and mic mute (`M`) live.
5. Trigger fallback scenario and show graceful continuity.
6. Close with architecture diagram and deployment proof.

---

## 8) Deployment proof assets

- `deployment/cloudbuild.yaml`
- `deployment/cloudrun-service.yaml`
- `Dockerfile`
- `architecture_diagram.md`

These files are intended to support the “proof of Google Cloud deployment” requirement in submission.

---

## 9) Troubleshooting quick map

- **`model not found` / bidiGenerateContent**
  - Set a supported model in `.env`.
- **`quota exceeded`**
  - Fallback mode will auto-enable; reduce vision traffic and retry later.
- **camera not visible**
  - grant browser permissions; confirm feed mounted.
- **backend not reachable**
  - ensure port `8080` is listening and frontend websocket URL is correct.

---

## 10) Submission checklist

- [ ] Public repo with reproducible setup
- [ ] <4 min demo video showing live features (no mockups)
- [ ] Architecture diagram included
- [ ] Cloud deployment proof included
- [ ] README maps features to judging rubric
- [ ] Bonus: post build-writeup + hashtag + IaC/deploy automation evidence

---

## 11) Google Cloud Shell Deployment (Copy-Paste Ready)

### One-Command Deploy

```bash
git clone https://github.com/Direwolfe999/SynAegis.git && cd SynAegis && export GOOGLE_API_KEY="your_key_here" && chmod +x setup_env.sh && ./setup_env.sh && BACKEND_PORT=8080 python3 backend/main_production.py
```

### Step-by-Step in Cloud Shell

```bash
# 1. Clone
git clone https://github.com/Direwolfe999/SynAegis.git
cd SynAegis

# 2. Set API key (get from https://aistudio.google.com/apikey)
export GOOGLE_API_KEY="your_key_here"

# 3. Run setup
./setup_env.sh

# 4. Start backend on port 8080
BACKEND_PORT=8080 python3 backend/main_production.py

# 5. Click "Web Preview" → port 8080 in top-right corner
```

### Linking to Your Project

1. Replace `https://github.com/Direwolfe999/SynAegis.git` with your fork URL
2. Update `GOOGLE_API_KEY` with your actual key from [Google AI Studio](https://aistudio.google.com/apikey)
3. Rest of commands stay the same

**No billing account needed. Free tier only.**
