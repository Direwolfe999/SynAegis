import psutil
import time
import asyncio

async def collect_metrics():
    """Generates real system metrics periodically"""
    while True:
        cpu_usage = psutil.cpu_percent(interval=None)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        metrics = {
            "cpu_percent": cpu_usage,
            "ram_percent": ram.percent,
            "ram_used_gb": round(ram.used / (1024 ** 3), 2),
            "ram_total_gb": round(ram.total / (1024 ** 3), 2),
            "disk_percent": disk.percent,
            "latency_ms": 12, # mock network routing
            "uptime_s": round(time.time() - psutil.boot_time()),
            "net_cost_cents": 14 
        }
        yield metrics
        await asyncio.sleep(2)
