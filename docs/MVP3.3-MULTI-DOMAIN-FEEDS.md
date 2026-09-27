# MVP3.3 — Multi-domain feed integration

MVP3.3 proves that the common Risk Signal model can ingest materially different public data structures without changing the dashboard's existing MVP2 feeds.

## Initial integration set

- **Cyber — CISA Known Exploited Vulnerabilities:** JSON catalogue.
- **Health — UKHSA Data Dashboard:** unauthenticated JSON API, using an infectious-disease surveillance metric.
- **Supply chain — FSA Food Alerts:** REST API with JSON output.
- **Natural hazard — USGS Earthquakes:** GeoJSON summary feed, retaining M5.0+ events for the test.
- **Space weather — NOAA SWPC:** planetary K-index JSON feed.
- **Energy — NESO:** public CKAN datastore API for electricity-system demand data.

The integrations are deliberately additive. Existing weather and flood collection remains unchanged.

## Pipeline

```
source/feed
    ↓
source registry
    ↓
bounded collection
    ↓
source-specific normalisation
    ↓
common Risk Signal
    ↓
data/current.json
    ↓
future Monitor → Assess → Mitigate → Plan → Validate
```

## Design choices

The first implementation does **not** infer organisational exposure or business impact. It only records externally observable signals.

Where a source does not provide a defensible severity rating, the signal uses `unknown` rather than inventing one.

The integration also records feed status separately from risk signals. A source can fail without being represented as a risk event.

## Security

- External responses remain untrusted input.
- The existing 2 MB response limit applies.
- No credentials are required for these six sources.
- Source URLs and content are configuration/input, not trusted executable content.
- Raw source data is not rendered directly into HTML by this MVP3.3 change.
- Organisation-specific data remains outside the public data pipeline.
