# MVP4 — Risk & Threat Monitor

## Purpose

MVP4 refocuses the public dashboard on the first two stages of the Resilience Monitor model:

1. Risk / threat identification
2. Risk / threat assessment

The existing weather and flooding dashboard remains the foundation, but the dashboard now presents additional public signals across cyber, health, supply chain, energy, space weather and other hazards.

## Product model

**Identify → Assess**

The common signal model captures:

- risk theme
- risk domain
- hazard
- source and source URL
- status
- severity
- geography
- observation/publication time
- confidence
- change type
- monitoring priority

The monitoring priority is deliberately separate from organisational risk assessment. It helps determine which public signals deserve attention first; it does not estimate an organisation's likelihood, impact, vulnerability or business consequence.

## Dashboard changes

MVP4 adds:

- Risk & threat overview by domain
- Risk-domain signal counts
- Signal filtering by domain, geography, severity and status
- Signal-level assessment information
- Source provenance
- NCSC UK cyber threat intelligence feed

The previous browser-local organisation exposure and critical-service experiments are parked while the public risk identification and assessment layer is developed.

## Feed expansion direction

The next feed work should progressively strengthen coverage of:

- weather and flooding
- cyber
- health
- energy
- infrastructure and water
- transport
- communications
- supply chain
- security
- geopolitical and international disruption
- natural hazards
- space weather

Priority should be given to authoritative UK sources where suitable machine-readable or reliably extractable public data exists.

## Next product step

Before adding organisational exposure or service modelling, strengthen the public assessment layer:

**signal → severity/status/geography → change → monitoring priority → assessment context**

This should establish a robust external risk picture before organisational relevance is introduced.
