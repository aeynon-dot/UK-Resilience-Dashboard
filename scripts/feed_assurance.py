"""Go-live assurance checks for registered public risk feeds.

The checks are deliberately read-only. They test endpoint reachability, basic
payload shape, collector output presence, freshness, provenance and duplicate
signal IDs. They do not modify current.json or any source system.
"""
import argparse
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from feed_health import classify_feed_health

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "data/source-registry.json"
CURRENT = ROOT / "data/current.json"
GO_LIVE = ROOT / "data/go-live-risk-set.json"
MAX_RESPONSE_BYTES = 2_000_000
HEAD = {"User-Agent": "UK-Resilience-Dashboard/2.4 feed-assurance"}

EXPECTED_KEYS = {
    "met-office-severe-weather-warnings": ("met_office", "items"),
    "environment-agency-flood-monitoring": ("england", None),
    "natural-resources-wales-flood-warning": ("wales", None),
    "sepa-flooding": ("scotland", None),
    "cisa-known-exploited-vulnerabilities": ("multi_domain", "cisa_kev"),
    "ncsc-rss-threat-intelligence": ("multi_domain", "ncsc"),
    "ukhsa-data-dashboard": ("multi_domain", "ukhsa"),
    "fsa-food-alerts": ("multi_domain", "fsa_food_alerts"),
    "usgs-earthquake-feed": ("multi_domain", "usgs_earthquakes"),
    "noaa-space-weather-k-index": ("multi_domain", "noaa_space_weather"),
    "neso-demand-data-update": ("multi_domain", "neso"),
}

RUNTIME_NAMES = {
    "met-office-severe-weather-warnings": "Met Office",
    "environment-agency-flood-monitoring": "Environment Agency",
    "natural-resources-wales-flood-warning": "Natural Resources Wales",
    "sepa-flooding": "SEPA",
    "cisa-known-exploited-vulnerabilities": "CISA KEV",
    "ncsc-rss-threat-intelligence": "NCSC",
    "ukhsa-data-dashboard": "UKHSA",
    "fsa-food-alerts": "FSA Food Alerts",
    "usgs-earthquake-feed": "USGS Earthquakes",
    "noaa-space-weather-k-index": "NOAA Space Weather",
    "neso-demand-data-update": "NESO",
}

def fetch(url, max_bytes=MAX_RESPONSE_BYTES, allow_truncate=False):
    req = urllib.request.Request(url, headers=HEAD)
    with urllib.request.urlopen(req, timeout=20) as response:
        raw = response.read(max_bytes if allow_truncate else max_bytes + 1)
        content_type = response.headers.get("Content-Type", "")
    if not allow_truncate and len(raw) > max_bytes:
        raise ValueError(f"response exceeded {max_bytes} byte safety limit")
    return raw, content_type

def parse_url(url):
    parsed = urlparse(url)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)

NESO_RESOURCE_SHOW = "https://api.neso.energy/api/3/action/resource_show?id=177f6fa4-ae49-4182-81ea-0c6b35f26ca6"

def live_shape(source_id, raw):
    text = raw.decode("utf-8", "ignore")
    if source_id in {"met-office-severe-weather-warnings", "ncsc-rss-threat-intelligence"}:
        root = ET.fromstring(raw)
        return len(root.findall(".//item")) >= 0
    if source_id == "usgs-earthquake-feed":
        value = json.loads(text)
        return isinstance(value.get("features"), list)
    if source_id == "noaa-space-weather-k-index":
        value = json.loads(text)
        return isinstance(value, list) and len(value) >= 1
    if source_id == "cisa-known-exploited-vulnerabilities":
        value = json.loads(text)
        return isinstance(value, dict) and isinstance(value.get("vulnerabilities"), list)
    if source_id == "fsa-food-alerts":
        value = json.loads(text)
        return isinstance(value, dict) and isinstance(value.get("items"), list)
    if source_id == "neso-demand-data-update":
        value = json.loads(text)
        result = value.get("result") if isinstance(value, dict) else None
        return (
            isinstance(value, dict)
            and value.get("success") is True
            and isinstance(result, dict)
            and isinstance(result.get("records"), list)
            and all(isinstance(record, dict) for record in result["records"])
        )
    if source_id == "environment-agency-flood-monitoring":
        value = json.loads(text)
        items = value.get("items") if isinstance(value, dict) else None
        if not isinstance(items, list):
            return False
        for item in items:
            if not isinstance(item, dict):
                return False
            severity_level = item.get("severityLevel")
            if (
                isinstance(severity_level, bool)
                or not isinstance(severity_level, int)
                or severity_level not in (1, 2, 3, 4)
            ):
                return False
        return True
    if source_id == "ukhsa-data-dashboard":
        return len(text) >= 1000 and "respiratory" in text.lower()
    if source_id in {"natural-resources-wales-flood-warning", "sepa-flooding"}:
        return len(text) >= 1000
    return False

def get_path(value, path):
    if not path:
        return None
    for key in path:
        if key is None:
            break
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value

def age_minutes(value, now):
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return max(0, (now - dt.astimezone(timezone.utc)).total_seconds() / 60)
    except ValueError:
        return None

def classify_assurance_health(item, feed_status):
    """Map assurance observations onto the canonical feed-health states."""
    checks = item.get("checks", [])
    by_name = {check.get("name"): check for check in checks}
    last_success = feed_status.get("last_success_at") if isinstance(feed_status, dict) else None

    if by_name.get("collector_output", {}).get("status") == "fail":
        return classify_feed_health(ok=False, has_last_success=bool(last_success))
    if by_name.get("availability", {}).get("status") == "fail":
        return classify_feed_health(ok=False, has_last_success=bool(last_success), degraded=bool(last_success))
    if by_name.get("payload_shape", {}).get("status") == "fail":
        return "degraded"
    if any(check.get("status") == "fail" for check in checks if check.get("name") in {"signal_ids_unique", "signal_provenance"}):
        return "degraded"
    if by_name.get("runtime_status", {}).get("status") == "fail":
        return classify_feed_health(ok=False, has_last_success=bool(last_success))
    if by_name.get("freshness", {}).get("status") == "stale":
        return "stale"
    return "healthy"
def current_signal_checks(current, registry_entry):
    source_name = registry_entry["name"]
    signals = current.get("risk_signals", [])
    matching = [s for s in signals if s.get("source") == source_name]
    result = {"signal_count": len(matching), "checks": []}
    if not matching:
        result["checks"].append({
            "name": "signal_presence",
            "status": "no_current_signal",
            "detail": "Feed may be healthy with zero current signals."
        })
        return result

    ids = [s.get("id") for s in matching]
    result["checks"].append({
        "name": "signal_ids_unique",
        "status": "pass" if len(ids) == len(set(ids)) else "fail",
    })
    for s in matching:
        provenance_ok = (
            bool(s.get("source"))
            and parse_url(s.get("source_url", ""))
            and bool(s.get("collected_at"))
            and isinstance(s.get("geography"), dict)
            and bool(s["geography"].get("scope"))
            and bool(s.get("confidence"))
            and bool(s.get("priority_band"))
        )
        result["checks"].append({
            "name": "signal_provenance",
            "status": "pass" if provenance_ok else "fail",
            "signal_id": s.get("id"),
        })
    return result

def run():
    now = datetime.now(timezone.utc)
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    current = json.loads(CURRENT.read_text(encoding="utf-8"))
    go_live = json.loads(GO_LIVE.read_text(encoding="utf-8"))

    go_live_ids = {
        source_id
        for domain in go_live.get("go_live_domains", [])
        for source_id in domain.get("sources", [])
    }

    results = []
    for entry in registry.get("sources", []):
        source_id = entry.get("id")
        if not entry.get("enabled") or source_id not in go_live_ids:
            continue

        item = {"id": source_id, "name": entry.get("name"), "status": "pass", "health_state": "healthy", "checks": []}
        endpoint = entry.get("endpoint")

        if not endpoint:
            item["status"] = "reference_only"
            item["checks"].append({"name": "endpoint", "status": "not_applicable"})
            results.append(item)
            continue

        if not parse_url(endpoint):
            item["status"] = "fail"
            item["checks"].append({"name": "endpoint", "status": "fail", "detail": "Invalid endpoint URL"})
            results.append(item)
            continue

        try:
            assurance_endpoint = NESO_RESOURCE_SHOW if source_id == "neso-demand-data-update" else endpoint
            web_limited = source_id in {"natural-resources-wales-flood-warning", "sepa-flooding", "ukhsa-data-dashboard"}
            raw, content_type = fetch(assurance_endpoint, 300_000 if web_limited else MAX_RESPONSE_BYTES, allow_truncate=web_limited)
            item["checks"].append({
                "name": "availability", "status": "pass",
                "bytes": len(raw), "content_type": content_type,
            })
            try:
                if source_id == "neso-demand-data-update":
                    value = json.loads(raw.decode("utf-8", "ignore"))
                    result = value.get("result") if isinstance(value, dict) else None
                    shaped = (
                        isinstance(value, dict)
                        and value.get("success") is True
                        and isinstance(result, dict)
                        and result.get("id") == "177f6fa4-ae49-4182-81ea-0c6b35f26ca6"
                    )
                else:
                    shaped = live_shape(source_id, raw)
                item["checks"].append({"name": "payload_shape", "status": "pass" if shaped else "fail"})
            except Exception as exc:
                item["checks"].append({"name": "payload_shape", "status": "fail", "detail": str(exc)})
        except Exception as exc:
            item["checks"].append({"name": "availability", "status": "fail", "detail": str(exc)})

        path = EXPECTED_KEYS.get(source_id)
        collector_value = get_path(current, path) if path else None
        item["checks"].append({
            "name": "collector_output",
            "status": "pass" if collector_value is not None else "fail",
        })

        signal_result = current_signal_checks(current, entry)
        item["signal_count"] = signal_result["signal_count"]
        item["checks"].extend(signal_result["checks"])
        if any(c.get("status") == "fail" for c in signal_result["checks"]):
            item["status"] = "fail"

        feed_status = current.get("feeds", {}).get(RUNTIME_NAMES.get(source_id, ""))
        if isinstance(feed_status, dict):
            item["checks"].append({
                "name": "runtime_status",
                "status": "pass" if feed_status.get("ok") else "fail",
                "detail": "runtime collector reports ok" if feed_status.get("ok") else feed_status.get("error"),
            })

        last_success = feed_status.get("last_success_at") if isinstance(feed_status, dict) else None
        age = age_minutes(last_success, now)
        tolerance = entry.get("freshness_tolerance_minutes")
        if age is not None and tolerance is not None:
            freshness_ok = age <= tolerance
            item["checks"].append({
                "name": "freshness",
                "status": "pass" if freshness_ok else "fail",
                "age_minutes": round(age, 1),
                "tolerance_minutes": tolerance,
            })

        item["health_state"] = classify_assurance_health(item, feed_status)
        item["status"] = "pass" if item["health_state"] == "healthy" else item["health_state"]
        results.append(item)

    summary = {
        "generated_at": now.isoformat(),
        "scope": "MVP4.6 go-live automated feed assurance",
        "results": results,
        "summary": {
            "feeds_tested": len(results),
            "passed": sum(r["health_state"] == "healthy" for r in results),
            "stale": sum(r["health_state"] == "stale" for r in results),
            "degraded": sum(r["health_state"] == "degraded" for r in results),
            "unavailable": sum(r["health_state"] == "unavailable" for r in results),
            "failed": sum(r["health_state"] in {"degraded", "unavailable"} for r in results),
            "reference_only": sum(r["health_state"] == "reference_only" for r in results),
            "no_current_signal": sum(any(c.get("status") == "no_current_signal" for c in r["checks"]) for r in results),
        },
    }
    return summary

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = run()
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("UK Resilience Monitor — MVP4.6 Feed Assurance")
        print(f"Feeds tested: {result['summary']['feeds_tested']}")
        print(f"Healthy: {result['summary']['passed']}")
        print(f"Stale: {result['summary']['stale']}")
        print(f"Degraded: {result['summary']['degraded']}")
        print(f"Unavailable: {result['summary']['unavailable']}")
        print(f"Reference only: {result['summary']['reference_only']}")
        print(f"Hard failures: {result['summary']['failed']}")
        for item in result["results"]:
            print(f"- {item['id']}: {item['health_state']} ({item.get('signal_count', 0)} signals)")
            for check in item["checks"]:
                if check.get("status") == "fail":
                    print(f"  FAIL {check.get('name')}: {check.get('detail', '')}")
    return 1 if result["summary"]["failed"] else 0

if __name__ == "__main__":
    sys.exit(main())
