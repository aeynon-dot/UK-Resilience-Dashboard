# MVP4.6 GO-LIVE TEST REPORT

**Product:** UK Resilience Monitor  
**Release:** MVP4.6  
**Test date:** 27 September 2026  
**Test scope:** Public Risk Identification & Risk Assessment capability  
**Primary environment:** Cloudflare Pages staging  
**Secondary environment:** GitHub Pages  
**Release basis:** `main` branch

---

## 1. Executive summary

MVP4.6 was tested against the agreed deployment and go-live requirements.

The core public monitoring capability is operational:

- risk identification and assessment workflow is implemented;
- Cyber signals can be assessed in the UK view, including relevant international-source signals;
- current risk data is updating automatically;
- signal provenance is present;
- duplicate signal IDs were not identified;
- feed status and coverage are represented;
- known coverage limitations are explicitly documented;
- the public MVP remains limited to external risk intelligence and does not introduce organisational/private resilience data;
- security-by-design controls remain in place.

### Overall release status

> **CONDITIONAL GO-LIVE**

The product has no identified core functionality defect that prevents the MVP4.6 public monitoring capability from operating.

The remaining conditions relate primarily to final deployment evidence and completion of the live browser smoke-test evidence pack. These should be closed before an unconditional production release.

---

## 2. Go-live definition

> UK Resilience Monitor provides a curated view of current external UK resilience risk signals across a defined set of UK resilience risk domains, using authoritative public sources.

The product does **not** claim comprehensive coverage of the UK risk landscape.

---

## 3. Test outcome summary

| Area | Result | Finding |
|---|---|---|
| Product scope | PASS | Public Risk Identification → Risk Assessment |
| Risk workspace | PASS | Vertical Risk & Assessment pane implemented |
| Risk selection | PASS | Theme, geography, domain, severity and status filters implemented |
| Cyber UK assessment | PASS | 50 Cyber signals available to UK monitoring model |
| International-to-UK monitoring | PASS | International source geography retained while contributing to UK view |
| Data integrity | PASS | 81 current risk signals; no duplicate IDs identified |
| Signal provenance | PASS | Required provenance fields present on current signals |
| Current data | PASS | Automated data updates continuing |
| Feed status | PASS | Latest snapshot reports automated feeds healthy |
| Feed failure handling | PASS | Previous EA 503/stale-data scenario demonstrated correct handling |
| Coverage model | PASS | Covered / Partial / Reference-only / Gap distinctions implemented |
| Coverage limitations | PASS | Known gaps explicitly documented |
| Monitoring preferences | PASS* | Browser-local implementation present and designed for persistence |
| Weather contextualisation | PASS* | Weather content conditionally displayed |
| Data confidence contextualisation | PASS* | Restricted to relevant weather + UK context |
| Security baseline | PASS | CSP, escaping, least privilege, pinned actions and CodeQL controls present |
| GitHub Pages deployment | PASS* | Existing production deployment pipeline present |
| Cloudflare staging | PASS* | Staging deployment confirmed operational by user testing |
| Automatic Cloudflare staging deployment | CONDITIONAL | Workflow committed; final execution evidence to be captured |
| Final live browser smoke test | CONDITIONAL | Critical Cyber/UK path verified; complete evidence pack still required |
| Production deployment | NOT TESTED | Deliberately withheld pending final gate |

`*` Repository/configuration and/or user browser evidence; not independently reproduced in this test environment.

---

## 4. Risk identification and assessment tests

### R01 — Risk workspace

**Expected:** Risk & Assessment is the primary workspace with controls in a vertical pane.

**Result:** PASS

Evidence:
- Risk & Assessment pane is implemented in the main dashboard.
- The workspace contains:
  - Risk theme
  - Geography
  - Risk domain
  - Severity
  - Status
- Main content displays the selected assessment signals.

### R02 — Risk theme selection

**Expected:** Selecting a risk theme filters the assessment.

**Result:** PASS

The theme selector is populated from the product risk taxonomy and supports the defined high-level themes.

### R03 — Cyber UK assessment

**Expected:** Selecting Cyber with UK geography returns relevant Cyber monitoring signals.

**Result:** PASS

Current data contains:

- 50 Cyber signals
- Cyber risk domain
- International-source Cyber signals

The UK monitoring model deliberately includes both UK and international signals where the international signal can contribute to UK resilience risk.

The source geography remains visible as International.

### R04 — Geography filtering

**Expected:** Geography changes alter the assessment population without corrupting source geography.

**Result:** PASS

The current implementation distinguishes:

- UK monitoring view
- individual UK nations
- International
- all geographies

The UK view includes relevant international-source signals.

### R05 — Severity and status filtering

**Expected:** Severity and status filters restrict the displayed signal set.

**Result:** PASS

Controls are implemented for:

- Severe
- High
- Moderate
- Low
- Unknown

and:

- Active
- Monitoring
- Resolved
- Expired

### R06 — Public monitoring priority

**Expected:** Priority supports public monitoring attention and is not represented as an organisational risk score.

**Result:** PASS

The current model uses:

- Immediate
- High
- Moderate
- Monitor

and the implementation describes priority as a public monitoring-layer attention mechanism.

---

## 5. Data integrity and provenance tests

### D01 — Current data freshness

**Expected:** Generated current data is updated by the automated data workflow.

**Result:** PASS

Latest observed repository snapshot:

- `updated_at: 2026-09-27T20:38:19.561767+00:00`

### D02 — Signal count

**Expected:** Current data contains a plausible set of signals.

**Result:** PASS

Current snapshot:

**81 risk signals**

Breakdown:

| Risk theme / domain | Signals |
|---|---:|
| Cyber / Cyber | 50 |
| Human, animal & plant health / Supply chain | 25 |
| Human, animal & plant health / Health | 1 |
| Natural & environmental hazards / Other | 3 |
| Natural & environmental hazards / Space weather | 1 |
| Accidents & system failures / Energy | 1 |

### D03 — Duplicate signal IDs

**Expected:** No duplicate IDs.

**Result:** PASS

Observed duplicate IDs:

**0**

### D04 — Signal provenance

**Expected:** Important signals retain source and collection information.

**Result:** PASS

All 81 current signals inspected contained the expected provenance elements, including:

- source
- source URL
- collection time
- geography
- confidence
- status
- priority score

### D05 — Schema controls

**Expected:** Risk signals conform to the defined schema and unexpected properties are rejected.

**Result:** PASS

The current schema defines required fields including:

- ID
- risk theme
- risk domain
- hazard
- source
- source URL
- status
- severity
- geography
- collected time
- confidence
- description
- priority model/version
- priority score
- priority band
- priority basis

Unexpected additional properties are not permitted.

---

## 6. Feed assurance

### F01 — Current feed health

**Expected:** Automated sources report their current operational state.

**Result:** PASS

Latest current snapshot reports healthy status for:

1. Met Office
2. Environment Agency
3. Natural Resources Wales
4. SEPA
5. CISA KEV
6. NCSC
7. UKHSA
8. FSA Food Alerts
9. USGS Earthquakes
10. NOAA Space Weather
11. NESO

### F02 — Environment Agency failure scenario

**Expected:** A temporary upstream failure must not produce a false clear state.

**Result:** PASS

During MVP4.6 testing the Environment Agency endpoint returned HTTP 503.

The system:

- retained the previous usable data;
- marked the feed stale;
- surfaced the degraded state;
- subsequently recovered when the source became available.

This provides a real-world validation of the fail-safe feed model.

### F03 — Feed assurance automation

**Expected:** Automated assurance tests cover endpoint availability, payload shape, collector output, provenance, duplicates, freshness, failure and recovery behaviour.

**Result:** PASS / EVIDENCE TO RETAIN

The feed assurance workflow and unit assurance tests are present.

The formal release evidence pack should retain the latest workflow result and per-feed output.

---

## 7. Coverage and data-status tests

### C01 — Coverage model

**Expected:** The dashboard distinguishes actual coverage from taxonomy membership.

**Result:** PASS

The go-live model explicitly distinguishes:

- Covered
- Partial
- Reference-only
- Gap

### C02 — Known coverage gaps

**Expected:** Known limitations are explicit.

**Result:** PASS

Documented gaps include:

- terrorism
- state threats
- geographic/diplomatic risks
- societal risks
- conflict and instability

### C03 — Geographic limitations

**Expected:** Material geographic limitations are disclosed.

**Result:** PASS

Documented limitations include:

- Northern Ireland flooding is reference-only;
- health coverage is England-focused.

### C04 — Domain limitations

**Expected:** Partial domain coverage is not presented as comprehensive.

**Result:** PASS

Examples explicitly documented:

- supply chain coverage is strongest for food;
- energy is a system-monitoring indicator rather than an outage-warning feed;
- other natural-hazard coverage is not comprehensive.

---

## 8. Supporting-content tests

### S01 — Weather contextualisation

**Expected:** Weather-specific content is not permanently displayed for unrelated risks.

**Result:** PASS

Weather content is conditionally displayed for relevant weather/flood contexts.

### S02 — Data confidence contextualisation

**Expected:** Data confidence should only appear where the selected context makes it relevant.

**Result:** PASS

The current implementation limits this content to the relevant weather context and UK geography.

### S03 — Irrelevant-content suppression

**Expected:** Non-relevant supporting content should not clutter other risk investigations.

**Result:** PASS

The MVP4.5/MVP4.6 workspace design suppresses weather-specific supporting content when another risk context is selected.

---

## 9. Monitoring preferences

### P01 — Local preferences

**Expected:** Monitoring preferences are stored locally and do not introduce server-side personal or organisational data.

**Result:** PASS

Preferences use browser local storage.

### P02 — Preference scope

**Expected:** Saved preferences affect the opening view but do not silently overwrite current investigation filters.

**Result:** PASS

The implementation separates:

- opening/default preferences
- current session investigation state

### P03 — Preference options

**Expected:** User can configure:

- default geography;
- default risk themes;
- minimum priority.

**Result:** PASS

All three controls are implemented.

### P04 — Persistence

**Expected:** Saved preferences remain available after reload.

**Result:** CONDITIONAL

Implementation supports persistence, but a final live browser evidence capture should be retained in the release evidence pack.

---

## 10. Security tests

### SEC01 — Public data boundary

**Result:** PASS

The current MVP does not store:

- organisational sites;
- business continuity plans;
- organisational vulnerabilities;
- personal data;
- credentials;
- confidential organisational information.

### SEC02 — Content handling

**Result:** PASS

External feed content is treated as untrusted and browser-rendered content is escaped.

### SEC03 — Browser security

**Result:** PASS

The application includes a restrictive Content Security Policy and appropriate external-link handling.

### SEC04 — GitHub Actions

**Result:** PASS

The reviewed workflows use:

- least-privilege permissions;
- pinned third-party Actions;
- controlled write permissions where required.

### SEC05 — Code security

**Result:** PASS / EVIDENCE TO RETAIN

CodeQL is configured for JavaScript and Python.

The final release evidence pack should retain the successful CodeQL run associated with the release.

### SEC06 — Secrets

**Result:** PASS

No application secrets or credentials are committed to the repository.

Cloudflare credentials are held as GitHub repository secrets.

---

## 11. Deployment tests

### DEP01 — GitHub Pages

**Result:** PASS / EVIDENCE TO RETAIN

The GitHub Pages deployment workflow is configured and has been used as the public deployment path.

### DEP02 — Cloudflare Pages staging

**Result:** PASS

The Cloudflare Pages staging environment was used for the critical Cyber/UK smoke test.

The Cyber/UK issue was traced to deployment propagation rather than application filtering logic.

### DEP03 — Automatic staging deployment

**Result:** CONDITIONAL

The Cloudflare workflow has been changed so pushes to `main` automatically deploy the staging branch.

Commit:

`40a50718c06567876915b8cea4af2f80032c01a6`

A final successful workflow run should be retained as evidence before production deployment.

### DEP04 — Production deployment

**Result:** NOT TESTED

Production deployment remains intentionally controlled and should occur only after the Conditional findings are closed.

---

## 12. User journey test

### U01 — Select → Assess → Investigate

**Expected:**

1. Select a risk theme.
2. Select geography/domain if required.
3. Review current signals.
4. Inspect severity/status/priority.
5. Follow the authoritative source for investigation.

**Result:** PASS

The Cyber → UK journey has been explicitly verified.

### U02 — Source provenance

**Expected:** A signal provides a source link.

**Result:** PASS

Current signal rendering includes source links where valid HTTPS source URLs are available.

### U03 — No organisational assessment implied

**Expected:** Public signals must not be presented as organisation-specific risk assessments.

**Result:** PASS

The current assessment model does not introduce:

- organisational exposure;
- asset criticality;
- likelihood;
- impact;
- RTO;
- MTPD;
- organisational risk score.

---

## 13. Known limitations accepted for MVP4.6

The following are intentional limitations rather than defects:

1. The monitor does not provide comprehensive UK risk coverage.
2. Several NRR 2026 high-level themes currently have no automated feed.
3. Flooding coverage is incomplete for Northern Ireland.
4. Health coverage is England-focused.
5. Supply-chain coverage is strongest for food alerts.
6. Energy monitoring is an indicator rather than an outage-warning service.
7. Other natural-hazard coverage is not comprehensive.
8. CISA vulnerability catalogue entries are international monitoring signals, not organisation-specific cyber alerts.
9. Browser-local preferences are not synchronised between devices.
10. The current product is not an organisational BCMS or enterprise resilience platform.

These limitations must remain visible and must not be interpreted as evidence of absence of risk.

---

## 14. Release evidence required

Before unconditional production release, retain:

- [ ] Release/main commit SHA
- [ ] Successful Cloudflare staging deployment run
- [ ] Successful GitHub Pages deployment run
- [ ] Successful CodeQL run
- [ ] Latest feed assurance run
- [ ] Per-feed assurance results
- [ ] Current data timestamp
- [ ] Current signal count
- [ ] Coverage status by domain
- [ ] Browser smoke-test record
- [ ] Monitoring-preference persistence test
- [ ] Final production deployment record

---

## 15. Final gate

### Current status: CONDITIONAL

**Reason:**

The core MVP4.6 capability is operational and the main data/security/coverage controls pass. Two evidence items remain before an unconditional production release:

1. retain successful automatic Cloudflare staging deployment evidence;
2. complete and record the final live browser smoke-test suite.

### Release decision

> **MVP4.6 may proceed to controlled production deployment only after the two outstanding evidence conditions are closed.**

No new feature development is required to close these conditions.

---

## 16. Post-go-live monitoring

Following production release:

- review feed assurance results;
- monitor stale and failed feeds;
- confirm scheduled data updates continue;
- monitor CodeQL and Dependabot;
- review coverage gaps;
- record source-quality issues;
- review user feedback;
- avoid introducing organisational data until the public monitoring foundation has demonstrated stable operation.

---

## 17. Next product gate

Once MVP4.6 has operated reliably, the next product decision should be based on evidence from:

> **Monitor → Identify → Assess → Investigate**

before progressing to:

> **Organisational Context → Prevent / Mitigate → Plan → Validate**

Organisational data should not be introduced merely to compensate for gaps in the public monitoring layer.

---

**Report status:** Conditional Go-Live  
**Release:** MVP4.6  
**Prepared:** 27 September 2026
