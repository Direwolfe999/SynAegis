from fastapi import APIRouter
from backend.services.gitlab_service import get_pipeline_stats
from backend.services.metrics_service import get_system_metrics
from backend.services.ai_service import get_ai_activity, generate_cross_system_insights
from backend.routers.cloud import cloud_overview
from backend.routers.security import security_overview

router = APIRouter()

@router.get("/dashboard/overview")
async def get_dashboard_overview():
    pipelines = await get_pipeline_stats()
    metrics = await get_system_metrics()
    ai = await get_ai_activity()

    return {
        "system_health": metrics["health_score"],
        "active_incidents": metrics["incidents"],
        "running_pipelines": pipelines["running"],
        "active_services": metrics["services"],
        "carbon_usage": metrics["carbon"],
        "ai_activity": ai["requests_per_min"],
        "cpu_usage": metrics["cpu_usage"],
        "ram_usage": metrics["ram_usage"],
        "total_pipelines": pipelines["total"]
    }

@router.get("/dashboard/activity")
async def get_activity_feed():
    return await get_system_metrics(activity=True)

@router.get("/dashboard/insights")
async def get_ai_insights():
    return await generate_cross_system_insights()

def calculate_health(cloud, security, pipelines):
    score = 100
    score -= cloud.get("cpu_usage", 0) * 0.2
    score -= security.get("active_incidents", 0) * 4
    score -= pipelines.get("failed", 0) * 5
    return max(0, int(score))

@router.get("/dashboard/full-overview")
async def full_dashboard():
    cloud = await cloud_overview()
    security = await security_overview()
    pipelines = await get_pipeline_stats()
    
    # Adding some simple list as insights simulation
    insights = [
        "High CPU usage detected on active pipeline",
        "Potential vulnerability in recent deployment",
        "Idle services increasing infrastructure cost"
    ]

    return {
        "health_score": calculate_health(cloud, security, pipelines),
        "cloud": cloud,
        "security": security,
        "pipelines": pipelines,
        "insights": insights
    }
