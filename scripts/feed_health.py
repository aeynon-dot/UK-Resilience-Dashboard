"""Common feed health states for the public monitoring pipeline.

The state describes collection/data availability, not the severity of the
underlying risk. A healthy feed may legitimately contain zero signals.
"""

FEED_HEALTH_STATES = (
    "healthy",
    "stale",
    "degraded",
    "unavailable",
    "reference_only",
)


def classify_feed_health(
    *,
    ok,
    stale=False,
    has_last_success=True,
    reference_only=False,
    degraded=False,
):
    """Return the canonical public feed-health state."""
    if reference_only:
        return "reference_only"
    if not ok and not has_last_success:
        return "unavailable"
    if stale:
        return "stale"
    if degraded:
        return "degraded"
    if ok:
        return "healthy"
    return "unavailable"


def update_feed_status(
    previous,
    *,
    ok,
    now_iso,
    stale=False,
    degraded=False,
    error=None,
):
    """Update feed status while preserving recovery history across failures."""
    previous = previous if isinstance(previous, dict) else {}
    status = dict(previous)

    status["ok"] = bool(ok)
    status["stale"] = bool(stale)

    if ok:
        status["last_success_at"] = now_iso
        if previous.get("ok") is False:
            status["recovered_at"] = now_iso
        status.pop("error", None)
        return status

    if previous.get("last_success_at"):
        status["last_success_at"] = previous["last_success_at"]

    if previous.get("degraded_since"):
        status["degraded_since"] = previous["degraded_since"]
    elif previous.get("ok") is True or degraded:
        status["degraded_since"] = now_iso

    if error is not None:
        status["error"] = error

    return status
