import json
import re
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

from risk_model import normalise_current

HEAD = {'User-Agent': 'UK-Resilience-Dashboard/2.4'}
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


def ea():
    raw = json.loads(get('https://environment.data.gov.uk/flood-monitoring/id/floods'))
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

    out['feeds'] = feeds
    out['risk_signals'] = normalise_current(out)

    history = read_json(HISTORY, [])
    history = [item for item in history if valid_snapshot(item)]
    if valid_snapshot(previous):
        history = ([previous] + history)[:95]

    atomic_write_json(HISTORY, history)
    atomic_write_json(CURRENT, out)
    return out


if __name__ == '__main__':
    print(json.dumps(build(), indent=2))
