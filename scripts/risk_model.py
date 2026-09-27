"""Helpers for the common Resilience Monitor public risk-signal model."""

import hashlib
import re
from datetime import datetime, timezone

THEME_NATURAL = "natural_and_environmental_hazards"

SEVERITY_POINTS = {"severe": 100, "high": 75, "moderate": 50, "low": 25, "unknown": 20}

def _priority(signal):
    reference = signal.get("observed_at") or signal.get("published_at") or signal.get("collected_at")
    age_hours = None
    if reference:
        try:
            dt = datetime.fromisoformat(reference.replace("Z", "+00:00"))
            age_hours = max(0, (datetime.now(timezone.utc) - dt.astimezone(timezone.utc)).total_seconds() / 3600)
        except ValueError:
            pass
    if age_hours is None:
        freshness, freshness_label = 0.5, "freshness:unknown"
    elif age_hours <= 6:
        freshness, freshness_label = 1.0, "freshness:current"
    elif age_hours <= 24:
        freshness, freshness_label = 0.9, "freshness:recent"
    elif age_hours <= 72:
        freshness, freshness_label = 0.75, "freshness:recent"
    elif age_hours <= 168:
        freshness, freshness_label = 0.6, "freshness:dated"
    elif age_hours <= 720:
        freshness, freshness_label = 0.4, "freshness:dated"
    else:
        freshness, freshness_label = 0.2, "freshness:old"
    confidence = {"high": 1.0, "medium": 0.8, "low": 0.6, "unknown": 0.5}.get(signal.get("confidence"), 0.5)
    scope = {"UK": 1.0, "England": 0.95, "Wales": 0.95, "Scotland": 0.95, "Northern Ireland": 0.95, "local": 0.9, "international": 0.55}.get(signal.get("geography", {}).get("scope"), 0.5)
    status = {"active": 1.0, "monitoring": 0.8, "resolved": 0.15, "expired": 0.1, "unknown": 0.7}.get(signal.get("status"), 0.7)
    change = {"new": 1.1, "changed": 1.05, "resolved": 0.2}.get(signal.get("change_type"), 1.0)
    raw = SEVERITY_POINTS.get(signal.get("severity"), 20) * freshness * confidence * scope * status * change
    if signal.get("severity") == "unknown": raw = min(raw, 49)
    score = max(0, min(100, round(raw)))
    band = "immediate" if score >= 70 else "high" if score >= 45 else "moderate" if score >= 20 else "monitor"
    return {"priority_model_version":"1.0","priority_score":score,"priority_band":band,"priority_basis":[
        "severity:"+str(signal.get("severity","unknown")), freshness_label,
        "confidence:"+str(signal.get("confidence","unknown")),
        "scope:"+str(signal.get("geography",{}).get("scope","unknown"))]}



def _id(prefix, value):
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}:{digest}"


def severity_from_level(level):
    return {
        "Red": "severe",
        "Amber": "high",
        "Yellow": "moderate",
        "Severe": "severe",
        "Warning": "high",
        "Alert": "moderate",
    }.get(level, "unknown")


def signal(
    *,
    source,
    source_url,
    risk_theme,
    risk_domain,
    hazard,
    severity,
    scope,
    description,
    collected_at,
    source_record_id=None,
    change_type="unknown",
    status="active",
    confidence="high",
    observed_at=None,
):
    identity = "|".join([source, source_record_id or description, scope, hazard])
    result = {
        "id": _id("risk", identity),
        "schema_version": "1.0",
        "risk_theme": risk_theme,
        "risk_domain": risk_domain,
        "hazard": hazard,
        "source": source,
        "source_url": source_url,
        "published_at": None,
        "observed_at": observed_at,
        "collected_at": collected_at,
        "status": status,
        "severity": severity,
        "geography": {"scope": scope},
        "confidence": confidence,
        "description": re.sub(r"\s+", " ", description).strip()[:5000],
        "change_type": change_type,
        "raw_reference": None,
        "tags": [],
        "source_record_id": source_record_id,
    }
    result.update(_priority(result))
    return result


def normalise_current(data):
    """Convert current feed data into common Risk Signal objects."""
    collected_at = data.get("updated_at")
    signals = []

    for item in data.get("met_office", {}).get("items", []):
        for scope in item.get("regions") or ["UK"]:
            title = item.get("title") or "Severe weather warning"
            signals.append(signal(
                source="Met Office",
                source_url="https://weather.metoffice.gov.uk/warnings-and-advice/uk-warnings",
                risk_theme=THEME_NATURAL, risk_domain="climate_and_weather",
                hazard="severe weather", severity=severity_from_level(item.get("level")),
                scope=scope, description=title, collected_at=collected_at,
                source_record_id=f"met:{hashlib.sha256((title + '|' + scope).encode('utf-8')).hexdigest()[:16]}",
                change_type="new",
            ))

    for item in data.get("england", {}).get("items", []):
        title = item.get("title") or "Flood warning"
        signals.append(signal(
            source="Environment Agency", source_url="https://check-for-flooding.service.gov.uk/",
            risk_theme=THEME_NATURAL, risk_domain="flooding", hazard="flooding",
            severity=severity_from_level(item.get("level")), scope="England",
            description=title, collected_at=collected_at,
            source_record_id=f"ea:{hashlib.sha256(title.encode('utf-8')).hexdigest()[:16]}",
            change_type="new",
        ))

    england = data.get("england", {})
    if not england.get("items") and sum(england.get(k, 0) or 0 for k in ("warnings", "alerts", "severe")):
        signals.append(signal(
            source="Environment Agency", source_url="https://check-for-flooding.service.gov.uk/",
            risk_theme=THEME_NATURAL, risk_domain="flooding", hazard="flooding",
            severity="high" if england.get("severe") or england.get("warnings") else "moderate",
            scope="England", description="Environment Agency reports current flood activity.",
            collected_at=collected_at, source_record_id="ea-summary", change_type="new",
        ))

    for source_name, source_url, key, scope in [
        ("Natural Resources Wales", "https://flood-warning.naturalresources.wales/", "wales", "Wales"),
        ("SEPA", "https://beta.sepa.scot/flooding", "scotland", "Scotland"),
    ]:
        item = data.get(key, {})
        total = sum(item.get(k, 0) or 0 for k in ("warnings", "alerts", "severe"))
        if total:
            signals.append(signal(
                source=source_name, source_url=source_url,
                risk_theme=THEME_NATURAL, risk_domain="flooding", hazard="flooding",
                severity="severe" if item.get("severe") else ("high" if item.get("warnings") else "moderate"),
                scope=scope,
                description=f"{source_name} reports {total} current flood warning/alert item(s).",
                collected_at=collected_at, source_record_id=f"{key}-summary", change_type="new",
            ))

    multi = data.get("multi_domain", {})

    for item in multi.get("cisa_kev", {}).get("items", []):
        cve = item.get("cveID")
        if not cve:
            continue
        signals.append(signal(
            source="CISA Known Exploited Vulnerabilities",
            source_url="https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
            risk_theme="cyber", risk_domain="cyber",
            hazard="known_exploited_vulnerability", severity="unknown",
            scope="international",
            description=f"{cve}: {item.get('vulnerabilityName') or 'Known exploited vulnerability'}",
            collected_at=collected_at, source_record_id=cve,
            observed_at=(f"{item.get('dateAdded')}T00:00:00+00:00" if item.get("dateAdded") else None),
            change_type="new",
        ))

    ukhsa_latest = multi.get("ukhsa", {}).get("latest")
    if ukhsa_latest:
        signals.append(signal(
            source="UK Health Security Agency",
            source_url="https://ukhsa-dashboard.data.gov.uk/syndromic-surveillance/respiratory-conditions",
            risk_theme="human_animal_and_plant_health", risk_domain="health",
            hazard="infectious_disease_surveillance", severity="unknown", scope="England",
            description=f"UKHSA NHS 111 acute respiratory infection surveillance: latest daily triaged-call count {ukhsa_latest.get('metric_value')} for {ukhsa_latest.get('date')}.",
            collected_at=collected_at, source_record_id=f"ukhsa:nhs111-respiratory:{ukhsa_latest.get('date')}",
            observed_at=(f"{ukhsa_latest.get('date')}T00:00:00+00:00" if ukhsa_latest.get('date') else None),
            change_type="new", status="monitoring",
        ))

    for item in multi.get("fsa_food_alerts", {}).get("items", []):
        if not item.get("id"):
            continue
        signals.append(signal(
            source="Food Standards Agency",
            source_url="https://data.food.gov.uk/food-alerts",
            risk_theme="human_animal_and_plant_health", risk_domain="supply_chain",
            hazard="food_product_alert", severity="unknown", scope="UK",
            description=item.get("title") or "Food alert",
            collected_at=collected_at, source_record_id=item["id"],
            published_at=item.get("modified"),
            change_type="new", status="active",
        ))

    for item in multi.get("usgs_earthquakes", {}).get("items", []):
        event_id = item.get("id")
        if not event_id:
            continue
        scope = "international"
        signals.append(signal(
            source="USGS Earthquake Hazards Program",
            source_url="https://earthquake.usgs.gov/earthquakes/feed/",
            risk_theme=THEME_NATURAL, risk_domain="other",
            hazard="earthquake", severity="high" if (item.get("magnitude") or 0) >= 6 else "moderate",
            scope=scope,
            description=f"M{item.get('magnitude')} earthquake: {item.get('place') or 'location unavailable'}.",
            collected_at=collected_at, source_record_id=event_id,
            change_type="new", observed_at=(datetime.fromtimestamp(item["time"] / 1000, timezone.utc).isoformat() if item.get("time") else None),
        ))

    noaa = multi.get("noaa_space_weather", {})
    latest = noaa.get("latest")
    if latest:
        kp = None
        headers = noaa.get("headers") or []
        if "Kp" in headers:
            kp = latest[headers.index("Kp")]
        signals.append(signal(
            source="NOAA Space Weather Prediction Center",
            source_url="https://www.swpc.noaa.gov/",
            risk_theme=THEME_NATURAL,
            risk_domain="space_weather", hazard="space_weather_monitoring",
            severity="unknown", scope="international",
            description=f"Latest NOAA planetary K-index observation: Kp={kp}.",
            collected_at=collected_at, source_record_id="noaa-kp-latest",
            change_type="new", status="monitoring",
        ))

    neso_latest = multi.get("neso", {}).get("latest")
    if neso_latest:
        signals.append(signal(
            source="National Energy System Operator",
            source_url="https://www.neso.energy/data-portal",
            risk_theme="accidents_and_system_failures", risk_domain="energy",
            hazard="electricity_system_monitoring", severity="unknown", scope="UK",
            description="NESO electricity-system demand data is available and being monitored.",
            collected_at=collected_at, source_record_id="neso-demand-latest",
            change_type="new", status="monitoring",
        ))

    return signals
