# MVP4.6 — Feed Assurance

## Purpose

Feed assurance tests the public automated sources that underpin the go-live risk set.

It checks:
- endpoint availability
- basic payload shape
- expected collector output
- signal provenance and duplicate IDs
- runtime collector status
- freshness against the source registry tolerance

The assurance runner is read-only. It does not modify source systems or dashboard data.

## Interpretation

| Result | Meaning |
|---|---|
| PASS | Endpoint and dashboard-side checks passed |
| FAIL | One or more assurance checks failed |
| REFERENCE_ONLY | No automated endpoint is available |
| NO_CURRENT_SIGNAL | Source is available but currently has no signal represented in the dashboard |

A NO_CURRENT_SIGNAL result is not a feed failure.

## Go-live use

A risk domain should only be treated as automatically covered after its automated source has passed assurance.

The assurance runner intentionally does not claim that a passing feed provides comprehensive coverage of its risk domain.

## Failure testing

Live assurance checks real public endpoints. Failure and recovery behaviour remains tested in the collector code path by retaining the previous usable snapshot when a feed fails. The Environment Agency's intermittent HTTP 503 is an example of the type of upstream failure the dashboard must tolerate.

## Security

The runner:
- uses read-only HTTP requests
- applies the same 2 MB response limit used by the collector
- sends a bounded user-agent
- does not transmit credentials
- does not persist external response bodies
- runs in a workflow with contents: read


## Post-go-live status — 28 September 2026

MVP4.6 feed assurance is part of the production baseline and is a required check for changes affecting the feed/risk-data pipeline.

A post-go-live limitation has been identified in the Environment Agency feed assurance model: an empty but structurally valid `items` list can currently pass shape validation and be represented as a healthy zero-signal feed. This does not adequately distinguish a legitimate zero state from an upstream outage or anomalous response.

### MVP4.6.1 feed-assurance requirement

Environment Agency tests should explicitly cover valid warning and alert payloads, legitimate zero-current-signal payloads, HTTP 503/unavailable responses, malformed payloads, anomalous empty responses, retention of the last valid state where appropriate, and clear degraded/unavailable status rather than false clear.
