import json
import re
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

from risk_model import normalise_current

SOURCE_REGISTRY = Path('data/source-registry.json')

HEAD = {'User-Agent': 'UK-Resilience-Dashboard/2.4 (+https://github.com/aeynon-dot/UK-Resilience-Dashboard)'}
MAX_RESPONSE_BYTES = 2_000_000
CURRENT = Path('data/current.json')
HISTORY = Path('data/history.json')


def get(url):
    req = urllib.request.Request(url, headers=HEAD)
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read(MAX_RESPONSE_BYTES + 1)
    if len(raw) > MAX_RESPONSE_BYTES:
        raise ValueError('External response exceeded the safety size limit')
    return raw


def get_json(url):
    return json.loads(get(url).decode('utf-8'))


def ea():
    raw = get_json('https://environment.data.gov.uk/flood-monitoring/id/floods')
    counts = {1: 0, 2: 0, 3: 0}
    items = []
    for x in raw.get('items', []):
        s = x.get('severity')
        counts[s] = counts.get(s, 0) + 1
        if s in (1, 2, 3):
            items.append({
                'level': {1: 'Severe', 2: 'Warning', 3: 'Alert'}[s],
                'title': x.get('description') or x.get('eaAreaName') or 'Current flood item'
            })
    return {
        'warnings': counts.get(2, 0),
        'alerts': counts.get(3, 0),
        'severe': counts.get(1, 0),
        'items': items
    }


def uk_weather():
    raw = get('https://weather.metoffice.gov.uk/forecast/uk').decode('utf-8', 'ignore')
    text = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', raw, flags=re.I | re.S)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&(?:amp|nbsp|quot|#39);', ' ', text, flags=re.I)
    text = re.sub(r'\s+', ' ', text).strip()
    matches = re.findall(
        r'UK weather.*?(?:yellow|amber|red) warning.*?Today:\s*(.*?)(?:\s+Tonight:|\s+Monday:|\s+Outlook for)',
        text,
        re.I
    )
    summary = matches[-1].strip() if matches else 'National forecast available'
    summary = re.sub(r'&(?:amp|nbsp|quot|#39);', ' ', summary, flags=re.I)
    summary = re.sub(r'\s+', ' ', summary).strip()
    return {
        'summary': summary[:600],
        'source': 'Met Office UK national forecast',
        'url': 'https://weather.metoffice.gov.uk/forecast/uk'
    }


def warning_regions(title, desc):
    text = (title + ' ' + desc).lower()
    regions = []
    if re.search(r'\b(united kingdom|uk)\b', text):
        regions.append('UK')
    if 'england' in text or re.search(
        r'\bnorth west\b|\bnorth east\b|\nyorkshire\b|\bhumber\b|'
        r'\bwest midlands\b|\beast midlands\b|\beast of england\b|'
        r'\bsouth west\b|\blondon\b|\bsouth east\b',
        text
    ):
        regions.append('England')
    if 'wales' in text:
        regions.append('Wales')
    if 'scotland' in text or re.search(
        r'\borkney\b|\bshetland\b|\bhighlands\b|\bgrampian\b|'
        r'\bstrathclyde\b|\btayside\b|\bfife\b|\blothian\b',
        text
    ):
        regions.append('Scotland')
    if 'northern ireland' in text:
        regions.append('Northern Ireland')
    return sorted(set(regions))


def met():
    raw = get('https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/UK')
    root = ET.fromstring(raw)
    items = []
    for item in root.findall('.//item'):
        title = item.findtext('title') or ''
        desc = item.findtext('description') or ''
        clean = lambda value: re.sub(r'<.*?>', '', value).strip()
        level = 'Red' if 'Red' in title else ('Amber' if 'Amber' in title else 'Yellow')
        clean_title = clean(title) or clean(desc)
        items.append({
            'level': level,
            'title': clean_title,
            'regions': warning_regions(clean_title, clean(desc))
        })
    return {'count': len(items), 'items': items}


def wales():
    raw = get('https://flood-warning.naturalresources.wales/AToZ').decode('utf-8', 'ignore')
    text = re.sub(r'<[^>]+>', ' ', raw)
    text = re.sub(r'\s+', ' ', text)
    severe = len(re.findall(r'Severe Flood Warning\s+in force', text, re.I))
    warnings = len(re.findall(r'Flood Warning\s+in force', text, re.I)) - severe
    alerts = len(re.findall(r'Flood Alert\s+in force', text, re.I))
    return {
        'warnings': max(0, warnings),
        'alerts': alerts,
        'severe': severe,
        'items': []
    }


def scotland():
    raw = get('https://beta.sepa.scot/flooding').decode('utf-8', 'ignore')
    text = re.sub(r'<[^>]+>', ' ', raw)
    text = re.sub(r'\s+', ' ', text)

    def m(pattern):
        match = re.search(pattern, text, re.I)
        return int(match.group(1)) if match else 0

    return {
        'warnings': m(r'(\d+)\s+Flood warnings'),
        'alerts': m(r'(\d+)\s+Flood alerts'),
        'severe': m(r'(\d+)\s+Severe flood warnings'),
        'items': []
    }


def cisa_kev():
    raw = get_json('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json')
    vulnerabilities = raw.get('vulnerabilities', [])
    recent = vulnerabilities[-50:]
    return {
        'catalog_version': raw.get('catalogVersion'),
        'count': len(vulnerabilities),
        'items': [
            {
                'cveID': x.get('cveID'),
                'vendorProject': x.get('vendorProject'),
                'product': x.get('product'),
                'vulnerabilityName': x.get('vulnerabilityName'),
                'dateAdded': x.get('dateAdded'),
                'dueDate': x.get('dueDate')
            }
            for x in recent
            if x.get('cveID')
        ]
    }


def ukhsa():
    url = (
        'https://api.ukhsa-dashboard.data.gov.uk/themes/infectious_disease/'
        'sub_themes/respiratory/topics/COVID-19/geography_types/Nation/'
        'geographies/England/metrics/COVID-19_cases_casesByDay?page_size=30'
    )
    raw = get_json(url)
    results = raw.get('results', [])
    return {
        'metric': 'COVID-19_cases_casesByDay',
        'geography': 'England',
        'count': len(results),
        'latest': results[-1] if results else None,
        'items': results[-30:]
    }


def fsa_food_alerts():
    url = 'https://data.food.gov.uk/food-alerts/id?_limit=25&_sort=-modified&_view=full'
    raw = get_json(url)
    items = raw.get('items', [])
    return {
        'count': len(items),
        'items': [
            {
                'id': x.get('notation'),
                'title': x.get('title'),
                'modified': x.get('modified'),
                'type': [str(t) for t in x.get('type', [])] if isinstance(x.get('type'), list) else x.get('type'),
                'status': x.get('status.label'),
                'alert_url': x.get('alertURL'),
                'country': x.get('country.label')
            }
            for x in items
        ]
    }


def usgs_earthquakes():
    raw = get_json('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson')
    items = []
    for feature in raw.get('features', []):
        p = feature.get('properties', {})
        if (p.get('mag') or 0) >= 5.0:
            coords = feature.get('geometry', {}).get('coordinates') or []
            items.append({
                'id': feature.get('id'),
                'magnitude': p.get('mag'),
                'place': p.get('place'),
                'time': p.get('time'),
                'updated': p.get('updated'),
                'url': p.get('url'),
                'longitude': coords[0] if len(coords) > 0 else None,
                'latitude': coords[1] if len(coords) > 1 else None,
                'depth_km': coords[2] if len(coords) > 2 else None
            })
    return {'count': len(items), 'items': items}


def noaa_space_weather():
    raw = get_json('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')
    rows = raw[1:] if isinstance(raw, list) and raw else []
    latest = rows[-1] if rows else None
    return {
        'headers': raw[0] if raw and isinstance(raw[0], list) else [],
        'latest': latest,
        'recent': rows[-24:]
    }


def neso():
    resource_id = '177f6fa4-ae49-4182-81ea-0c6b35f26ca6'
    url = (
        'https://api.neso.energy/api/3/action/datastore_search?resource_id='
        + quote(resource_id) + '&limit=20'
    )
    raw = get_json(url)
    result = raw.get('result', {})
    records = result.get('records', [])
    return {
        'resource_id': resource_id,
        'total': result.get('total', 0),
        'records': records,
        'latest': records[-1] if records else None
    }


def collect_multi_domain(now_iso):
    collectors = [
        ('CISA KEV', cisa_kev, 'cisa_kev'),
        ('UKHSA', ukhsa, 'ukhsa'),
        ('FSA Food Alerts', fsa_food_alerts, 'fsa_food_alerts'),
        ('USGS Earthquakes', usgs_earthquakes, 'usgs_earthquakes'),
        ('NOAA Space Weather', noaa_space_weather, 'noaa_space_weather'),
        ('NESO', neso, 'neso')
    ]
    data = {}
    statuses = {}
    for name, fn, key in collectors:
        try:
            data[key] = fn()
            statuses[name] = {'ok': True, 'stale': False, 'last_success_at': now_iso}
        except Exception as exc:
            data[key] = {'error': str(exc)}
            statuses[name] = {'ok': False, 'stale': False, 'error': str(exc), 'last_success_at': None}
    return data, statuses


def read_json(path, default):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default


def valid_snapshot(value):
    return (
        isinstance(value, dict)
        and not isinstance(value.get('met_office'), list)
        and not isinstance(value.get('wales'), list)
        and not isinstance(value.get('scotland'), list)
    )


def atomic_write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode='w',
        encoding='utf-8',
        dir=path.parent,
        prefix=f'.{path.name}.',
        suffix='.tmp',
        delete=False
    ) as temp:
        json.dump(value, temp, indent=2, ensure_ascii=False)
        temp.flush()
        temp_name = temp.name
    Path(temp_name).replace(path)


def build():
    previous = read_json(CURRENT, {})
    out = {'updated_at': datetime.now(timezone.utc).isoformat()}
    now_iso = out['updated_at']

    try:
        out['uk_weather'] = uk_weather()
    except Exception as exc:
        out['uk_weather'] = {
            'error': str(exc),
            'source': 'Met Office UK national forecast',
            'url': 'https://weather.metoffice.gov.uk/forecast/uk'
        }

    feeds = {}
    for name, fn, key in [
        ('Met Office', met, 'met_office'),
        ('Environment Agency', ea, 'england'),
        ('Natural Resources Wales', wales, 'wales'),
        ('SEPA', scotland, 'scotland')
    ]:
        try:
            out[key] = fn()
            feeds[name] = {'ok': True, 'stale': False, 'last_success_at': now_iso}
        except Exception as exc:
            old = previous.get(key)
            out[key] = old if old else {
                'warnings': 0,
                'alerts': 0,
                'severe': 0,
                'count': 0,
                'items': []
            }
            previous_feeds = previous.get('feeds') if isinstance(previous, dict) else {}
            previous_feeds = previous_feeds if isinstance(previous_feeds, dict) else {}
            prev_feed = previous_feeds.get(name, {})
            prev_feed = prev_feed if isinstance(prev_feed, dict) else {}
            last_success = prev_feed.get('last_success_at') or (
                previous.get('updated_at') if isinstance(previous, dict) else None
            )
            feeds[name] = {
                'ok': False,
                'stale': bool(old),
                'error': str(exc),
                'last_success_at': last_success
            }

    multi_domain, multi_status = collect_multi_domain(now_iso)
    out['multi_domain'] = multi_domain
    feeds.update(multi_status)
    out['feeds'] = feeds
    out['risk_signals'] = normalise_current(out)
    out['source_registry_version'] = read_json(SOURCE_REGISTRY, {}).get('version', 'unknown')

    history = read_json(HISTORY, [])
    history = [item for item in history if valid_snapshot(item)]
    if valid_snapshot(previous):
        history = ([previous] + history)[:95]

    atomic_write_json(HISTORY, history)
    atomic_write_json(CURRENT, out)
    return out


if __name__ == '__main__':
    print(json.dumps(build(), indent=2))
