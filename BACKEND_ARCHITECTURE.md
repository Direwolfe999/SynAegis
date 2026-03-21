# SynAegis (Kinesis) Backend Architecture Overview

This document provides a single-file summary of the backend system architecture, APIs, AI integrations, and tooling currently deployed on the FastAPI layer.

## 1. Core Server Layer (`backend/main_production.py`)
- **Framework**: FastAPI / Uvicorn server (typically running on `localhost:8000`).
- **Function**: The central orchestrator handling incoming HTTP REST requests and long-lived WebSocket connections.
- **Role**: Maintains persistent connections for the "Live War Room", acts as a proxy to the Google Gemini models, handles authentication/CORS, and serves webhooks for Git operations.

## 2. Global AI Engine (`google-genai` SDK)
- **Primary Model**: `gemini-2.5-flash` / `gemini-2.0-flash-exp` via the new `google-genai` Python SDK.
- **Multimodal Live API**: Leverages `client.aio.live.connect` to stream continuous Audio, Audio+Video, or Text back and forth with the agent in real-time.
- **Quotas and Degradation**: Incorporates a `MODEL_CASCADE` list, catching `429` (Quota limits) and instantly pivoting to fallback models (e.g., `gemini-1.5-pro` -> `gemini-2.0-flash-lite`) seamlessly.

## 3. Communication Endpoints
- **`GET /ws/SynAegis` (WebSocket)**: 
  - The ultra-low-latency real-time bidirectional connection utilized by the frontend's War Room.
  - Receives Base64 Audio/Image blobs, issues function calls to registered tools, and streams audio out incrementally.
- **`POST /chat` (REST / JSON)**: 
  - Originally routed over Bidi websockets, but patched to invoke standard `models.generate_content` due to Bidi native audio strict type enforcement. 
  - Used by the new UI dashboard and non-live text requests.
- **`POST /webhook/gitlab`**: 
  - Listens to pipeline failures, merge requests, and commits. Triggers automated summaries and alerts.

## 4. Agent Tool Registry (Function Calling layer)
The FastAPI server binds specific Python methods as tools that the Live Agent can execute autonomously based on user commands. These are localized in respective Python files:

- **GitLab Operations (`backend/gitlab_tools.py`)**:
  - `search_gitlab_repositories`: Find projects across GitLab instances.
  - `create_gitlab_issue` / `assign_gitlab_issue`: Manipulate the ticket pipeline.
  - `trigger_gitlab_pipeline` / `cancel_gitlab_pipeline`: CI/CD orchestration.
  - `gitlab_code_review`: Automatically review Merge Request diffs via LLM.

- **GreenOps and Carbon Profiling (`backend/green_tools.py`)**:
  - `calculate_pipeline_carbon_footprint`: Determines emission costs of compute cycles.
  - `reap_zombie_environments`: Deallocates stale nodes draining power/money.

- **External Integrations (`backend/anthropic_tools.py` \& other AI)**:
  - Methods to dispatch specific summarization or analytical tasks out to Claude 3.5 Sonnet / Haiku when specific reasoning structures or secondary opinions are required.

## 5. Security & Flow
1. **Frontend Request** -> Reaches Next.js App Router -> Proxy/Fetch to FastAPI `:8000`
2. **CORS Middleware** -> Verifies request origin (allowing `localhost:3000`, `3001`, etc.)
3. **Session State** -> WarRoom maintains an active connection in-memory (`GeminiLiveSession`).
4. **Tool Dispatch** -> When Gemini responds with a `functionCall`, FastAPI executes the localized python function and feeds a `functionResponse` back into the Bidi stream.
5. **Data Return** -> The response is packaged and sent over the WebSocket (as audio/text) or HTTP (as JSON) over to the UI.

## TL;DR Architecture Diagram (Mental Model)
```text
[ Next.js SaaS UI + WarRoom ] 
        |        |
    (HTTP)    (WebSocket)
        v        v
[    FastAPI Application  ] -- (Function Calls) --> [ Custom Tools (GitLab, System, GreenOps) ]
        |
    (Google GenAI SDK)
        v
[ Gemini 2.5 Flash Bidi / REST API ]
```