# UK Resilience Dashboard — MVP1

A £0-cost, mobile-friendly dashboard for a personal UK resilience briefing.

## MVP1 data feeds
- Met Office UK severe weather warning RSS
- Environment Agency real-time flood API
- Natural Resources Wales live flood-warning page
- SEPA Scotland live flooding page

## Architecture
GitHub Actions → `data/current.json` → GitHub Pages → iPhone/iPad/laptop.

No server, Raspberry Pi, database or paid service is required for MVP1.

## Setup
The repository is designed for GitHub Pages. In **Settings → Pages**, select **GitHub Actions** as the publishing source if GitHub has not already enabled it.

The data workflow runs every 15 minutes and can also be started manually from **Actions → Update UK resilience data → Run workflow**.

## Important
This dashboard is an information aid and does not replace official warning/alert channels. Always follow the latest advice from the relevant official service.


## Deployment status
GitHub Pages is configured to publish this repository through GitHub Actions.
