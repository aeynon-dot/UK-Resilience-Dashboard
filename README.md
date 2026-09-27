# UK Resilience Dashboard — MVP2.4

A £0-cost, mobile-friendly public UK resilience briefing and the initial reference implementation for the future **Resilience Monitor** open-source platform.

## Direction

The long-term platform is designed to support organisational preparedness through five connected capabilities:

1. Risk / threat identification
2. Risk / threat assessment
3. Mitigation strategies
4. Planning strategies
5. Validation

The current MVP is deliberately focused on public climate and environmental risk intelligence. Future risk domains and feeds can be added without changing the core preparedness model.

## Current data feeds

- Met Office UK severe weather warning RSS
- Environment Agency real-time flood API
- Natural Resources Wales live flood-warning page
- SEPA Scotland live flooding page

## Architecture

GitHub Actions → data/current.json + data/history.json → GitHub Pages → browser.

The data workflow runs every 15 minutes and can also be started manually from Actions → Update UK resilience data → Run workflow.

## Security by design

The current deployment contains public risk information only. No organisational sites, business continuity plans, vulnerabilities, personal data, credentials or other confidential organisational information should be stored in this MVP.

Security controls are being introduced before organisational data is added:

- least-privilege GitHub Actions permissions
- pinned GitHub Actions
- Dependabot for GitHub Actions updates
- CodeQL analysis for JavaScript and Python
- browser Content Security Policy
- external-input handling and HTML escaping
- bounded external feed responses
- atomic generated-data writes
- documented security and data-classification principles

See SECURITY.md and SECURE-BY-DESIGN.md.

## Important

This dashboard is an information aid and does not replace official warning/alert channels. Always follow the latest advice from the relevant official service.

## Geographic map

The risk map uses embedded UK country boundary data for England, Wales, Scotland and Northern Ireland. The boundary dataset is from the public jhellingsdata/map-data collection and is derived from UK geographic boundary data.

Map data source: https://github.com/jhellingsdata/map-data. The underlying UK boundary material is based on public UK geographic data; ONS digital boundary material is available under Open Government Licence terms and requires source attribution.

## MVP3.1 — Common risk data model

The dashboard now has a common **Risk Signal** model so different disruptive-risk feeds can be normalised into the same structure.

The model separates:

**external risk signal → organisational exposure → assessment → mitigation → planning → validation**

### Recognised risk classification

The high-level `risk_theme` vocabulary is based on the nine risk themes used by the UK National Risk Register 2025:

- Terrorism
- Cyber
- State threats
- Geographic and diplomatic
- Accidents and systems failures
- Natural and environmental hazards
- Human, animal and plant health
- Societal
- Conflict and instability

A separate `risk_domain` vocabulary provides the product's practical cross-domain view, including climate & weather, flooding, energy, infrastructure, transport, communications, cyber, health, supply chain, geopolitical and space weather.

This distinction is deliberate: the product domains are not presented as an official government taxonomy.

### Model files

- `schemas/risk-signal.schema.json` — canonical JSON Schema
- `data/risk-taxonomy.json` — classification vocabulary and hazard examples
- `scripts/risk_model.py` — normalisation helpers
- `docs/MVP3.1-RISK-DATA-MODEL.md` — design and feed mapping

The current data collector now emits a `risk_signals` array alongside the existing MVP2 data, allowing the existing UI to continue operating while the new model is introduced.

The latest UK National Risk Register is the 2026 edition; the taxonomy should be reviewed against each future edition rather than treated as permanently fixed.

