import asyncio
import logging
from datetime import datetime
from backend.services.websocket_manager import manager
from backend.routers.cloud import cloud_overview
from backend.routers.security import security_overview
from backend.services.gitlab_service import get_pipeline_stats


logger = logging.getLogger("synaegis.auto_actions")

class AutoActionEngine:
    def __init__(self):
        self.running = False
        self.task = None

    def start(self):
        if not self.running:
            self.running = True
            self.task = asyncio.create_task(self._loop())

    def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()

    async def _loop(self):
        loop_counter = 0
        pipelines_cache = {"running": 0, "total": 0}
        while self.running:
            try:
                await asyncio.sleep(5) # wait 5 seconds per tick
                loop_counter += 1
                
                # Fetch state
                cloud = await cloud_overview()
                security = await security_overview()
                
                # Only hit external gitlab API every 2nd tick (~10s) to be snappier for the demo
                if loop_counter % 2 == 1 or loop_counter == 1:
                    pipelines_cache = await get_pipeline_stats()
                pipelines = pipelines_cache
                
                # Check Triggers
                events = []
                if cloud.get("cpu_usage", 0) > 80:
                    events.append({"type": "HIGH_CPU", "details": cloud})
                if security.get("threats", 0) > 5:
                    events.append({"type": "SECURITY_ALERT", "details": security})
                if pipelines.get("failed", 0) > 0:
                    events.append({"type": "PIPELINE_FAILED", "details": pipelines})

                # Process AI Action per event
                for event in events:
                    # In a real system we'd use Gemini tool calling, we mock the decision logic for speed
                    action = await self.decide_and_act(event)
                    if action:
                        message = {
                            "timestamp": datetime.utcnow().isoformat(),
                            "event": event["type"],
                            "action_taken": action["name"],
                            "result": action["result"],
                            "status": "success"
                        }
                        await manager.broadcast(message, "synaegis") # Alert WarRoom / AI log

                # Push global dashboard update continuously
                dashboard_payload = {
                     "health_score": max(0, 100 - (cloud.get("cpu_usage",0)*0.2) - (security.get("threats",0)*2) - (pipelines.get("failed",0)*3)),
                     "cloud": cloud,
                     "security": security,
                     "pipelines": pipelines,
                     "insights": [e["type"] for e in events] if events else ["System operating optimally"]
                }
                await manager.broadcast(dashboard_payload, "dashboard")
                
            except Exception as e:
                logger.error(f"Auto-action engine error: {e}")

    async def decide_and_act(self, event):
        # AI decision mock based on rules
        if event["type"] == "PIPELINE_FAILED":
            return {"name": "auto_fix_pipeline", "result": "Triggered semantic code patch via AI"}
        elif event["type"] == "HIGH_CPU":
            return {"name": "scale_service", "result": "Scaled cluster out by 2 nodes"}
        elif event["type"] == "SECURITY_ALERT":
            return {"name": "scan_vulnerabilities", "result": "Blocked malicious IPs and patched WAF"}
        return None

action_engine = AutoActionEngine()
