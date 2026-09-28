# MVP3.4 — Risk Signal Quality and Prioritisation

MVP3.4 adds a deterministic attention-priority layer to the common Risk Signal model.

## Important distinction

The priority score is **not an organisational risk score**. It does not estimate organisational likelihood, impact, vulnerability or business consequence.

It answers a narrower monitoring question: which externally observed signals deserve attention first?

Organisational exposure and business impact remain future private-layer assessments.

## Priority inputs

The model combines severity, freshness, confidence, geographic scope, status and change type.

Unknown severity is deliberately capped below the high-priority threshold rather than inventing a severity.

## Bands

| Band | Score | Meaning |
|---|---:|---|
| Immediate | 70–100 | Strong candidate for immediate public attention |
| High | 45–69 | Significant attention candidate |
| Moderate | 20–44 | Normal monitoring |
| Monitor | 0–19 | Retain for context |

Each signal stores `priority_model_version`, `priority_score`, `priority_band` and `priority_basis` so the result is reproducible and explainable.

## Signal quality improvements

Where source data provides an event or publication timestamp, the model now uses it rather than treating collection time as event time:

- CISA KEV — vulnerability date added
- UKHSA — latest observation date
- FSA — alert modification date
- USGS — earthquake event time

This prevents an old event collected today from being treated as a newly occurring event.

## Dashboard use

High and immediate cross-domain signals can now appear in **What needs attention?**, alongside existing weather and flood warnings.

## Relationship to UK risk assessment

The model is intentionally separate from formal UK risk assessment. The current government reference is the National Risk Register 2026, which is the public-facing assessment of the UK's most serious risks. This product's priority model is only a monitoring-layer mechanism and should not be represented as an official government risk rating.

## Next step

MVP3.5 can introduce organisational relevance/exposure:

`external signal → attention priority`

becomes

`external signal → organisational exposure → preparedness priority`.


## Current status note — 28 September 2026

This document remains the design/history record for its MVP increment. MVP4.6 is now deployed to production and the public secure-by-design baseline has been verified. Future changes should preserve the separation between public risk intelligence and private organisational context described here.
