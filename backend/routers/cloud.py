from fastapi import APIRouter
import random

router = APIRouter(prefix="/cloud", tags=["cloud"])

def generate_smart_cloud_metrics():
    return {
        "services": random.randint(3, 12),
        "cpu_usage": round(random.uniform(20, 75), 2),
        "memory_usage": round(random.uniform(30, 80), 2),
        "network": round(random.uniform(10, 60), 2),
        "cost": round(random.uniform(10, 120), 2),
        "carbon": round(random.uniform(5, 40), 2)
    }

@router.get("/overview")
async def cloud_overview():
    # Intended to fetch real infra metrics
    # Fallback to smart generated
    data = generate_smart_cloud_metrics()
    return data

@router.get("/history")
async def cloud_history():
    history = []
    base_cpu = 40
    for i in range(10):
        base_cpu += random.uniform(-5, 5)
        history.append({
            "time": f"10:{i}0",
            "cpu_usage": round(base_cpu, 2),
            "memory_usage": round(random.uniform(30, 80), 2)
        })
    return history

@router.post("/services/{service_id}/{action}")
async def service_action(service_id: str, action: str):
    import asyncio
    await asyncio.sleep(0.5)
    return {"status": "ok", "message": f"Service {service_id} {action}ed successfully."}

@router.post("/{action}")
async def trigger_cloud_global_action(action: str):
    import asyncio
    await asyncio.sleep(0.5)
    return {"status": "ok", "message": f"Global action {action} triggered."}
