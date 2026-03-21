import os
import requests
import json
from typing import Dict, Any, List, Optional
from pathlib import Path

# Load environment variables manually to avoid missing dependency issues
def load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ[k.strip()] = v.strip()

load_env()

GITLAB_URL = os.getenv("GITLAB_URL", "https://gitlab.com/api/v4")
GITLAB_TOKEN = os.getenv("GITLAB_TOKEN")
PROJECT_ID = os.getenv("GITLAB_PROJECT_ID")

def _get_headers() -> Dict[str, str]:
    if not GITLAB_TOKEN:
        return {"Content-Type": "application/json"}
    return {"PRIVATE-TOKEN": GITLAB_TOKEN, "Content-Type": "application/json"}

def check_auth() -> str:
    """Check if GitLab auth is configured."""
    if not GITLAB_TOKEN or not PROJECT_ID:
        return "WARNING: GITLAB_TOKEN or GITLAB_PROJECT_ID not found in .env"
    r = requests.get(f"{GITLAB_URL}/projects/{PROJECT_ID}", headers=_get_headers())
    if r.status_code == 200:
        return f"Successfully authenticated to project: {r.json().get('name')}"
    return f"Auth failed with status {r.status_code}: {r.text}"

def create_gitlab_issue(title: str, description: str) -> str:
    """Creates a new issue in the GitLab project. Action: Create Issue."""
    if not PROJECT_ID: return "Error: No GITLAB_PROJECT_ID configured in .env"
    payload = {"title": title, "description": description}
    r = requests.post(f"{GITLAB_URL}/projects/{PROJECT_ID}/issues", headers=_get_headers(), json=payload)
    if r.status_code in (200, 201):
        data = r.json()
        return f"Issue created successfully: {data.get('web_url')} (IID: {data.get('iid')})"
    return f"Failed to create issue: {r.text}"

def list_gitlab_issues(state: str = "opened") -> str:
    """Lists current issues in the GitLab project."""
    if not PROJECT_ID: return "Error: No GITLAB_PROJECT_ID configured in .env"
    r = requests.get(f"{GITLAB_URL}/projects/{PROJECT_ID}/issues?state={state}", headers=_get_headers())
    if r.status_code == 200:
        issues = r.json()
        if not issues: return "No open issues found."
        formatted = [f"#{iss['iid']}: {iss['title']} (Assignee: {iss.get('assignee', {}).get('name', 'None') if iss.get('assignee') else 'None'})" for iss in issues[:10]]
        return "Current Issues:\n" + "\n".join(formatted)
    return f"Failed to list issues: {r.text}"

def cancel_gitlab_pipeline(pipeline_id: int) -> str:
    """Cancels a given GitLab pipeline currently running. Action: Rollback/Cancel Pipeline."""
    if not PROJECT_ID: return "Error: No GITLAB_PROJECT_ID configured in .env"
    r = requests.post(f"{GITLAB_URL}/projects/{PROJECT_ID}/pipelines/{pipeline_id}/cancel", headers=_get_headers())
    return "Pipeline cancelled successfully." if r.status_code in (200, 201) else f"Failed to cancel: {r.text}"

def create_gitlab_branch(branch_name: str, ref: str = "main") -> str:
    """Creates a new branch on GitLab."""
    if not PROJECT_ID: return "Error: No GITLAB_PROJECT_ID configured in .env"
    payload = {"branch": branch_name, "ref": ref}
    r = requests.post(f"{GITLAB_URL}/projects/{PROJECT_ID}/repository/branches", headers=_get_headers(), json=payload)
    return f"Branch {branch_name} created." if r.status_code in (200, 201) else f"Failed to create branch: {r.text}"

def create_gitlab_merge_request(source_branch: str, target_branch: str, title: str, description: str) -> str:
    """Creates a merge request from a source branch to a target branch."""
    if not PROJECT_ID: return "Error: No GITLAB_PROJECT_ID configured in .env"
    payload = {"source_branch": source_branch, "target_branch": target_branch, "title": title, "description": description}
    r = requests.post(f"{GITLAB_URL}/projects/{PROJECT_ID}/merge_requests", headers=_get_headers(), json=payload)
    if r.status_code in (200, 201):
        return f"Merge Request created successfully: {r.json().get('web_url')}"
    return f"Failed to create MR: {r.text}"

# Note: In standard Gemini function calling, we provide the python function pointers directly.
GILAB_TOOLS_LIST = [
    create_gitlab_issue, 
    list_gitlab_issues, 
    cancel_gitlab_pipeline, 
    create_gitlab_branch, 
    create_gitlab_merge_request
]
