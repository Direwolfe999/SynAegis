from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
import sqlite3
import uuid
import secrets
import bcrypt
import json
from datetime import datetime
from backend.database import get_db
from backend.schemas.settings_schema import (
    ProfileUpdate, SecurityUpdate, APIKeyCreate, APIKeyResponse, 
    PreferenceUpdate, IntegrationUpdate, IntegrationResponse
)

router = APIRouter(prefix="/settings", tags=["settings"])

def get_current_user_id():
    return "MOCK_USER_ID" # Hardcode for auth simplicity

@router.get("/profile")
def get_profile():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT first_name, last_name, email, bio FROM users LIMIT 1")
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)

@router.put("/profile")
def update_profile(profile: ProfileUpdate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users SET first_name=?, last_name=?, email=?, bio=? 
        WHERE id=(SELECT id FROM users LIMIT 1)
    ''', (profile.first_name, profile.last_name, profile.email, profile.bio))
    conn.commit()
    return {"message": "Profile updated successfully"}

@router.put("/security")
def update_security(sec: SecurityUpdate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users LIMIT 1")
    row = cursor.fetchone()
    if not bcrypt.checkpw(sec.current_password.encode('utf-8'), row['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid current password")
    
    new_hash = bcrypt.hashpw(sec.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor.execute("UPDATE users SET password_hash=? WHERE id=(SELECT id FROM users LIMIT 1)", (new_hash,))
    conn.commit()
    return {"message": "Password updated successfully"}

@router.get("/api-keys")
def list_api_keys():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, token_prefix, created_at FROM api_keys")
    rows = cursor.fetchall()
    return [dict(r) for r in rows]

@router.post("/api-keys", response_model=APIKeyResponse)
def create_api_key(key: APIKeyCreate):
    conn = get_db()
    cursor = conn.cursor()
    
    token = "syn_" + secrets.token_hex(20)
    token_hash = bcrypt.hashpw(token.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    prefix = token[:8] + "..." + token[-4:]
    key_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    cursor.execute('''
        INSERT INTO api_keys (id, user_id, name, token_hash, token_prefix, created_at)
        VALUES (?, 'MOCK_USER', ?, ?, ?, ?)
    ''', (key_id, key.name, token_hash, prefix, now))
    conn.commit()
    
    return APIKeyResponse(id=key_id, name=key.name, token_prefix=prefix, created_at=now, token_full=token)

@router.delete("/api-keys/{key_id}")
def delete_api_key(key_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM api_keys WHERE id=?", (key_id,))
    conn.commit()
    return {"message": "API Key deleted"}

@router.get("/preferences")
def get_preferences():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT theme, ui_density, default_ai_model, log_retention, notifications FROM preferences LIMIT 1")
    row = cursor.fetchone()
    prefs = dict(row)
    prefs["notifications"] = json.loads(prefs["notifications"])
    return prefs

@router.put("/preferences")
def update_preferences(prefs: PreferenceUpdate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE preferences SET theme=?, ui_density=?, default_ai_model=?, log_retention=?, notifications=?
    ''', (prefs.theme, prefs.ui_density, prefs.default_ai_model, prefs.log_retention, json.dumps(prefs.notifications)))
    conn.commit()
    return {"message": "Preferences updated successfully"}

@router.get("/integrations")
def list_integrations():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, provider, status FROM integrations")
    rows = cursor.fetchall()
    return [dict(r) for r in rows]

@router.post("/integrations")
def add_integration(integration: IntegrationUpdate):
    conn = get_db()
    cursor = conn.cursor()
    int_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO integrations (id, user_id, provider, token, status)
        VALUES (?, 'MOCK_USER', ?, ?, 'connected')
    ''', (int_id, integration.provider, integration.token))
    conn.commit()
    return {"message": "Integration linked successfully"}

@router.delete("/integrations/{provider}")
def remove_integration(provider: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM integrations WHERE provider=?", (provider,))
    conn.commit()
    return {"message": "Integration unlinked successfully"}
