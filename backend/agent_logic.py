"""Compatibility shim. Main implementation now lives in backend.main and backend.tools."""

from typing import Any

from google.genai import types

from backend.main import SynAegis_SYSTEM_INSTRUCTION as SYSTEM_INSTRUCTION
from backend.tools import self_upgrade_protocol
from backend.tools import system_health_check

get_current_weather = system_health_check
search_database = self_upgrade_protocol

TOOL_REGISTRY: dict[str, Any] = {
    "self_upgrade_protocol": self_upgrade_protocol,
    "system_health_check": system_health_check,
}


def get_low_thinking_config() -> types.ThinkingConfig:
    try:
        return types.ThinkingConfig(thinking_level="low")
    except Exception:
        return types.ThinkingConfig(thinking_budget=0)


def get_tool_declarations() -> list[types.Tool]:
    return []


def create_adk_agent() -> Any:
    return None


ADK_AGENT = None


def vertex_agent_engine_deploy_snippet() -> str:
    return "Use backend.main ADK agent/runner for deployment wiring."
