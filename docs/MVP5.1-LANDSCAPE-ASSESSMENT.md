# MVP5.1 — AI Landscape Assessment

## Purpose

Define the first user-facing AI capability: assess the current monitored risk landscape as a collection of signals and present a concise **What needs attention?** view.

MVP5.1 does not expose an AI risk score or authoritative risk ranking.

## User journey

`Open RM → deterministic landscape snapshot → material-change gate → AI landscape assessment → What needs attention? → investigate`

The same assessment pathway is used after a material monitoring/search change or an explicit **Reassess**.

## Deterministic gate

The deterministic RM layer decides whether reassessment is warranted.

### Reassessment triggers

- initial landscape load
- geography change
- monitored-domain change
- material monitoring/filter change
- new significant signal
- material signal change
- escalation/de-escalation
- emergence of related signals
- explicit manual Reassess

### No reassessment

- routine refresh with no material change
- timestamp-only change
- minor metadata change that does not affect evidence quality

A landscape snapshot ID must identify the evidence state being assessed.

## AI input

The AI receives the bounded MVP5 Foundation assessment context only:

- monitoring scope
- current signals
- signal changes
- evidence quality
- deterministic relationships
- data-quality limitations

No raw credentials, uncontrolled external content or detailed organisational documents are included.

## AI output

The output is structured and schema-validated.

Valid states:

- `supported`
- `with_limitations`
- `insufficient_evidence`
- `unavailable`

For a supported assessment, attention items contain:

- title
- assessment
- supporting signal IDs
- structured evidence claims (signal ID + approved context field + exact value)
- rationale
- evidence strength
- uncertainty
- investigation areas

Default presentation is concise: approximately 3–5 items, with access to additional potential attention items.

## Attention logic

Assessment considers:

1. material change
2. potential significance
3. relevance to monitoring scope
4. evidence strength
5. persistence/escalation
6. breadth across locations/domains/dependencies
7. recency

These factors inform **attention priority**, not a numerical risk score or authoritative risk ranking.

## Pattern guardrails

Potential relationships can be identified using:

- common geography
- common hazard/theme
- temporal relationship
- plausible causal relationship
- independent supporting evidence
- materiality
- source quality

Correlation is evidence for investigation, not proof of causation.

Patterns should be suppressed or qualified where evidence is weak, stale, duplicated, unrelated or insufficient.

## Safe failure

If the AI provider is unavailable or returns unusable output:

- RM evidence remains available
- assessment state becomes `unavailable`
- no invented assessment is shown
- the user can manually reassess

AI failure must not become RM failure.

## Provenance

Every assessment retains:

- assessment ID
- generated time
- landscape snapshot ID
- monitoring configuration
- evidence snapshot reference
- provider/model version
- prompt version
- schema version
- limitations

## Explicit non-goals

MVP5.1 does not:

- calculate or display an AI risk score
- present an authoritative risk ranking
- make organisational impact claims
- modify RM evidence
- execute actions
- modify organisational context
- generate autonomous alerts
- add detailed organisational context


## Authoritative source provenance

AssessmentContext preserves source-native warning/status separately from RM severity and priority. Where available it also carries the authoritative source URL, source record identifier, observed/collected timestamps and curated guidance references supplied by the deterministic RM source layer. These are bounded evidence/provenance fields; the AI must not strengthen or reinterpret source-native warning levels. Missing source detail remains missing and must not be inferred.


## Evidence-grounding boundary

Attention-item prose is interpretation, not an additional evidence source. Each item must include at least one structured `evidence_claim` whose signal ID, field and value exactly match the bounded AssessmentContext. The gateway rejects unknown signals, unsupported fields and values that do not match the context.

Quoted factual/source wording in title, assessment, rationale, uncertainty or investigation text must also be present in the supplied AssessmentContext. This prevents the AI layer from presenting invented source wording such as a warning phrase that was not supplied to it.

This is a deterministic evidence-boundary control, not a general semantic fact-checker. Free-text interpretation remains subject to evidence strength and uncertainty; unrestricted external browsing is not used to compensate for missing evidence.
