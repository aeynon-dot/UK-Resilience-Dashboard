# Security

## Security by design

Resilience Monitor is being developed with security built in from the outset.

The current public dashboard processes public risk and warning information only. It does **not** currently store organisational sites, business continuity plans, vulnerabilities, personal data, credentials or other confidential organisational information.

As the project evolves toward organisational preparedness, security controls will increase with data sensitivity.

## Current security baseline

- No secrets are stored in the repository.
- External feed content is treated as untrusted input.
- Browser-rendered feed content is HTML-escaped before insertion into the page.
- External links opened in a new tab use `rel="noopener"`.
- GitHub Actions use least-privilege workflow permissions.
- Third-party GitHub Actions are pinned to reviewed commit SHAs.
- Dependabot and CodeQL are enabled for dependency and code-security monitoring.
- The data collector limits external response size and writes generated files atomically.
- Security-sensitive changes should be reviewed before deployment.
- The protected `main` branch requires pull requests and required status checks; the automated data publisher uses a dedicated GitHub App identity with narrowly scoped repository access and an explicit protected-branch bypass.
- Cloudflare provides the public edge/WAF layer for the production deployment.
- Cloudflare account access is protected with MFA.

## 2026-09-28 security assurance review

A security assurance review was completed for the current public MVP.

### Repository and application controls

The repository security baseline, secure-by-design controls, workflow permissions, protected `main` branch and external-feed handling were reviewed. No new application security weakness was identified.

The automated data-publication path was identified as requiring a dedicated GitHub App identity because the protected `main` branch does not permit the standard GitHub Actions identity to bypass required pull-request checks. The publisher App has only the repository permissions required to update generated public data.

### Cloudflare traffic and security review

The Cloudflare production security overview for the preceding 24 hours showed approximately 1.27k requests, with 16 requests (1.27%) mitigated. The mitigated requests were blocked by Cloudflare WAF controls. No sustained high-volume pattern, rate-limit escalation or challenge escalation was observed in the reviewed overview.

Traffic review identified automated probes for predictable secret-file paths including `/mailer/.env`, `/worker/.env` and `/postmark/.env`. These are consistent with routine internet scanning. The reviewed traffic showed no evidence of successful exposure of an environment file; the observed `/mailer/.env` activity was concentrated on an IP also observed in the Cloudflare mitigated-traffic view. Response status for the individual probes was not captured as part of this review, so this conclusion is based on the available Cloudflare security and traffic views rather than direct response-log verification.

Cloudflare Security Insights initially identified an account user without MFA. MFA was enabled during the review. A separate low-severity suggestion to enable Turnstile was assessed as not required for the current public, read-only architecture because there is no public authentication or form workflow requiring CAPTCHA protection.

### Assurance outcome

**Security assurance status: GREEN for the current public MVP.**

This assessment is bounded to the current architecture and public-data scope. It does not constitute an assurance that future organisational, authenticated or confidential-data functionality will be secure without additional threat modelling, testing and independent review.

## Data classification roadmap

| Stage | Example data | Expected controls |
|---|---|---|
| Public | Official warnings and risk feeds | Current baseline |
| Internal | Organisation profile and sites | Authentication, access control, encryption, audit |
| Confidential | Dependencies, vulnerabilities, preparedness gaps | Strong tenant isolation, encryption, detailed audit, backup/DR |
| Sensitive | Detailed response arrangements and security-related information | Higher assurance, dedicated environments and independent testing |

## Reporting a vulnerability

Please do not disclose security vulnerabilities in public issues.

For a private report, use GitHub's **Security Advisories / Report a vulnerability** facility for this repository.

Include:

- affected component or file
- steps to reproduce
- security impact
- any suggested mitigation
- whether the issue is publicly known

Please allow reasonable time for assessment and remediation before public disclosure.

## Scope

This policy covers the Resilience Monitor source code, GitHub Actions workflows and project configuration.

Third-party official data providers remain responsible for the security of their own services and infrastructure.
