# MVP4.6 — Go-Live Risk & Feed Baseline

## Purpose

Define exactly what the public UK Resilience Monitor MVP can claim to monitor at go-live.

The go-live scope is deliberately narrower than the full product taxonomy. A taxonomy entry does not imply live monitoring.

## Go-live rule

A risk theme is **covered** only when at least one automated public source is configured for it and passes the feed assurance gate.

Coverage status:

- **Covered** — automated monitoring is intended and must pass assurance.
- **Partial** — some automated coverage exists, but material gaps remain.
- **Reference only** — an authoritative source is identified but is not automated.
- **Gap** — no automated source is currently claimed.

## Go-live risk domains

| Risk domain | Theme | Status | Current automated sources | Main limitation |
|---|---|---|---|---|
| Climate & weather | Natural & environmental hazards | Covered | Met Office | Severe-weather warning coverage, not every climate risk |
| Flooding | Natural & environmental hazards | Partial | Environment Agency, NRW, SEPA | Northern Ireland reference-only; EA currently requires feed assurance |
| Cyber | Cyber | Covered | NCSC, CISA KEV | Public indicators, not organisation-specific alerts |
| Health | Human, animal & plant health | Partial | UKHSA | Current automated coverage is England-focused |
| Supply chain | Human, animal & plant health | Partial | FSA | Strongest for food safety/recalls, not all supply-chain disruption |
| Energy | Accidents & systems failures | Partial | NESO | System monitoring indicator, not an outage-warning service |
| Space weather | Natural & environmental hazards | Covered | NOAA SWPC | International indicator rather than UK-specific warning |
| Other natural hazards | Natural & environmental hazards | Partial | USGS | Currently limited to selected earthquake signals |

## High-level theme coverage

| NRR 2026 theme | Go-live status |
|---|---|
| Terrorism | Gap |
| Cyber | Covered |
| State threats | Gap |
| Geographic & diplomatic | Gap |
| Accidents & systems failures | Partial |
| Natural & environmental hazards | Covered |
| Human, animal & plant health | Partial |
| Societal | Gap |
| Conflict & instability | Gap |

The nine themes are based on the high-level vocabulary used by the UK National Risk Register 2026. The product does **not** reproduce the NRR/NSRA assessment methodology. The NRR 2026 was published by the Cabinet Office on 14 July 2026 and updated on 12 August 2026.

## Current coverage gaps

- No automated live feed currently claimed for terrorism.
- No automated live feed currently claimed for state threats.
- No automated live feed currently claimed for geographic and diplomatic risks.
- No automated live feed currently claimed for societal risks.
- No automated live feed currently claimed for conflict and instability.
- Northern Ireland flooding remains reference-only.
- Health coverage is currently England-focused.
- Supply-chain coverage is currently strongest for food alerts.
- Energy coverage is a system-monitoring indicator rather than an outage-warning feed.
- Other natural-hazard coverage is not comprehensive.

## Go-live interpretation

The dashboard should distinguish:

**No current signal**
> A working feed has been checked and no qualifying signal is currently present.

**No automated coverage**
> We do not currently have an automated source for this risk.

**Data unavailable**
> An automated source exists but is currently unavailable or outside its freshness tolerance.

These states must not be presented as equivalent.

## Next gate

This baseline is the input to **MVP4.6 Workstream B — Feed Assurance**.

Every source in the go-live set should then be tested for:

1. Availability
2. Parsing
3. Schema/field validation
4. Classification
5. Geography
6. Freshness
7. Signal creation
8. Change detection
9. Stale/error handling
10. Recovery
