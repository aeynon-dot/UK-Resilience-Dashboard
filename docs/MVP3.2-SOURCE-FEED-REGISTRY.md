# MVP3.2 — Source / Feed Registry

## Purpose

The Source / Feed Registry is the authoritative configuration layer for external risk-information sources.

It answers:

- What source do we use?
- Who publishes it?
- What type of source is it?
- How do we access it?
- Which risk themes and domains does it support?
- Which geography does it cover?
- How frequently should it update?
- How much staleness is acceptable?
- Is it automated or reference-only?

This separates **source configuration** from collection code.

## Files

- `data/source-registry.json` — source inventory
- `schemas/source-registry.schema.json` — registry contract
- `docs/MVP3.2-SOURCE-FEED-REGISTRY.md` — design notes

## Registry versus runtime status

The registry describes the expected source.

It does not assert that the source is currently available.

Runtime collection status remains in `data/current.json`, including successful collection time, stale state and errors.

Therefore:

**registry = configuration**

**feed status = runtime observation**

## Source categories

MVP3.2 supports:

- warning feeds
- live APIs
- web feeds
- datasets
- bulletins
- reference-only sources

A reference-only source can be listed before an automated integration exists. This is useful for identifying coverage gaps without pretending that the dashboard has live data.

## Security

Source URLs and feed content are external/untrusted input.

The registry therefore records provenance and expected behaviour but does not grant trust or permissions to a source.

No credentials, API keys, organisation-specific endpoints or private data belong in this public registry.

## Current coverage

The registry covers the four automated sources currently feeding the dashboard plus the Northern Ireland DfI Rivers reference source.

Future feeds can be added without changing the Risk Signal contract.
