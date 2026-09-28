# MVP4.7.2a — Feed Recovery Tracking

## Purpose

MVP4.7.2a establishes the recovery-tracking foundation for the public monitoring pipeline.

The objective is to preserve useful feed history when a collection attempt fails and to distinguish an initial successful collection from a subsequent recovery.

## Design

The canonical feed-health vocabulary remains unchanged:

- `healthy`
- `stale`
- `degraded`
- `unavailable`
- `reference_only`

Recovery is metadata associated with a feed-health state, not a sixth health state.

The recovery-tracking helper records:

- `last_success_at` — the most recent successful collection time.
- `degraded_since` — the start of the current degradation/outage period.
- `recovered_at` — the time a feed successfully recovered following a failed state.

## Behaviour

### First successful collection

A first successful collection records `last_success_at` but does not record `recovered_at`.

### Failure after a successful collection

A failed collection:

- preserves the previous `last_success_at`;
- records `degraded_since` when entering a failed/degraded condition;
- preserves the original `degraded_since` across repeated failures;
- retains the current error when supplied.

This prevents a transient collection failure from being incorrectly represented as a feed that has never previously succeeded.

### Recovery

When a feed succeeds after a failed state:

- `last_success_at` is updated;
- `recovered_at` is recorded;
- the existing `degraded_since` is preserved;
- the current error is cleared.

A successful first collection is not treated as a recovery.

## Test coverage

Regression tests cover:

1. first success records `last_success_at`;
2. failure preserves the previous successful collection time;
3. failure records the beginning of degradation;
4. recovery records `recovered_at`;
5. recovery preserves the original degradation start time;
6. repeated failures do not reset `degraded_since`;
7. first success does not create a recovery event.

The recovery tests are passing on the MVP4.7.2a branch.

## Scope boundary

This increment is deliberately limited to the recovery-tracking foundation.

It does **not** yet:

- integrate the helper into all feed collectors;
- calculate outage duration in the production data pipeline;
- change dashboard presentation;
- expose recovery information to public users;
- implement the broader MVP4.7.2 source-quality transparency work.

Those remain potential subsequent development increments and should be evaluated before implementation.

## Evaluation status

MVP4.7.2a provides a tested foundation for recovery tracking. It should not be described as a completed end-to-end recovery feature until collector integration and public presentation have been implemented and verified.

This branch is intended to remain separate from the stable production `main` baseline pending evaluation.
