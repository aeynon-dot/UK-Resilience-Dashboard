# MVP5 — Turning a Signal into an Assessment

## Objective

Extend the public Risk Identification → Risk Assessment workflow so that a user can select an individual external risk signal and move from **monitoring** to a concise, evidence-led public assessment.

## User journey

**Select → Assess → Investigate**

1. Select a risk theme, geography and/or domain.
2. Review the prioritised public signals.
3. Select a signal.
4. Review:
   - What happened?
   - Why does it matter?
   - What is changing?
   - What should I investigate?
5. Open the authoritative source for further investigation.

## MVP5 boundaries

The public assessment must remain based only on information available in the external signal and its provenance.

It must **not** infer or introduce:

- organisational exposure;
- organisational impact;
- likelihood;
- criticality;
- RTO/MTPD;
- business service impact;
- organisational risk score;
- private organisational vulnerabilities.

Those belong to the future **Organisational Context** layer.

## Current implementation

MVP5 introduces an individual signal assessment panel in the Risk & Assessment workspace.

The panel uses:

- signal description/hazard;
- severity;
- public monitoring priority;
- status;
- source geography;
- change type;
- latest available signal time;
- source record reference;
- authoritative source URL.

Signal content is escaped before rendering and external links retain the existing safe-link behaviour.

## Assessment model

### What happened?

Describe the external event, warning, advisory or observation using the signal description.

### Why does it matter?

Explain the public monitoring classification and context without making an organisation-specific impact judgement.

### What is changing?

Use the signal change classification and latest available observation/publication/collection time.

### What should I investigate?

Direct the user to the authoritative source and relevant risk domain/geography for deeper investigation.

## Acceptance criteria

- [x] Individual signals can be selected.
- [x] Assessment panel opens without leaving the main workspace.
- [x] Assessment is keyboard accessible.
- [x] Assessment can be closed.
- [x] Authoritative source link is available where present.
- [x] Signal provenance is retained.
- [x] No organisational risk scoring is introduced.
- [x] No private organisational data is required.
- [x] Existing risk filters continue to work.
- [ ] Live browser smoke test on Cloudflare production.
- [ ] Verify assessment behaviour with at least one Cyber signal and one non-Cyber signal.
- [ ] Verify source-link navigation.
- [ ] Verify no console/runtime errors.

## Next increment

After the interaction is validated, the next MVP5 increment should improve the **evidence and change analysis** behind the assessment rather than adding more dashboard sections.

Potential next capabilities:

- clearer signal chronology;
- explicit source publication vs observation vs collection timestamps;
- related/changed signals;
- concise "what changed since last collection";
- stronger evidence/provenance presentation.

These should remain public monitoring capabilities until the Organisational Context stage is deliberately introduced.


## Current status note — 28 September 2026

This document remains the design/history record for its MVP increment. MVP4.6 is now deployed to production and the public secure-by-design baseline has been verified. Future changes should preserve the separation between public risk intelligence and private organisational context described here.
