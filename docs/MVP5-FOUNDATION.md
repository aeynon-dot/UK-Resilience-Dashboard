# MVP5 Foundation — AI Assessment Gateway

## Purpose
Provide a controlled, replaceable foundation for AI-assisted interpretation of Resilience Monitor evidence.

This foundation does **not** select an AI provider or expose a live model yet. It defines the contract between deterministic RM evidence and future AI assessment.

## Boundary
### Deterministic RM remains authoritative for
- feed ingestion and validation
- source provenance
- freshness and feed health
- geography filtering
- aggregation and counts
- material-change detection
- monitoring preferences
- evidence-confidence inputs
- landscape snapshots

### AI may
- interpret the supplied assessment snapshot
- identify potentially meaningful patterns
- explain why items may warrant attention
- describe potential significance
- identify uncertainty and evidence limitations
- suggest investigation areas
- later suggest attributable good-practice mitigation strategies

### AI must not
- override authoritative RM evidence
- change RM data
- silently modify organisational context
- make confirmed organisational impact claims without evidence
- make organisational decisions
- execute mitigation or operational actions

## Assessment Gateway
The browser must never hold an AI provider secret. Provider credentials belong server-side.

Conceptual flow: `RM data sources → deterministic RM layer → landscape snapshot → AI Assessment Gateway → structured assessment → RM UI → user feedback / decision`.

The gateway provides controlled input, provider/model abstraction, prompt/version tracking, structured output validation, provenance, usage/cost controls and safe failure.

## Input contract
The gateway receives a timestamped assessment snapshot containing only data required for assessment: monitoring scope, current signals, material changes, evidence quality, deterministic relationships and known limitations. Organisational context is added only when explicitly enabled in a later MVP.

Raw credentials, uncontrolled external content, personal data and detailed organisational documents are out of scope.

## Output contract
The first implementation uses structured output rather than free-form UI generation.

Required concepts: assessment status, attention items, supporting signal IDs, rationale, evidence strength, uncertainty and investigation areas.

Valid assessment states: `supported`, `with_limitations`, `insufficient_evidence`, `unavailable`.

`unavailable` is a safe failure state and must not be converted into an invented assessment.

## Provenance
Every generated assessment must retain enough metadata to answer which landscape snapshot and monitoring configuration were assessed, when it was generated, which provider/model/prompt/schema versions were used, which evidence snapshot supported it, and what limitations were present.

Assessments retain references to underlying RM signal IDs rather than copying evidence without provenance.

## RM confidence vs AI uncertainty
These are separate. RM evidence confidence describes the reliability/currentness of underlying data. AI assessment uncertainty describes how confidently that evidence supports the interpretation.

## Material-change gate
Routine refreshes must not automatically invoke AI when no material change has occurred. Potential triggers include initial load, geography change, material monitoring/filter change, new significant signal, material signal change, escalation/de-escalation, emergence of related signals, and explicit user Reassess.

The deterministic layer decides whether a material change exists.

## Feedback
Assessment feedback is explicit evaluation evidence: Useful / Not useful, with optional reasons: Not relevant, Evidence insufficient, Already known, Missing something important, Incorrect interpretation, Other.

Feedback must not silently retrain or alter model behaviour.

## Cost and operational controls
Support compact structured inputs, material-change gating, result reuse/caching where appropriate, usage limits, cost monitoring, graceful failure and explicit manual reassessment.

No provider commitment is made by this foundation issue.

## Good-practice knowledge
Where mitigation strategies are introduced, the knowledge basis must be attributable and versioned. The system should distinguish RM evidence, AI interpretation, good-practice basis and user decision.

## Initial implementation sequence
1. Define and test schemas/contracts.
2. Build deterministic assessment snapshot creation.
3. Build provider-neutral gateway interface.
4. Validate structured outputs.
5. Add provenance and safe-failure handling.
6. Add feedback capture.
7. Add a provider only after the gateway contract is tested.

## Acceptance checks
- No AI credential reaches browser code.
- Input is bounded to an assessment snapshot.
- Output is schema-validated.
- RM evidence remains traceable.
- RM confidence and AI uncertainty remain separate.
- Assessment unavailable is handled safely.
- Provider/model/prompt/schema versions are recorded.
- Feedback is stored as evaluation evidence.
- No organisational context is silently modified.
