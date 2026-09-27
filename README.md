# UK Resilience Dashboard — MVP2.3

A £0-cost, mobile-friendly personal UK resilience briefing.

## MVP2 adds
- Morning briefing summary
- New-warning/change detection against the previous collection
- Historical snapshots
- Safer feed-failure handling: last successful data is retained and marked STALE
- Consistent zero counts
- Dedicated weather-today panel ready for a configurable location
- Mobile-friendly layout for iPhone, iPad and laptop

## Current data feeds
- Met Office UK severe weather warning RSS
- Environment Agency real-time flood API
- Natural Resources Wales live flood-warning page
- SEPA Scotland live flooding page

## Architecture
GitHub Actions → data/current.json + data/history.json → GitHub Pages → browser.

The data workflow runs every 15 minutes and can also be started manually from Actions → Update UK resilience data → Run workflow.

## Weather location
MVP2 includes the weather panel but deliberately does not guess your home location. The next small configuration step is to add your chosen town/coordinates to config.json, then the collector can add a free forecast feed.

## Important
This dashboard is an information aid and does not replace official warning/alert channels. Always follow the latest advice from the relevant official service.


### Geographic map — MVP2.3

The risk map uses embedded UK country boundary TopoJSON for England, Wales, Scotland and Northern Ireland, replacing the earlier schematic SVG. The boundary dataset is from the public `jhellingsdata/map-data` collection and is derived from UK geographic boundary data.

Map data source: [jhellingsdata/map-data](https://github.com/jhellingsdata/map-data). The underlying UK boundary material is based on public UK geographic data; ONS digital boundary material is available under Open Government Licence terms and requires source attribution.