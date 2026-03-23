from fastapi import APIRouter
from backend.database import get_db

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

@router.get("/status")
def onboarding_status():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT onboarding_completed FROM users LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    return {"completed": bool(row["onboarding_completed"]) if row else False}

@router.post("/complete")
def complete_onboarding():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET onboarding_completed = 1")
    conn.commit()
    conn.close()
    return {"status": "ok"}
