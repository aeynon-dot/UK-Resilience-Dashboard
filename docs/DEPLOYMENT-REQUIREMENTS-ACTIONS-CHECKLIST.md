# Deployment Requirements & Actions Checklist

## Purpose

This checklist defines the requirements and actions for deploying **UK Resilience Monitor** to public production/go-live.

It is intentionally focused on the current **MVP4.6 public Risk Identification & Assessment product**. It does not introduce organisational data, paid preparedness functionality, or organisational risk scoring.

## Go-live definition

> UK Resilience Monitor provides a curated view of current external UK resilience risk signals across a defined set of UK resilience risk domains, using authoritative public sources.

The product must not imply comprehensive coverage of the UK risk landscape.

---

## 1. Go-live decision criteria

| ID | Requirement | Gate | Status | Evidence / action |
|---|---|---|---|---|
| G01 | Go-live risk set is explicitly defined | Required | ☐ | `data/go-live-risk-set.json` |
| G02 | Coverage limitations are documented | Required | ☐ | Confirm all known gaps are visible |
| G03 | Every claimed automated feed has assurance evidence | Required | ☐ | Latest feed assurance run |
| G04 | Feed failures do not falsely clear or invent data | Required | ☐ | Failure/stale/recovery tests |
| G05 | Deployment workflow succeeds | Required | ☐ | GitHub Actions deployment run |
| G06 | CodeQL/security checks complete successfully | Required | ☐ | CodeQL workflow |
| G07 | Live dashboard loads from GitHub Pages | Required | ☐ | Browser smoke test |
| G08 | Current data loads successfully | Required | ☐ | `data/current.json` live check |
| G09 | Risk selection and assessment workflow works | Required | ☐ | Select → Assess → Investigate test |
| G10 | Monitoring preferences persist locally | Required | ☐ | Save/reload browser test |
| G11 | Coverage/data status distinguishes unavailable, no signal and no coverage | Required | ☐ | UI test |
| G12 | Provenance, confidence, freshness and priority are visible/available | Required | ☐ | Signal inspection |
| G13 | Security baseline remains intact | Required | ☐ | SECURITY.md + workflow review |
| G14 | No organisational/confidential data is introduced | Required | ☐ | Repository/content review |
| G15 | Remaining limitations are explicitly accepted | Required | ☐ | Final gate report |

---

## 2. Pre-deployment checklist

### Product scope

- ☐ Confirm the release is **MVP4.6**.
- ☐ Confirm the public scope is **Risk Identification → Risk Assessment**.
- ☐ Confirm organisational exposure, critical services, vulnerabilities, controls, plans and validation remain out of scope.
- ☐ Confirm no organisational risk score, likelihood, impact, RTO or MTPD has been introduced.
- ☐ Confirm `priority_score` is described as public monitoring attention priority, not organisational risk.

### Risk and coverage baseline

- ☐ Review `data/go-live-risk-set.json`.
- ☐ Confirm each go-live domain has an intended coverage status.
- ☐ Confirm NRR 2026 is the authoritative high-level theme basis.
- ☐ Confirm product taxonomy is clearly described as the product's operational classification.
- ☐ Confirm known gaps are documented.
- ☐ Confirm Northern Ireland flooding remains clearly identified as reference-only.
- ☐ Confirm health coverage is described as England-focused.
- ☐ Confirm energy coverage is described as a system indicator rather than an outage-warning service.
- ☐ Confirm other natural-hazard coverage is not presented as comprehensive.

### Feed assurance

- ☐ Run the feed assurance suite against all go-live sources.
- ☐ Confirm endpoint availability.
- ☐ Confirm payload/format validation.
- ☐ Confirm collector output.
- ☐ Confirm provenance.
- ☐ Confirm duplicate IDs are not present.
- ☐ Confirm freshness is within source-specific tolerance where applicable.
- ☐ Confirm source status is represented correctly.
- ☐ Confirm failure handling retains the previous usable snapshot.
- ☐ Confirm stale data is visibly identified.
- ☐ Confirm recovery behaviour works.
- ☐ Record any live upstream failure as **Conditional**, rather than hiding it.
- ☐ Treat reference-only feeds separately from automated feeds.

### Security

- ☐ CodeQL completes successfully.
- ☐ No new security alerts are introduced.
- ☐ GitHub Actions retain least-privilege permissions.
- ☐ Third-party Actions remain pinned to reviewed commit SHAs.
- ☐ Dependabot remains enabled.
- ☐ No secrets or credentials are committed.
- ☐ External feed content remains treated as untrusted.
- ☐ Response-size limits remain enabled.
- ☐ Generated data writes remain atomic.
- ☐ Browser CSP remains present and appropriate.
- ☐ Security-sensitive changes have been reviewed.

---

## 3. Deployment checklist

### GitHub Actions

- ☐ Current `main` commit is the intended release commit.
- ☐ Data update workflow succeeds.
- ☐ Feed assurance workflow succeeds or has documented Conditional findings.
- ☐ Deploy workflow succeeds.
- ☐ CodeQL workflow completes.
- ☐ No required workflow is still running.
- ☐ No unexpected workflow failures exist for the release commit.

### GitHub Pages

- ☐ GitHub Pages deployment completes successfully.
- ☐ Production URL serves the intended release.
- ☐ Static assets load successfully.
- ☐ JavaScript cache/version references match the release.
- ☐ No stale previous UI is being served because of asset caching.

### Data

- ☐ `data/current.json` is present in the deployed site.
- ☐ Current data timestamp is recent enough for the update cycle.
- ☐ Feed status information is present.
- ☐ Signal count is plausible.
- ☐ No duplicate signal IDs are present.
- ☐ Generated data validates against the current schema.
- ☐ Historical data remains readable.
- ☐ A failed feed does not cause unrelated data to disappear.

---

## 4. Live smoke test

Perform this against the **deployed GitHub Pages URL**, not just the repository files.

### Page load

- ☐ Dashboard loads without a visible error.
- ☐ Header and hero render correctly.
- ☐ Risk & Assessment workspace is visible.
- ☐ Desktop layout shows the vertical left control pane.
- ☐ Main assessment area is visible.
- ☐ Responsive layout remains usable at a smaller viewport.

### Risk selection

- ☐ Risk theme selector works.
- ☐ Geography selector works.
- ☐ Risk domain selector works.
- ☐ Severity filter works.
- ☐ Status filter works.
- ☐ Risk signals update when filters change.
- ☐ Current session filters do not unexpectedly overwrite saved preferences.

### Supporting content

- ☐ Weather-specific content is hidden when irrelevant.
- ☐ Weather content appears when a relevant weather/flood context is selected.
- ☐ Data confidence appears only for the intended weather + UK context.
- ☐ Irrelevant supporting content does not clutter other risk domains.

### Coverage and data status

- ☐ Coverage card loads.
- ☐ Covered status is distinguishable from Partial.
- ☐ Data unavailable/stale is distinguishable from No current signal.
- ☐ Reference-only sources are distinguishable from automated coverage.
- ☐ Coverage limitations are visible without implying comprehensive UK coverage.

### Monitoring preferences

- ☐ Default geography can be changed.
- ☐ Risk themes can be selected.
- ☐ Minimum priority can be selected.
- ☐ Save works.
- ☐ Preferences persist after reload.
- ☐ Preferences are stored locally in the browser.
- ☐ Changing preferences does not unexpectedly alter the current investigation state.
- ☐ Opening the dashboard applies the saved default appropriately.

### Assessment / investigation

- ☐ A user can select a risk.
- ☐ The selected risk presents its assessment information.
- ☐ Severity is visible.
- ☐ Geography is visible.
- ☐ Status is visible.
- ☐ Confidence is visible/available.
- ☐ Freshness is visible/available.
- ☐ Monitoring priority is visible/available.
- ☐ Source/provenance is available.
- ☐ Source link resolves correctly.
- ☐ No organisational exposure information is implied.

---

## 5. Failure and resilience checks

At least one live or controlled test should confirm each behaviour:

- ☐ Upstream HTTP failure → previous usable data retained.
- ☐ Stale feed → stale status shown.
- ☐ Feed unavailable → data unavailable state shown.
- ☐ No qualifying signal → no current signal state shown.
- ☐ Malformed payload → collector/assurance failure recorded.
- ☐ Duplicate signal IDs → assurance failure detected.
- ☐ Feed recovery → current data resumes correctly.
- ☐ One feed failure does not incorrectly mark unrelated domains unavailable.

The Environment Agency HTTP 503 experienced during MVP4.6 testing is a valid real-world example for this gate.

---

## 6. Go-live evidence pack

Record the following before declaring the release complete:

- ☐ Release/main commit SHA
- ☐ Deployment workflow run
- ☐ CodeQL run
- ☐ Feed assurance run
- ☐ Feed assurance result by source
- ☐ Current data timestamp
- ☐ Current signal count
- ☐ Coverage status by go-live domain
- ☐ Known upstream failures
- ☐ Known coverage gaps
- ☐ Live smoke-test result
- ☐ Final MVP4.6 Go-Live Gate report

---

## 7. Conditional acceptance rules

A **Conditional** result is appropriate where the product is functioning but an external dependency or known limitation prevents an unconditional pass.

Examples:

- An authoritative upstream feed is temporarily unavailable but stale-data handling works.
- A source is available but provides only partial geographic or domain coverage.
- A reference-only source has no automated endpoint.
- A non-critical external service has a temporary outage.

A **Gap** is appropriate where an agreed product requirement is absent or not functioning.

Examples:

- A claimed automated risk domain has no working automated source.
- Risk selection does not work.
- Current data cannot be loaded.
- Deployment or security checks fail.
- Provenance is missing from signals.
- Failure handling could falsely present data as current.

---

## 8. Final go-live gate

### Pass
All required criteria pass, with only documented non-blocking limitations.

### Conditional
The product is operational, but one or more material external limitations remain and are explicitly documented and accepted.

### Gap
A required capability, security control, deployment control or core user journey is not working.

**Do not convert a known limitation into Pass simply because the rest of the system is working.**

---

## 9. Post-go-live actions

Within the first operating period:

- ☐ Review automated feed assurance results.
- ☐ Review feed failures and stale events.
- ☐ Confirm scheduled data updates continue.
- ☐ Confirm deployment remains reproducible.
- ☐ Monitor CodeQL and Dependabot findings.
- ☐ Review user-facing coverage limitations.
- ☐ Record any new source-quality issues.
- ☐ Review whether any Partial/Gap domain should be prioritised for future feed work.
- ☐ Do not expand into organisational context until the public monitoring foundation remains stable.

## 10. Next product gate

After MVP4.6 is stable, the next development decision should be based on evidence from:

> **Monitor → Identify → Assess → Investigate**

before progressing to:

> **Organisational Context → Prevent / Mitigate → Plan → Validate**

Organisational data should not be introduced merely to fill gaps in the public monitoring layer.
