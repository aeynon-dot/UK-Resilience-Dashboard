# MVP4.6.1 — Environment Agency Feed Resilience

**Status:** Complete  
**Release:** MVP4.6.1  
**Production deployment:** 28 September 2026

## Purpose

MVP4.6.1 hardened the Environment Agency flood-monitoring integration after diagnosis showed that the live API was returning valid active flood records but the collector was reading the descriptive `severity` field instead of the numeric `severityLevel` field.

The result was that valid active Environment Agency records could be silently reduced to zero dashboard signals.

## Implemented change

The collector now treats `severityLevel` as the canonical classification:

| severityLevel | Meaning | Dashboard treatment |
|---:|---|---|
| 1 | Severe Flood Warning | Active severe signal |
| 2 | Flood Warning | Active warning signal |
| 3 | Flood Alert | Active alert signal |
| 4 | Warning no Longer in Force | Ignored for active signals |

The descriptive `severity` text is not used as the numeric classification source.

## Validation and malformed-input handling

The Environment Agency collector now validates that:

- the response is an object;
- `items` is present and is a list;
- each item is an object;
- `severityLevel` is an integer and one of 1–4;
- unexpected or malformed severity values are rejected rather than silently classified.

A valid response with `items: []` remains a healthy zero-signal state.

An unavailable or malformed feed remains distinguishable from a genuine zero-signal response through the existing feed-status/error handling.

## Assurance tests

MVP4.6.1 added regression coverage for:

- active severity levels 1, 2 and 3;
- descriptive severity text not being used for classification;
- level 4 being ignored;
- a valid empty response;
- missing `items`;
- invalid `severityLevel`;
- feed assurance accepting a valid empty response;
- feed assurance rejecting an invalid response shape;
- feed assurance accepting levels 1–4.

## Deployment verification

The change was:

1. merged to `main` through PR #10 after all required checks passed;
2. deployed to staging;
3. verified in the staging dashboard, where Environment Agency flood signals appeared correctly;
4. promoted to production;
5. verified as part of the production deployment.

## Acceptance criterion

> An Environment Agency response containing active `severityLevel` 1–3 records produces corresponding dashboard signals; a valid empty response remains healthy with zero signals; malformed or unavailable responses remain distinguishable from a genuine zero-signal state.

**Result: PASS**

## Operational interpretation

This fix improves the integrity of the flooding monitoring pipeline. It does not make the Environment Agency feed a safety-critical notification service, and the dashboard remains an information aid rather than a replacement for official flood warnings.

## Next build target

The next planned increment is **MVP4.7 — Monitoring & source-quality hardening**.

The focus should remain on the public monitoring layer:

- source/feed reliability and recovery visibility;
- authoritative source-link validation;
- stale/degraded feed presentation;
- monitoring and data-confidence transparency;
- regression coverage for feed classification and zero-signal states.

Organisational/private resilience data remains outside the public pipeline until dedicated data-classification, access-control, retention and threat-model controls are designed and agreed.
