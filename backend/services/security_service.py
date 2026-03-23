import asyncio
import random
import logging
from backend.services.websocket_manager import manager

logger = logging.getLogger("synaegis.security")

class SecurityState:
    def __init__(self):
        self.total_threats = 1248
        self.active_incidents = 3
        self.vulnerabilities = 14
        self.security_score = 82
        self.is_running = False
        
    def generate_drift(self):
        # drift the metrics slightly
        if random.random() > 0.5:
            self.total_threats += random.randint(1, 5)
        
        if random.random() > 0.8:
            # occasionally incident changes
            self.active_incidents = max(0, self.active_incidents + random.randint(-1, 2))
            
        if random.random() > 0.9:
            self.vulnerabilities = max(0, self.vulnerabilities + random.randint(-1, 1))
            
        # recalibrate score based on other metrics
        base_score = 100 - (self.active_incidents * 5) - (self.vulnerabilities * 1.5)
        base_score = max(10, min(100, base_score))
        
        # small jitter
        self.security_score = int(base_score + random.randint(-2, 2))
        self.security_score = max(10, min(100, self.security_score))

    def get_metrics(self):
        return {
            "total_threats": self.total_threats,
            "active_incidents": self.active_incidents,
            "vulnerabilities": self.vulnerabilities,
            "security_score": self.security_score
        }

    async def update_loop(self):
        self.is_running = True
        while self.is_running:
            await asyncio.sleep(3) # updates every 3 seconds
            self.generate_drift()
            
            # emit websocket update
            await manager.broadcast({
                "type": "metrics_update",
                "data": self.get_metrics()
            }, "security")

security_state = SecurityState()
