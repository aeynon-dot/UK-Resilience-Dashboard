import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CURRENT = ROOT / "data/current.json"
REGISTRY = ROOT / "data/source-registry.json"

THEMES = {"terrorism","cyber","state_threats","geographic_and_diplomatic","accidents_and_system_failures","natural_and_environmental_hazards","human_animal_and_plant_health","societal","conflict_and_instability"}
DOMAINS = {"climate_and_weather","flooding","energy","infrastructure","transport","communications","cyber","health","supply_chain","geopolitical","security","societal","industrial_and_technological","space_weather","other"}
SCOPES = {"UK","England","Wales","Scotland","Northern Ireland","local","international"}
SEVERITIES = {"low","moderate","high","severe","unknown"}
STATUSES = {"active","monitoring","resolved","expired","unknown"}
CONFIDENCE = {"high","medium","low","unknown"}
CHANGE_TYPES = {"new","changed","unchanged","resolved","unknown"}

def dt(value):
    if not isinstance(value, str): return False
    try: datetime.fromisoformat(value.replace("Z","+00:00")); return True
    except ValueError: return False

def uri(value):
    try:
        p=urlparse(value); return p.scheme in {"http","https"} and bool(p.netloc)
    except Exception: return False

def validate_signal(x, i):
    e=[]
    required=["id","schema_version","risk_theme","risk_domain","hazard","source","source_url","status","severity","geography","collected_at","confidence","description"]
    e += [f"signal[{i}]: missing {k}" for k in required if k not in x]
    if x.get("schema_version")!="1.0": e.append(f"signal[{i}]: invalid schema_version")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:-]{2,199}",x.get("id","")): e.append(f"signal[{i}]: invalid id")
    if x.get("risk_theme") not in THEMES: e.append(f"signal[{i}]: invalid risk_theme")
    if x.get("risk_domain") not in DOMAINS: e.append(f"signal[{i}]: invalid risk_domain")
    if not isinstance(x.get("hazard"),str) or not 2<=len(x.get("hazard",""))<=160: e.append(f"signal[{i}]: invalid hazard")
    if not isinstance(x.get("source"),str) or not 2<=len(x.get("source",""))<=160: e.append(f"signal[{i}]: invalid source")
    if not uri(x.get("source_url")): e.append(f"signal[{i}]: invalid source_url")
    if x.get("status") not in STATUSES: e.append(f"signal[{i}]: invalid status")
    if x.get("severity") not in SEVERITIES: e.append(f"signal[{i}]: invalid severity")
    if not isinstance(x.get("geography"),dict) or x.get("geography",{}).get("scope") not in SCOPES: e.append(f"signal[{i}]: invalid geography")
    if not dt(x.get("collected_at")): e.append(f"signal[{i}]: invalid collected_at")
    if x.get("observed_at") is not None and not dt(x.get("observed_at")): e.append(f"signal[{i}]: invalid observed_at")
    if x.get("published_at") is not None and not dt(x.get("published_at")): e.append(f"signal[{i}]: invalid published_at")
    if x.get("confidence") not in CONFIDENCE: e.append(f"signal[{i}]: invalid confidence")
    if not isinstance(x.get("description"),str) or not 1<=len(x.get("description",""))<=5000: e.append(f"signal[{i}]: invalid description")
    if x.get("change_type") is not None and x.get("change_type") not in CHANGE_TYPES: e.append(f"signal[{i}]: invalid change_type")
    return e

def main():
    current=json.loads(CURRENT.read_text(encoding="utf-8"))
    registry=json.loads(REGISTRY.read_text(encoding="utf-8"))
    errors=[]
    signals=current.get("risk_signals")
    if not isinstance(signals,list): errors.append("current.json: risk_signals must be an array")
    else:
        for i,x in enumerate(signals):
            errors.extend(validate_signal(x,i) if isinstance(x,dict) else [f"signal[{i}]: must be an object"])
    if not isinstance(registry.get("version"),str): errors.append("source-registry.json: version must be a string")
    if not isinstance(registry.get("sources"),list) or not registry["sources"]: errors.append("source-registry.json: sources must be non-empty")
    if errors:
        print("\n".join("ERROR: "+x for x in errors)); return 1
    print(f"Validated {len(signals)} risk signals and {len(registry['sources'])} source-registry entries."); return 0

if __name__=="__main__": sys.exit(main())
