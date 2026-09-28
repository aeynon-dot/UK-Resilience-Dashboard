# UK Resilience Monitor — MVP4

A £0-cost, mobile-friendly public UK resilience briefing and the initial reference implementation for the future **Resilience Monitor** open-source platform.

## Direction

The long-term platform is designed to support organisational preparedness through five connected capabilities:

1. Risk / threat identification
2. Risk / threat assessment
3. Mitigation strategies
4. Planning strategies
5. Validation

The current MVP focuses on public risk and threat identification and assessment. The immediate product priority is to expand the existing weather dashboard into a cross-domain resilience monitor. Future private organisational context remains separate from the public risk-signal pipeline.

## Current data feeds

### UK climate and flooding
- Met Office UK severe weather warning RSS
- Environment Agency real-time flood API
- Natural Resources Wales live flood-warning page
- SEPA Scotland live flooding page

### Current multi-domain feeds
- NCSC Threat Intelligence RSS — UK cyber threat intelligence
- CISA Known Exploited Vulnerabilities — cyber
- UKHSA Data Dashboard API — health
- FSA Food Alerts API — supply chain / health
- USGS Earthquake GeoJSON — natural hazards
- NOAA Planetary K-index JSON — space weather
- NESO Demand Data Update — energy

## Architecture

GitHub Actions → `data/current.json` + `data/history.json` → GitHub Pages → browser.

The data workflow runs every 15 minutes and can also be started manually from Actions → Update UK resilience data → Run workflow.

## Risk-signal architecture

The common model separates:

**external risk signal → organisational exposure → assessment → mitigation → planning → validation**

The current collector emits a `risk_signals` array alongside the existing dashboard data. MVP3.3 adds six new public domains without replacing the existing UI.

### Recognised risk classification

The high-level `risk_theme` vocabulary is based on the nine risk themes used by the UK National Risk Register. A separate `risk_domain` vocabulary provides the product's practical cross-domain view, including climate & weather, flooding, energy, infrastructure, transport, communications, cyber, health, supply chain, geopolitical and space weather.

The product domains are not presented as an official government taxonomy.

## Source / Feed Registry

The machine-readable registry is at `data/source-registry.json`.

It records:

- publisher and authority type
- source/feed type
- transport and endpoint
- supported risk themes and domains
- geographic coverage
- expected update interval
- freshness tolerance
- enabled/reference-only status

Schema: `schemas/source-registry.schema.json`

## MVP3.3

See `docs/MVP3.3-MULTI-DOMAIN-FEEDS.md`.

The initial six-domain test deliberately uses different source structures:

| Domain | Source | Format |
|---|---|---|
| Cyber | CISA KEV | JSON catalogue |
| Health | UKHSA | JSON API |
| Supply chain | FSA | REST/JSON |
| Natural hazard | USGS | GeoJSON |
| Space weather | NOAA SWPC | JSON |
| Energy | NESO | CKAN JSON API |

## Security by design

The current deployment contains public risk information only. No organisational sites, business continuity plans, vulnerabilities, personal data, credentials or other confidential organisational information should be stored in this MVP.

Security controls include least-privilege GitHub Actions, pinned actions, Dependabot, CodeQL, browser Content Security Policy, external-input handling, bounded feed responses and atomic generated-data writes.

See SECURITY.md and SECURE-BY-DESIGN.md.

## Important

This dashboard is an information aid and does not replace official warning/alert channels. Always follow the latest advice from the relevant official service.




## MVP4.6.1 — Environment Agency feed resilience

MVP4.6.1 is complete and deployed to production.

The Environment Agency flood-monitoring collector now uses the official numeric `severityLevel` field as the canonical classification:

- `1` — Severe Flood Warning
- `2` — Flood Warning
- `3` — Flood Alert
- `4` — Warning no Longer in Force; ignored for active signals

The collector and feed-assurance tests now distinguish:

- a valid empty response with zero current signals;
- malformed or schema-invalid responses;
- unavailable/degraded upstream responses.

Staging and production were verified after deployment, with current Environment Agency flood signals appearing correctly.

See `docs/MVP4.6.1-EA-FEED-RESILIENCE.md`.

## Next build target — MVP4.7

With the public monitoring pipeline and core feed-assurance foundation operational, the next build target is **MVP4.7 — Monitoring & source-quality hardening**.

The next increment should focus on evidence-led improvements to:

1. source/feed reliability and recovery visibility;
2. authoritative source-link validation;
3. stale/degraded feed presentation;
4. monitoring and data-confidence transparency;
5. regression coverage for feed classification and zero-signal states.

MVP4.7 should remain within the public monitoring scope. Organisational/private resilience data remains outside the public pipeline until a dedicated data-classification, access-control, retention and threat-model design is agreed.

## MVP3.5 — Organisational exposure

MVP3.5 adds a browser-local organisation exposure profile and transparent preparedness-priority calculation. Organisational exposure is not sent to the public data pipeline or stored in the repository. See `docs/MVP3.5-ORGANISATIONAL-EXPOSURE.md`.

## MVP4 — Risk & Threat Monitor

MVP4 refocuses the dashboard on the first two capabilities:

1. Risk / threat identification
2. Risk / threat assessment

The dashboard now exposes the existing cross-domain signals through:

- a risk-domain overview
- current signal counts by domain
- filtering by domain, geography, severity and status
- signal-level source, timing, severity and monitoring-priority information
- clearer source/feed provenance

The organisational exposure and critical-service experiments from MVP3.5/MVP3.6 are deliberately parked rather than treated as the current product focus.

The intended progression is:

**weather dashboard → cross-domain risk monitor → risk assessment → organisational relevance → mitigation → planning → validation**

MVP4's monitoring priority remains a public-information aid. It is not an organisational risk score or a substitute for formal risk assessment.
