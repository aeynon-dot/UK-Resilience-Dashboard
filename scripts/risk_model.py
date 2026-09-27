"""Helpers for the common Resilience Monitor public risk-signal model.

This module deliberately contains no organisation-specific data.
"""

import hashlib
import re


THEME_NATURAL = "natural_and_environmental_hazards"


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
):
    identity = "|".join(
        [
            source,
            source_record_id or description,
            scope,
            hazard,
        ]
    )
    return {
        "id": _id("risk", identity),
        "risk_theme": risk_theme,
        "risk_domain": risk_domain,
        "hazard": hazard,
        "source": source,
        "source_url": source_url,
        "published_at": None,
        "observed_at": None,
        "collected_at": collected_at,
        "status": "active",
        "severity": severity,
        "geography": {"scope": scope},
        "confidence": "high",
        "description": re.sub(r"\s+", " ", description).strip()[:5000],
        "change_type": change_type,
        "raw_reference": None,
        "tags": [],
        "source_record_id": source_record_id,
    }


def normalise_current(data):
    """Convert current MVP feed data into common Risk Signal objects."""
    collected_at = data.get("updated_at")
    signals = []

    for index, item in enumerate(data.get("met_office", {}).get("items", [])):
        regions = item.get("regions") or ["UK"]
        for scope in regions:
            title = item.get("title") or "Severe weather warning"
            signals.append(
                signal(
                    source="Met Office",
                    source_url="https://weather.metoffice.gov.uk/warnings-and-advice/uk-warnings",
                    risk_theme=THEME_NATURAL,
                    risk_domain="climate_and_weather",
                    hazard="severe weather",
                    severity=severity_from_level(item.get("level")),
                    scope=scope,
                    description=title,
                    collected_at=collected_at,
                    source_record_id=f"met-{index}-{scope.lower().replace(' ', '-')}",
                    change_type="new",
                )
            )

    for index, item in enumerate(data.get("england", {}).get("items", [])):
        title = item.get("title") or "Flood warning"
        signals.append(
            signal(
                source="Environment Agency",
                source_url="https://check-for-flooding.service.gov.uk/",
                risk_theme=THEME_NATURAL,
                risk_domain="flooding",
                hazard="flooding",
                severity=severity_from_level(item.get("level")),
                scope="England",
                description=title,
                collected_at=collected_at,
                source_record_id=f"ea-{index}",
                change_type="new",
            )
        )

    england = data.get("england", {})
    if not england.get("items") and sum(england.get(k, 0) or 0 for k in ("warnings", "alerts", "severe")):
        signals.append(
            signal(
                source="Environment Agency",
                source_url="https://check-for-flooding.service.gov.uk/",
                risk_theme=THEME_NATURAL,
                risk_domain="flooding",
                hazard="flooding",
                severity="high" if england.get("severe") or england.get("warnings") else "moderate",
                scope="England",
                description="Environment Agency reports current flood activity.",
                collected_at=collected_at,
                source_record_id="ea-summary",
                change_type="new",
            )
        )

    for source_name, source_url, key, scope in [
        ("Natural Resources Wales", "https://flood-warning.naturalresources.wales/", "wales", "Wales"),
        ("SEPA", "https://beta.sepa.scot/flooding", "scotland", "Scotland"),
    ]:
        item = data.get(key, {})
        total = sum(item.get(k, 0) or 0 for k in ("warnings", "alerts", "severe"))
        if total:
            signals.append(
                signal(
                    source=source_name,
                    source_url=source_url,
                    risk_theme=THEME_NATURAL,
                    risk_domain="flooding",
                    hazard="flooding",
                    severity="severe" if item.get("severe") else ("high" if item.get("warnings") else "moderate"),
                    scope=scope,
                    description=f"{source_name} reports {total} current flood warning/alert item(s).",
                    collected_at=collected_at,
                    source_record_id=f"{key}-summary",
                    change_type="new",
                )
            )

    return signals
