import json,re,urllib.request,xml.etree.ElementTree as ET
from datetime import datetime,timezone
HEAD={'User-Agent':'UK-Resilience-Dashboard/1.0'}
def get(url):
    req=urllib.request.Request(url,headers=HEAD)
    with urllib.request.urlopen(req,timeout=30) as r:return r.read()
def ea():
    raw=json.loads(get('https://environment.data.gov.uk/flood-monitoring/id/floods'))
    counts={1:0,2:0,3:0};items=[]
    for x in raw.get('items',[]):
        s=x.get('severity');counts[s]=counts.get(s,0)+1
        if s in (1,2,3):items.append({'level':{1:'Severe',2:'Warning',3:'Alert'}[s],'title':x.get('description') or x.get('eaAreaName') or 'Current flood item'})
    return {'warnings':counts.get(2,0),'alerts':counts.get(3,0),'severe':counts.get(1,0),'items':items},True
def met():
    raw=get('https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/UK')
    root=ET.fromstring(raw);items=[]
    for item in root.findall('.//item'):
        title=item.findtext('title') or '';desc=item.findtext('description') or ''
        level='Red' if 'Red' in title else ('Amber' if 'Amber' in title else 'Yellow')
        items.append({'level':level,'title':re.sub('<.*?>','',title).strip() or re.sub('<.*?>','',desc).strip()})
    return {'count':len(items),'items':items},True
def wales():
    raw=get('https://flood-warning.naturalresources.wales/AToZ').decode('utf-8','ignore')
    text=re.sub(r'<[^>]+>',' ',raw);text=re.sub(r'\s+',' ',text)
    severe=len(re.findall(r'Severe Flood Warning\s+in force',text,re.I))
    warnings=len(re.findall(r'Flood Warning\s+in force',text,re.I))-severe
    alerts=len(re.findall(r'Flood Alert\s+in force',text,re.I))
    return {'warnings':max(0,warnings),'alerts':alerts,'severe':severe,'items':[]},True
def scotland():
    raw=get('https://beta.sepa.scot/flooding').decode('utf-8','ignore')
    text=re.sub(r'<[^>]+>',' ',raw);text=re.sub(r'\s+',' ',text)
    m=lambda p:int(re.search(p,text,re.I).group(1)) if re.search(p,text,re.I) else 0
    return {'warnings':m(r'(\d+)\s+Flood warnings'),'alerts':m(r'(\d+)\s+Flood alerts'),'severe':m(r'(\d+)\s+Severe flood warnings'),'items':[]},True
out={'updated_at':datetime.now(timezone.utc).isoformat()};feeds={}
for name,fn,key in [('Met Office',met,'met_office'),('Environment Agency',ea,'england'),('Natural Resources Wales',wales,'wales'),('SEPA',scotland,'scotland')]:
    try:out[key],feeds[name]=fn(),{'ok':True}
    except Exception as e:out[key]={'warnings':0,'alerts':0,'severe':0,'count':0,'items':[]};feeds[name]={'ok':False,'error':str(e)}
out['feeds']=feeds
with open('data/current.json','w',encoding='utf-8') as f:json.dump(out,f,indent=2,ensure_ascii=False)
print(json.dumps(out,indent=2))