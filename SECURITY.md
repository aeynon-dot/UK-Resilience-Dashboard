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
