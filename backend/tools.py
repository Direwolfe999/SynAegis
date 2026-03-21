from __future__ import annotations

import base64
import json
import os
import re
import time
from datetime import datetime, timezone
from typing import Any

import google.auth
from google.api_core.exceptions import GoogleAPIError
from google.cloud import bigquery
from google.cloud import secretmanager, storage
from googleapiclient.discovery import build


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _project_id() -> str:
    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    if project:
        return project

    _, detected = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    if not detected:
        raise RuntimeError("Unable to resolve project id. Set GOOGLE_CLOUD_PROJECT.")
    return detected


def _cloud_credentials():
    return google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])[0]


def self_upgrade_protocol(api_name: str) -> dict[str, Any]:
    project = _project_id()
    credentials = _cloud_credentials()
    svc = build("serviceusage", "v1", credentials=credentials, cache_discovery=False)

    name = f"projects/{project}/services/{api_name}"
    current = svc.services().get(name=name).execute().get("state", "UNKNOWN")
    if current == "ENABLED":
        return {
            "ok": True,
            "api": api_name,
            "state": current,
            "action": "already_enabled",
            "timestamp": _now_iso(),
        }

    operation = svc.services().enable(name=name, body={}).execute()
    return {
        "ok": True,
        "api": api_name,
        "state": current,
        "action": "enable_started",
        "operation": operation.get("name"),
        "timestamp": _now_iso(),
    }


def neural_memory_snapshot(data: str, mime_type: str = "application/json", object_path: str | None = None) -> dict[str, Any]:
    project = _project_id()
    bucket = os.getenv("SynAegis_MEMORY_BUCKET", "")
    if not bucket:
        raise RuntimeError("SynAegis_MEMORY_BUCKET is not configured.")

    payload: bytes
    if mime_type == "application/json":
        parsed = json.loads(data)
        payload = json.dumps(parsed, separators=(",", ":")).encode("utf-8")
    elif mime_type.startswith("image/") or mime_type.startswith("audio/"):
        payload = base64.b64decode(data)
    else:
        payload = data.encode("utf-8")

    ext = "json" if mime_type == "application/json" else mime_type.split("/")[-1]
    target = object_path or f"snapshots/{int(time.time() * 1000)}.{ext}"

    storage_client = storage.Client(project=project)
    blob = storage_client.bucket(bucket).blob(target)
    blob.upload_from_string(payload, content_type=mime_type)

    return {
        "ok": True,
        "bucket": bucket,
        "path": target,
        "gs_uri": f"gs://{bucket}/{target}",
        "bytes": len(payload),
        "content_type": mime_type,
        "timestamp": _now_iso(),
    }


def system_health_check() -> dict[str, Any]:
    project = _project_id()
    credentials = _cloud_credentials()

    checks: dict[str, Any] = {
        "project": project,
        "timestamp": _now_iso(),
        "latency_ms": None,
        "billing": {"enabled": False, "account_name": None},
        "monitoring": {"ok": False, "series_seen": 0},
        "roles": {
            "service_usage_admin": {"ok": False},
            "storage_object_admin": {"ok": False},
            "secret_manager_accessor": {"ok": False},
            "monitoring_editor": {"ok": False},
        },
    }

    # Service Usage check + latency sample
    try:
        t0 = time.perf_counter()
        serviceusage = build("serviceusage", "v1", credentials=credentials, cache_discovery=False)
        serviceusage.services().get(name=f"projects/{project}/services/aiplatform.googleapis.com").execute()
        checks["latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
        checks["roles"]["service_usage_admin"] = {"ok": True}
    except Exception as exc:
        checks["roles"]["service_usage_admin"] = {"ok": False, "error": str(exc)}

    # Billing status
    try:
        billing = build("cloudbilling", "v1", credentials=credentials, cache_discovery=False)
        billing_info = billing.projects().getBillingInfo(name=f"projects/{project}").execute()
        checks["billing"] = {
            "enabled": bool(billing_info.get("billingEnabled", False)),
            "account_name": billing_info.get("billingAccountName"),
        }
    except Exception as exc:
        checks["billing"] = {"enabled": False, "error": str(exc)}

    # Monitoring read probe
    try:
        monitoring = build("monitoring", "v3", credentials=credentials, cache_discovery=False)
        interval_end = datetime.now(timezone.utc)
        interval_start_ts = interval_end.timestamp() - 600
        start_str = datetime.fromtimestamp(interval_start_ts, timezone.utc).isoformat().replace("+00:00", "Z")
        end_str = interval_end.isoformat().replace("+00:00", "Z")
        series = monitoring.projects().timeSeries().list(
            name=f"projects/{project}",
            filter='metric.type = "compute.googleapis.com/instance/cpu/utilization"',
            interval_startTime=start_str,
            interval_endTime=end_str,
            view="HEADERS",
            pageSize=1,
        ).execute()
        checks["monitoring"] = {"ok": True, "series_seen": len(series.get("timeSeries", []))}
        checks["roles"]["monitoring_editor"] = {"ok": True}
    except Exception as exc:
        checks["monitoring"] = {"ok": False, "error": str(exc)}
        checks["roles"]["monitoring_editor"] = {"ok": False, "error": str(exc)}

    # Secret Manager probe
    try:
        sm = secretmanager.SecretManagerServiceClient()
        list(sm.list_secrets(request={"parent": f"projects/{project}", "page_size": 1}))
        checks["roles"]["secret_manager_accessor"] = {"ok": True}
    except Exception as exc:
        checks["roles"]["secret_manager_accessor"] = {"ok": False, "error": str(exc)}

    # Storage probe
    try:
        list(storage.Client(project=project).list_buckets(page_size=1))
        checks["roles"]["storage_object_admin"] = {"ok": True}
    except Exception as exc:
        checks["roles"]["storage_object_admin"] = {"ok": False, "error": str(exc)}

    return checks


def fetch_secret(secret_name: str, version: str = "latest") -> dict[str, Any]:
    project = _project_id()
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project}/secrets/{secret_name}/versions/{version}"
    payload = client.access_secret_version(name=name).payload.data.decode("utf-8")
    return {
        "ok": True,
        "secret_name": secret_name,
        "version": version,
        "value": payload,
        "timestamp": _now_iso(),
    }


def billing_spend_report(hours: int = 24) -> dict[str, Any]:
    project = _project_id()
    export_table = os.getenv("SynAegis_BILLING_EXPORT_TABLE", "").strip()

    if not export_table:
        billing = build("cloudbilling", "v1", credentials=_cloud_credentials(), cache_discovery=False)
        billing_info = billing.projects().getBillingInfo(name=f"projects/{project}").execute()
        return {
            "ok": False,
            "project": project,
            "hours": hours,
            "reason": "billing_export_table_missing",
            "billing_enabled": bool(billing_info.get("billingEnabled", False)),
            "hint": "Set SynAegis_BILLING_EXPORT_TABLE to <project>.<dataset>.<table> for cent-accurate spend reports.",
            "timestamp": _now_iso(),
        }

    match = re.match(r"^([^.]+)\.([^.]+)\.([^.]+)$", export_table)
    if not match:
        raise RuntimeError("SynAegis_BILLING_EXPORT_TABLE must be in the format <project>.<dataset>.<table>.")

    table_project, dataset, table = match.groups()
    client = bigquery.Client(project=table_project)

    query = f"""
        SELECT
          ROUND(COALESCE(SUM(cost), 0), 6) AS gross_cost,
          ROUND(COALESCE(SUM((SELECT COALESCE(SUM(c.amount), 0) FROM UNNEST(credits) c)), 0), 6) AS credits_total,
          ROUND(
            COALESCE(SUM(cost), 0) +
            COALESCE(SUM((SELECT COALESCE(SUM(c.amount), 0) FROM UNNEST(credits) c)), 0),
            6
          ) AS net_cost
        FROM `{table_project}.{dataset}.{table}`
        WHERE usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @hours HOUR)
    """

    result = client.query(
        query,
        job_config=bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter("hours", "INT64", max(1, int(hours)))]
        ),
    ).result()
    row = next(iter(result), None)

    gross = float(getattr(row, "gross_cost", 0.0) or 0.0)
    credits_total = float(getattr(row, "credits_total", 0.0) or 0.0)
    net = float(getattr(row, "net_cost", 0.0) or 0.0)

    return {
        "ok": True,
        "project": project,
        "table": export_table,
        "window_hours": max(1, int(hours)),
        "gross_cost_usd": gross,
        "credits_usd": credits_total,
        "net_cost_usd": net,
        "net_cost_cents": round(net * 100.0, 2),
        "timestamp": _now_iso(),
    }


def verify_required_capabilities() -> dict[str, Any]:
    try:
        report = system_health_check()
        report["ok"] = all(v.get("ok", False) for v in report["roles"].values())
        return report
    except GoogleAPIError as exc:
        return {"ok": False, "error": str(exc), "timestamp": _now_iso()}
    except Exception as exc:
        return {"ok": False, "error": str(exc), "timestamp": _now_iso()}
