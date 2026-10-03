# MVP5.2 — Individual Risk Interpretation

## Purpose
When a user selects an individual RM signal, provide a bounded interpretation of that signal without changing RM evidence or making organisation-specific impact claims.

### User journey
Select risk → RM evidence → individual assessment → uncertainty → investigate → user decides

## Evidence boundary
The individual assessment receives the selected RM signal, a small deterministic set of related signals where relationships exist, monitoring scope and data-quality limitations. It does not receive unrestricted external content or organisational context.

## Output
A supported/limited assessment contains Assessment, Why it may matter, Potential significance, Supporting evidence, Uncertainty, Investigate next, Show me the evidence and usefulness feedback.

## Safety boundary
MVP5.2 must not modify RM evidence, invent source status or warning language, claim an organisation is affected, infer organisational exposure without organisational context, present an AI risk score, execute actions, autonomously alert or use unrestricted browsing.

## Development provider
A deterministic development/shadow provider may exercise the MVP5.2 UI and contract before a live AI provider is connected. It must be clearly labelled as a development assessment and never represented as live AI output.
