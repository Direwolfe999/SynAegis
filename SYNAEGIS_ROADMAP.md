# SynAegis - The Voice-Activated DevOps War Room

## The Plan

1. **Deployability & Vercel**: 
   - **Frontend**: Yes, the Next.js frontend deploys perfectly to Vercel. You connect your GitHub repo, set the root directory to `frontend`, and define `NEXT_PUBLIC_BACKEND_WS_URL`.
   - **Backend**: **No**, Vercel is serverless and does not support long-lived WebSocket connections (which `FastAPI` + `gemini-live` require). The backend must be deployed to **Google Cloud Run** (which you already have configs for) or **Railway/Render**.

2. **SynAegis Alignment**: We will shift the Kinesis "Chatbot" system into a "GitLab Webhook + Voice DevOps Agent". 

## Features & To-Do List

### Phase 1: Core Architecture & Setup
- [ ] **1.1 Vercel & GCP Deployment Readiness**
  - Verify `frontend/` builds clean for Vercel.
  - Ensure `backend/` Dockerfile and `cloudrun-service.yaml` expose WebSockets and `/webhook` for GCP.
- [ ] **1.2 GitLab Setup**
  - Set up a GitLab Account & Repo.
  - Generate GitLab PAT (Personal Access Token).
  - Add `GITLAB_URL`, `GITLAB_TOKEN`, `GITLAB_PROJECT_ID` to `.env`.
- [ ] **1.3 Backend Foundation**
  - Create `backend/gitlab_tools.py` with the raw API wrappers (`python-gitlab` library).
  - Update `backend/main_production.py` to route events to a new `/webhook/gitlab` endpoint.

### Phase 2: Webhooks (Event-Driven Agents)
- [ ] **2.1 Vulnerability Fix (Feature 4)**: React to Security Webhook -> Analyze Code -> Open MR.
- [ ] **2.2 Flaky Test Healer (Feature 5)**: React to Pipeline Webhook -> Analyze Test Logs -> Patch -> Re-run.
- [ ] **2.3 Compliance Auditor (Feature 6)**: React to PR Merge -> Generate PDF Report.
- [ ] **2.4 Release Notes (Feature 15)**: React to Tag Webhook -> Aggregate MRs -> Publish Release.

### Phase 3: The "War Room" Voice/Vision UI (Next.js)
- [ ] **3.1 Voice Rollbacks (Feature 1)**: Bind spoken "Roll back pipeline" to `cancel_pipeline` tool.
- [ ] **3.2 Architecture Vision (Feature 2)**: Bind camera capture of diagrams to Epic/Issue generation tools.
- [ ] **3.3 Voice Standup (Feature 3)**: Bind spoken "Assign issue 45" to issue routing tools.
- [ ] **3.4 Cloud Provisioning (Feature 8)**: Bind spoken "New microservice" to commit/Terraform generation.
- [ ] **3.5 Onboarding Buddy (Feature 14)**: Bind spoken UI questions to Repo Search tool.

### Phase 4: Big Integrations (GCP & Anthropic)
- [ ] **4.1 Log Pattern Triage (Feature 9)**: Fetch Stackdriver GCP logs, route to GitLab Issues.
- [ ] **4.2 Anthropic Summaries (Feature 10)**: Add Claude API key. Trigger Claude on MR creation to generate a risk summary.

### Phase 5: Green Agent (Cron Jobs)
- [ ] **5.1 Zombie Reaper (Feature 11)**: Script to detect idle resources and shut down old GitLab Review apps / GCP instances.
- [ ] **5.2 Carbon Optimizer (Feature 12)**: Calculate pipeline compute time -> Estimate carbon -> Comment on PR.
- [ ] **5.3 Build Scheduling (Feature 13)**: Delay non-critical pipelines if WattTime API shows dirty grid energy.

### Phase 6: Sync & Polish
- [ ] **6.1 UI Overhaul**: Rename all Kinesis branding to SynAegis. Update the Orb to reflect "War Room" status.
- [ ] **6.2 System Sync**: Test end-to-end (Voice -> Action -> Webhook -> Frontend Notification).
