from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.security_service import security_state

router = APIRouter(tags=["security"])

@router.get("/security/overview")
async def security_overview():
    metrics = security_state.get_metrics()
    return {
        "status": "secure" if metrics["active_incidents"] == 0 else "alert",
        "threats": metrics["total_threats"],
        "active_incidents": metrics["active_incidents"],
        "firewall": "active",
        "vulnerabilities": metrics["vulnerabilities"]
    }

@router.post("/security/block-ip")
async def block_ip():
    return {"status": "success", "message": "IP blocked successfully"}

@router.post("/security/revoke-token")
async def revoke_token():
    return {"status": "success", "message": "Tokens revoked globally"}

@router.post("/security/lock-account")
async def lock_account():
    return {"status": "success", "message": "Account locked successfully"}

@router.post("/security/isolate-node")
async def isolate_node():
    return {"status": "success", "message": "Node isolated successfully"}

@router.post("/security/action/ai-block")
async def ai_block():
    return {"status": "success", "message": "AI Auto-block executed"}

@router.post("/security/action/ai-patch")
async def ai_patch():
    return {"status": "success", "message": "AI Auto-patch executed"}

@router.get("/security/history")
async def security_history():
    return [
        {"timestamp": "08:00:00", "threats": 1240, "vulnerabilities": 14},
        {"timestamp": "09:00:00", "threats": 1242, "vulnerabilities": 14},
        {"timestamp": "10:00:00", "threats": 1245, "vulnerabilities": 14},
        {"timestamp": "11:00:00", "threats": 1248, "vulnerabilities": 14}
    ]
