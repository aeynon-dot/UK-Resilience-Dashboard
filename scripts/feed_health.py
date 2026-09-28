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
