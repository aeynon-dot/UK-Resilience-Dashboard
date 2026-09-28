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

## Current status

The current MVP is intentionally limited to public information and browser-local preferences. It is **not** an enterprise organisational resilience system and should not be used to store confidential organisational information.


## Post-go-live verification — 28 September 2026

The MVP4.6 secure-by-design baseline has now been deployed and verified in production.

Verified controls include explicit 404 boundaries; deployment-level CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy; a fail-closed public bundle allowlist; repository secret/build-artifact exclusions; automated security regression coverage; successful staging security-boundary testing; successful production security-boundary testing; and protected production deployment through the `cloudflare-production` environment.

The production dashboard was smoke-tested after deployment and remains functional.

The secure-by-design baseline is therefore **complete for the current public MVP scope**. This is not enterprise security assurance and further threat modelling is required before private organisational data is introduced.

The Environment Agency flood-feed issue is tracked separately as a data-quality/reliability concern.
