# Secure-by-design principles

Resilience Monitor is intended to evolve from a public risk-monitoring tool into an open-source organisational preparedness platform.

Security decisions therefore need to be made before sensitive organisational data is introduced.

## Principles

### 1. Minimise data

Only collect and retain information needed for a defined resilience capability.

Public risk intelligence should remain separate from organisation-specific information.

### 2. Treat external data as untrusted

Feed responses, titles, descriptions, areas and other external values must be treated as untrusted input.

The application must escape or otherwise safely handle data before rendering it.

### 3. Least privilege

GitHub Actions, application components and future services should receive only the permissions they require.

Write access should only be granted where a workflow genuinely needs to update generated data.

### 4. Secure the supply chain

Third-party actions and dependencies should be pinned or otherwise controlled, monitored and updated.

Automated security scanning should run as part of normal development.

### 5. Separate public intelligence from organisational context

The public risk layer should not require access to confidential organisational information.

Future architecture should support clear separation between:

- external risk intelligence
- organisation profile
- risk assessment
- mitigation
- planning
- validation

### 6. Make provenance explicit

Every important risk signal should retain source, collection time and status information.

Future assessment outputs should be traceable to the underlying source data and rules used.

### 7. Fail safely

Feed failures must not silently become false "clear" conditions.

Where possible, the last known usable data is retained and clearly marked stale.

### 8. Design for tenant isolation

When organisational accounts are introduced, data isolation must be a first-class architecture requirement rather than an afterthought.

No organisation should be able to query or infer another organisation's private data.

### 9. Protect credentials and secrets

Credentials must never be committed to source control or embedded in client-side code.

Future service credentials should be stored using the hosting platform's secret-management capability.

### 10. Build for recovery

As the platform becomes stateful, backups, restoration testing, audit logging and disaster recovery must be designed alongside the data store.

## Security gates

Before introducing organisational data:

1. Threat model the feature.
2. Define data classification.
3. Define access-control requirements.
4. Define retention and deletion requirements.
5. Test failure modes.
6. Run automated security checks.
7. Perform an appropriate independent security review before production use.

## Current assurance checkpoint

On 2026-09-28, the current public MVP completed a security assurance review covering the repository security baseline, protected GitHub publication path and Cloudflare traffic/security controls.

The review recorded **GREEN security assurance for the current public-data architecture**. Cloudflare traffic included routine automated probing of predictable `.env` paths, with no evidence in the reviewed views of successful environment-file exposure. Cloudflare account MFA was enabled during the review.

This checkpoint is deliberately bounded to the current public, read-only MVP. It is not a security approval for future authenticated, organisational or confidential-data functionality.

## Current status

The current MVP is intentionally limited to public information and browser-local preferences. It is **not** an enterprise organisational resilience system and should not be used to store confidential organisational information.
