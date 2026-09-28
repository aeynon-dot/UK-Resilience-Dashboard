# MVP3.1 — Common Risk Data Model

## Purpose

MVP3.1 introduces one normalised **Risk Signal** contract for every external disruptive-risk feed.

**external risk signal → organisational exposure → assessment → mitigation → planning → validation**

Only the first layer is implemented here. Organisational information is deliberately out of scope for the public MVP.

## Classification approach

The model uses two levels:

1. **risk_theme** — a high-level, externally recognisable UK risk classification based on the nine themes used by the UK National Risk Register 2025.
2. **risk_domain** — a practical Resilience Monitor product classification used to group feeds and future capabilities.

This avoids presenting operational categories such as energy or supply chain as official NRR themes while still giving the product a useful cross-domain structure.

The latest NRR is now the 2026 edition. The taxonomy should be reviewed against each new NRR release rather than treated as permanently fixed.

## Core entity

A Risk Signal represents an externally observed or published indication of a disruptive hazard.

Required fields: `id`, `risk_theme`, `risk_domain`, `hazard`, `source`, `source_url`, `status`, `severity`, `geography`, `collected_at`, `confidence`, `description`.

Optional provenance/change fields: `published_at`, `observed_at`, `change_type`, `raw_reference`, `source_record_id`, `tags`.

## Design rules

### 1. Preserve provenance
Every signal must retain its authoritative source and source URL. Normalisation must never remove the original reference.

### 2. Do not confuse severity with organisational impact
`severity` describes the external signal. It does **not** mean the event is severe for a particular organisation. Future organisational impact belongs in a separate model.

### 3. Keep geography structured
Geography is an object rather than free text so future map, filtering and exposure matching can work consistently.

### 4. Support many-to-many classification later
A signal currently has one primary `risk_theme` and one primary `risk_domain`. Additional classification can be added through `tags` without breaking the core contract.

### 5. Treat source content as untrusted
Feed content must be escaped/validated before browser rendering. Never place raw source HTML into a page.

## Current feed mappings

| Feed | risk_theme | risk_domain | hazard |
|---|---|---|---|
| Met Office severe weather warning | natural_and_environmental_hazards | climate_and_weather | derived from warning |
| Environment Agency flood feed | natural_and_environmental_hazards | flooding | flood |
| Natural Resources Wales flood information | natural_and_environmental_hazards | flooding | flood |
| SEPA flood information | natural_and_environmental_hazards | flooding | flood |

These mappings are implementation defaults, not claims that the source agencies use the same taxonomy.

## Validation

Canonical JSON Schema: `schemas/risk-signal.schema.json`

Classification vocabulary: `data/risk-taxonomy.json`

Do not add organisation-specific assets, sites, vulnerabilities, dependencies, BIA results or recovery strategies to this public signal object. Those belong to the future private organisational layer.

## Current status note — 28 September 2026

This document remains the design/history record for its MVP increment. MVP4.6 is now deployed to production and the public secure-by-design baseline has been verified. Future changes should preserve the separation between public risk intelligence and private organisational context described here.
