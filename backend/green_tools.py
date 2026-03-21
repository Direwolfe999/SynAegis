import random

def calculate_pipeline_carbon(pipeline_duration_seconds: int) -> dict:
    """Mock API to calculate carbon footprint of a pipeline."""
    intensity = random.uniform(200.0, 400.0) # gCO2eq/kWh
    energy_kwh = (pipeline_duration_seconds / 3600) * 0.5 # Assume 500W server
    carbon_g = intensity * energy_kwh
    return {
        "duration_s": pipeline_duration_seconds,
        "grid_intensity_gCO2eq_kWh": round(intensity, 2),
        "total_carbon_g": round(carbon_g, 2),
        "verdict": "High intensity" if intensity > 300 else "Clean energy"
    }

def reap_zombie_environments() -> list:
    """Mock tool to find and reap stale review environments."""
    reaped = [
        {"env": "review/feature-x", "idle_days": 14, "cost_saved": "$12.50"},
        {"env": "review/old-bugfix", "idle_days": 30, "cost_saved": "$25.00"}
    ]
    return reaped
