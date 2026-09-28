# Cloudflare Pages Deployment

## Purpose

Cloudflare Pages is the controlled public deployment path for UK Resilience Monitor. GitHub Pages remains available as a fallback.

## Architecture

```
GitHub repository
      │
      └── GitHub Actions ──> Cloudflare Pages
                              ├── staging
                              └── production
```

The workflow deploys the same controlled public bundle to staging and production.

## Current deployment status

MVP4.6 production go-live is complete.

MVP4.6.1 was subsequently merged to `main`, deployed to staging for verification, and promoted to production on 28 September 2026.

The Environment Agency flood-monitoring fix was verified in staging and production.

## One-time Cloudflare setup

1. Create a Cloudflare account if required.
2. Open **Workers & Pages**.
3. Create a new Pages project using **Direct Upload**.
4. Use project name: `uk-resilience-monitor`.
5. Set the production branch to `main`.
6. Do **not** connect the repository through Cloudflare's Git integration; this project uses the existing GitHub Actions pipeline.
7. Create a Cloudflare API token with the minimum Pages deployment permissions required.
8. Obtain the Cloudflare account ID.
9. Add these GitHub Actions repository secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`

## Deployment procedure

Run:

**GitHub → Actions → Cloudflare Pages deployment → Run workflow**

Select **staging** first for changes that require deployment verification.

For a production release, promote only after staging verification and successful required checks.

## Required staging smoke test

Check:

- page loads
- CSS loads
- JavaScript loads
- current data loads
- risk workspace appears
- left Risk & Assessment pane appears on desktop
- coverage panel loads
- monitoring preferences load
- risk filters work
- weather content is contextual
- data confidence is contextual
- source/provenance links work
- no obvious console/runtime failure
- deployed content matches the intended Git commit

## Production promotion

Production is a controlled manual promotion from the tested `main` state.

The protected `cloudflare-production` environment provides the production approval boundary.

GitHub Pages remains available as a fallback.

## Security requirements

- API token is stored only as a GitHub Actions secret.
- Account ID is stored only as a GitHub Actions secret.
- No Cloudflare credentials are committed to the repository.
- Cloudflare deployment workflow uses least-privilege GitHub permissions.
- Third-party Actions remain pinned to reviewed commit SHAs.
- Production promotion occurs only after staging verification.

## Future improvement

Potential future deployment improvements include:

- pull-request preview deployments;
- a custom domain;
- automated deployment health checks;
- documented rollback testing.

These are not required for the current MVP4.6/MVP4.6.1 release.

