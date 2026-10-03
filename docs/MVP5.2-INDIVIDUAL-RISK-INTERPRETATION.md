# MVP5.2 — Individual Risk Interpretation

## Purpose

When a user selects an individual RM signal, provide a bounded interpretation of that signal without changing RM evidence or making organisation-specific impact claims.

### User journey

Select risk → RM evidence → individual AI assessment → uncertainty → investigate → user decides

## Evidence boundary

The individual assessment receives a bounded context containing:

- the selected RM signal
- a small set of deterministic related signals where relationships exist
- monitoring scope
- data-quality limitations

It does not receive unrestricted external content or organisational context.

## Output

A supported/limited assessment contains:

- **Assessment** — what the evidence may indicate
- **Why it may matter** — significance for investigation, not an impact conclusion
- **Potential significance** — what could make the signal relevant, without asserting organisational exposure
- **Supporting evidence** — exact evidence claims bound to AssessmentContext fields
- **Uncertainty** — explicit limitations
- **Investigate next** — suggested investigation areas
- **Show me the evidence** — the RM signal and exact evidence fields supporting the assessment
- **Feedback** — useful / not useful, recorded as evaluation evidence rather than silent model training

## Safety boundary

MVP5.2 must not:

- modify RM evidence
- invent source status or warning language
- claim an organisation is affected
- infer organisational exposure without organisational context
- present an AI risk score
- execute actions
- autonomously alert
- use unrestricted browsing

The user remains the decision maker.

## Failure behaviour

If the AI provider is unavailable or returns invalid output, the UI retains the RM evidence and states that the AI assessment is unavailable. AI failure must not remove or alter the underlying signal.

## Development provider

A deterministic development/shadow provider may be used to exercise the MVP5.2 UI and contract before a live AI provider is connected. It must be clearly labelled as a development assessment and must not be represented as live AI output.
