# Cloudflare Pages Deployment

## Purpose

Cloudflare Pages is being added as a **parallel hosting path** for UK Resilience Monitor. GitHub Pages remains unchanged and remains the existing public deployment until the Cloudflare path has passed its own smoke test.

Cloudflare supports direct Pages deployment with Wrangler from GitHub Actions, including production and branch/preview deployments. citeturn0search0turn0search1

## Architecture

```
GitHub repository
      │
      ├── GitHub Actions ──> GitHub Pages
      │
      └── GitHub Actions ──> Cloudflare Pages
                              ├── staging
                              └── production
```

The Cloudflare workflow is intentionally **manual at first**. This prevents an unconfigured Cloudflare account or missing credentials from affecting the existing GitHub Pages deployment.

## One-time Cloudflare setup

1. Create a Cloudflare account if required.
2. Open **Workers & Pages**.
3. Create a new Pages project using **Direct Upload**.
4. Use project name: `uk-resilience-monitor`.
5. Set the production branch to `main`.
6. Do **not** connect the repository through Cloudflare's Git integration; this project is designed to use the existing GitHub Actions pipeline.
7. Create a Cloudflare API token with the minimum Pages deployment permissions required by the Cloudflare documentation.
8. Obtain the Cloudflare account ID.
9. Add these GitHub Actions repository secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`

Cloudflare's current CI documentation specifically supports Wrangler deployment from GitHub Actions using these two secrets. citeturn0search0

## First deployment

Run:

**GitHub → Actions → Cloudflare Pages deployment → Run workflow**

Select **staging** first.

The workflow deploys using the `staging` branch alias. Cloudflare Pages Direct Upload supports branch deployments and branch-specific Pages URLs. citeturn0search1

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

Do not switch the public DNS or primary public link immediately.

First establish:

`GitHub Pages = existing public service`

`Cloudflare Pages = parallel staging/production candidate`

After Cloudflare production has passed smoke testing, decide whether to:

1. retain GitHub Pages as the fallback;
2. make Cloudflare the primary public host; or
3. use a custom domain with Cloudflare while retaining GitHub Pages as an operational fallback.

## Security requirements

- ☐ API token is stored only as a GitHub Actions secret.
- ☐ Account ID is stored only as a GitHub Actions secret.
- ☐ No Cloudflare credentials are committed to the repository.
- ☐ Cloudflare deployment workflow uses least-privilege GitHub permissions.
- ☐ Third-party Actions remain pinned to reviewed commit SHAs.
- ☐ Cloudflare deployment is independently smoke-tested before becoming primary.
- ☐ GitHub Pages remains available during transition.

## Important implementation note

Cloudflare currently supports both Git integration and Direct Upload. This project uses Direct Upload deliberately so that the existing GitHub Actions pipeline remains the build/deployment control point. Cloudflare notes that Direct Upload and Git integration are distinct project modes and cannot simply be switched between later. citeturn0search1turn0search6

## Future improvement

Once the Cloudflare path is proven, consider adding:

- automatic deployment of `main` to Cloudflare production;
- pull-request preview deployments;
- a custom domain;
- deployment health checks;
- rollback procedures.

Cloudflare Pages supports preview deployments and production rollbacks. citeturn0search2turn0search4


## Current production state — 28 September 2026

Cloudflare Pages is now an active production deployment rather than a parallel candidate.

- Project: `uk-resilience-monitor`
- Production URL: `https://uk-resilience-monitor.pages.dev`
- Staging URL: `https://staging.uk-resilience-monitor.pages.dev`
- Production deployment requires the protected `cloudflare-production` GitHub environment approval.
- Pushes to `main` deploy to the Cloudflare staging branch; production is promoted manually through the workflow.
- GitHub Pages remains the fallback deployment path.

### Production security verification

The production smoke test passed: the normal dashboard loads and functions, while `/.env`, `/worker/.env`, `/mailer/.env`, `/postmark/.env`, `/.git/config`, `/.aws/credentials.json` and `/gcloud-service-key.json` all return 404. Staging verification confirmed the required security response headers are served correctly.

Production should continue to be treated as a controlled promotion from the tested `main` state.
