from fastapi import APIRouter
from pydantic import BaseModel
from fastapi import Request
from backend.services.websocket_manager import manager
from backend.services.gitlab_service import get_all_pipelines, apply_pipeline_patch, trigger_pipeline as s_trigger_pipeline, cancel_pipeline_run, get_pipeline_logs
                                                                             
router = APIRouter()

class PatchRequest(BaseModel):
    pipeline_id: str
    failure_log: str | None = None
    repo: str | None = None
    branch: str | None = None

class ResolveRequest(BaseModel):
    status: str

@router.get("/pipeline/list")
async def list_pipelines():
    return await get_all_pipelines()

@router.post("/pipeline/trigger")
async def trigger_pipeline(project_id: str):
    return await s_trigger_pipeline()

@router.post("/pipeline/cancel")
async def cancel_pipeline(pipeline_id: str):
    return await cancel_pipeline_run(pipeline_id)

@router.get("/pipeline/logs/{pipeline_id}")
async def get_logs(pipeline_id: str):
    return await get_pipeline_logs(pipeline_id)

@router.get("/pipeline/metrics")
async def get_pipeline_metrics():
    return {"success_rate": "98%", "avg_duration_min": 4.2}

@router.post("/pipeline/apply-patch")
async def apply_patch(data: PatchRequest):
    return await apply_pipeline_patch(data)




@router.post("/webhook/gitlab")
async def gitlab_webhook(request: Request):
    payload = await request.json()
    object_kind = payload.get("object_kind")
    
    if object_kind == "pipeline":
        pipeline_attr = payload.get("object_attributes", {})
        status = pipeline_attr.get("status")
        pipeline_id = pipeline_attr.get("id")
        
        # Broadcast the pipeline status via WebSocket
        await manager.broadcast(
            "pipeline",
            {
                "type": "pipeline_update",
                "pipeline_id": pipeline_id,
                "status": status,
                "detail": payload
            }
        )
        return {"status": "received"}
    
    return {"status": "ignored"}
