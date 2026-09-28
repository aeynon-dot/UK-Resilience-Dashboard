# MVP3.5 — Organisational Exposure & Preparedness Priority

MVP3.5 introduces the first private-layer concept without introducing a server-side organisational database.

## Flow

**External risk signal → signal priority → organisational exposure → preparedness priority**

The public signal remains unchanged. The organisation supplies a local assessment of its exposure to each risk domain.

## Exposure levels

- Not assessed — no preparedness priority is calculated.
- Low — factor 0.50
- Medium — factor 0.75
- High — factor 1.00

Preparedness score:

`public priority score × exposure factor`

The resulting band is:

- Immediate: 60–100
- High: 40–59
- Moderate: 20–39
- Monitor: 0–19

## Security boundary

MVP3.5 deliberately stores the exposure profile in browser local storage only.

It does **not**:
- send organisational information to GitHub
- write organisational information into `data/current.json`
- store sites, addresses, vulnerabilities, BIA data, plans or personal information
- provide multi-user or multi-tenant storage

The example profile is fictional and is only a convenience for testing the feature.

## Why this matters

This is the first implementation of the intended product transition:

**Monitor → Assess → Mitigate → Plan → Validate**

MVP3.5 currently covers the transition from **Monitor** to an initial **Assess** capability.

It does not replace a formal BIA, risk assessment or organisational resilience assessment.

## Next step

MVP3.6 should add structured exposure context such as:

- critical service
- dependency
- geography
- recovery requirement
- vulnerability
- existing mitigation

Those fields should only be introduced after a dedicated threat model, data classification, retention and access-control design.


## Current status note — 28 September 2026

This document remains the design/history record for its MVP increment. MVP4.6 is now deployed to production and the public secure-by-design baseline has been verified. Future changes should preserve the separation between public risk intelligence and private organisational context described here.
