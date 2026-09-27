const RISK_DOMAIN_LABELS={
  climate_and_weather:'Climate & weather',
  flooding:'Flooding',
  energy:'Energy',
  infrastructure:'Infrastructure',
  transport:'Transport',
  communications:'Communications',
  cyber:'Cyber',
  health:'Health',
  supply_chain:'Supply chain',
  geopolitical:'Geopolitical',
  security:'Security',
  societal:'Societal',
  industrial_and_technological:'Industrial & technology',
  space_weather:'Space weather',
  other:'Other'
};
const RISK_DOMAIN_ORDER=Object.keys(RISK_DOMAIN_LABELS);
const RISK_THEME_LABELS={
  terrorism:'Terrorism',
  cyber:'Cyber',
  state_threats:'State threats',
  geographic_and_diplomatic:'Geographic & diplomatic',
  accidents_and_system_failures:'Accidents & system failures',
  natural_and_environmental_hazards:'Natural & environmental hazards',
  human_animal_and_plant_health:'Human, animal & plant health',
  societal:'Societal',
  conflict_and_instability:'Conflict & instability'
};
const RISK_THEME_ORDER=Object.keys(RISK_THEME_LABELS);
const RISK_THEME_DOMAINS={
  terrorism:['security','societal'],
  cyber:['cyber','communications','infrastructure'],
  state_threats:['geopolitical','cyber','security','communications'],
  geographic_and_diplomatic:['geopolitical','supply_chain','transport'],
  accidents_and_system_failures:['infrastructure','energy','transport','communications','industrial_and_technological'],
  natural_and_environmental_hazards:['climate_and_weather','flooding','infrastructure','space_weather'],
  human_animal_and_plant_health:['health','societal','supply_chain'],
  societal:['societal','health','infrastructure','transport'],
  conflict_and_instability:['geopolitical','security','supply_chain','transport','energy']
};
const RISK_THEME_KEY='ukResilienceRiskTheme';
let selectedRiskTheme='all';
const SEVERITY_RANK={severe:5,high:4,moderate:3,low:2,unknown:1};
const RISK_BAND_LABEL={immediate:'Immediate',high:'High',moderate:'Moderate',monitor:'Monitor'};

function riskDomainLabel(key){
  return RISK_DOMAIN_LABELS[key]||String(key||'Other').replaceAll('_',' ');
}
function riskSeverityLabel(value){
  return value==='unknown'?'Unknown':String(value||'unknown').replace(/\b\w/g,m=>m.toUpperCase());
}
function riskSignalMatchesFocus(x,focus){
  return focus==='UK'||x.geography?.scope===focus||x.geography?.scope==='UK';
}
function riskThemeLabel(key){return RISK_THEME_LABELS[key]||String(key||'Other').replaceAll('_',' ')}
function signalMatchesTheme(x,theme){
  if(theme==='all')return true;
  if(x.risk_theme===theme)return true;
  return (RISK_THEME_DOMAINS[theme]||[]).includes(x.risk_domain);
}
function getRiskTheme(){
  try{
    const x=localStorage.getItem(RISK_THEME_KEY);
    return x==='all'||RISK_THEME_ORDER.includes(x)?x:'all';
  }catch(e){return 'all'}
}
function setRiskTheme(theme){
  selectedRiskTheme=RISK_THEME_ORDER.includes(theme)||theme==='all'?theme:'all';
  try{localStorage.setItem(RISK_THEME_KEY,selectedRiskTheme)}catch(e){}
}
function riskThemeDescription(theme){
  if(theme==='all')return 'Current external risk signals across the monitored domains.';
  const domains=RISK_THEME_DOMAINS[theme]||[];
  return domains.length?'Current external signals linked to this risk theme, refined by operational domain and geography.':'Current external signals for this risk theme.';
}
function renderRiskWorkspace(d){
  const themeEl=document.getElementById('risk-theme-filter'),summary=document.getElementById('risk-overview-summary'),title=document.getElementById('risk-workspace-title'),description=document.getElementById('risk-workspace-description');
  if(!themeEl||!summary||!title||!description)return;
  const selected=themeEl.value||'all',signals=d.risk_signals||[],visible=signals.filter(x=>signalMatchesTheme(x,selected));
  const active=visible.filter(x=>['active','monitoring'].includes(x.status||'active')).length;
  const high=visible.filter(x=>['immediate','high'].includes(x.priority_band)).length;
  const severe=visible.filter(x=>x.severity==='severe').length;
  title.textContent=selected==='all'?'Current risk picture':riskThemeLabel(selected);
  description.textContent=riskThemeDescription(selected);
  summary.textContent=visible.length+' signals · '+active+' active/monitoring · '+high+' high/immediate · '+severe+' severe';
}

function renderRiskAssessment(d){
  const listEl=document.getElementById('risk-signal-list'),summaryEl=document.getElementById('risk-assessment-summary'),themeEl=document.getElementById('risk-theme-filter'),domainEl=document.getElementById('risk-domain-filter'),geoEl=document.getElementById('risk-geography-filter'),severityEl=document.getElementById('risk-severity-filter'),statusEl=document.getElementById('risk-status-filter');
  if(!listEl||!summaryEl)return;
  const signals=d.risk_signals||[],selectedTheme=themeEl?.value||'all',selectedDomain=domainEl?.value||'all',selectedGeo=geoEl?.value||'all',selectedSeverity=severityEl?.value||'all',selectedStatus=statusEl?.value||'all';
  const useOpeningPreferences=!window.__riskSessionInteracted; const preferredThemes=window.__openingPreferredThemes||[]; const filtered=signals.filter(x=>signalMatchesTheme(x,selectedTheme)&&(!useOpeningPreferences||preferredThemes.length===0||preferredThemes.some(t=>signalMatchesTheme(x,t)))&&(selectedDomain==='all'||x.risk_domain===selectedDomain)&&(selectedGeo==='all'||x.geography?.scope===selectedGeo)&&(selectedSeverity==='all'||x.severity===selectedSeverity)&&(selectedStatus==='all'||x.status===selectedStatus)&&(!useOpeningPreferences||minimumPriorityAllows(x))).sort((a,b)=>(b.priority_score||0)-(a.priority_score||0)||(SEVERITY_RANK[b.severity]||0)-(SEVERITY_RANK[a.severity]||0));
  const high=filtered.filter(x=>['immediate','high'].includes(x.priority_band)).length,severe=filtered.filter(x=>x.severity==='severe').length;
  summaryEl.innerHTML='<strong>'+filtered.length+'</strong> signals shown · <strong>'+high+'</strong> high/immediate · <strong>'+severe+'</strong> severe';
  if(!filtered.length){listEl.innerHTML='<div class="risk-empty">No signals match the selected assessment filters.</div>';return;}
  listEl.innerHTML=filtered.slice(0,50).map(x=>{
    const band=x.priority_band||'monitor',scope=x.geography?.scope||'unknown',date=x.observed_at||x.published_at||x.collected_at,dateText=date?new Date(date).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Date unavailable',sourceLink=/^https:\/\//i.test(String(x.source_url||''))?'<a href="'+esc(x.source_url)+'" target="_blank" rel="noopener">Source ↗</a>':'';
    return '<article class="risk-signal-item"><div class="risk-signal-top"><div><span class="risk-signal-domain">'+esc(riskDomainLabel(x.risk_domain))+'</span><strong>'+esc(x.source||'Unknown source')+'</strong></div><div class="risk-signal-badges"><span class="risk-badge '+esc(x.severity||'unknown')+'">'+esc(riskSeverityLabel(x.severity))+'</span><span class="risk-badge '+esc(band)+'">'+esc(RISK_BAND_LABEL[band]||band)+'</span></div></div><div class="risk-signal-description">'+esc(x.description||x.hazard||'Risk signal')+'</div><div class="risk-signal-meta"><span>'+esc(scope)+'</span><span>'+esc(x.status||'unknown')+'</span><span>'+esc(dateText)+'</span><span>Monitoring priority '+esc(String(x.priority_score??'—'))+'</span>'+sourceLink+'</div></article>';
  }).join('')+(filtered.length>50?'<p class="muted">Showing the first 50 matching signals.</p>':'');
}

function bindRiskAssessment(d){
  ['risk-theme-filter','risk-domain-filter','risk-geography-filter','risk-severity-filter','risk-status-filter'].forEach(id=>{
    const el=document.getElementById(id);
    if(el&&!el.dataset.bound){el.dataset.bound='1';el.addEventListener('change',()=>{
      window.__riskSessionInteracted=true;
      if(id==='risk-theme-filter' && document.getElementById('risk-domain-filter'))document.getElementById('risk-domain-filter').value='all';
      renderRiskWorkspace(d);renderRiskAssessment(d);updateDomainVisibility();
    });}
  });
}

function populateRiskAssessmentFilters(d){
  const themeEl=document.getElementById('risk-theme-filter'),domainEl=document.getElementById('risk-domain-filter'),geoEl=document.getElementById('risk-geography-filter');
  if(themeEl&&!themeEl.dataset.populated){themeEl.innerHTML='<option value="all">All risks</option>'+RISK_THEME_ORDER.map(x=>'<option value="'+esc(x)+'">'+esc(riskThemeLabel(x))+'</option>').join('');themeEl.value=getRiskTheme();themeEl.dataset.populated='1';}
  if(domainEl&&!domainEl.dataset.populated){domainEl.innerHTML='<option value="all">All domains</option>'+RISK_DOMAIN_ORDER.map(x=>'<option value="'+esc(x)+'">'+esc(riskDomainLabel(x))+'</option>').join('');domainEl.dataset.populated='1';}
  if(geoEl&&!geoEl.dataset.populated){const geos=[...new Set((d.risk_signals||[]).map(x=>x.geography?.scope).filter(Boolean))].sort();geoEl.innerHTML='<option value="all">All geographies</option>'+geos.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');geoEl.dataset.populated='1';}
}
const MONITORING_PREFERENCES_KEY='ukResilienceMonitoringPreferences';
const PRIORITY_RANK={monitor:1,moderate:2,high:3,immediate:4};
const DEFAULT_MONITORING_PREFERENCES={
  geography:'UK',
  themes:['cyber','natural_and_environmental_hazards'],
  minimum_priority:'monitor'
};
let monitoringPreferences=loadMonitoringPreferences();
let monitoringPreferencesApplied=false;

function loadMonitoringPreferences(){
  try{
    const raw=localStorage.getItem(MONITORING_PREFERENCES_KEY);
    if(!raw)return {...DEFAULT_MONITORING_PREFERENCES,themes:[...DEFAULT_MONITORING_PREFERENCES.themes]};
    const x=JSON.parse(raw);
    const themes=Array.isArray(x.themes)?x.themes.filter(t=>RISK_THEME_ORDER.includes(t)):[];
    return {
      geography:['all','UK','England','Wales','Scotland','Northern Ireland'].includes(x.geography)?x.geography:'UK',
      themes:themes.length?themes:[...DEFAULT_MONITORING_PREFERENCES.themes],
      minimum_priority:PRIORITY_RANK[x.minimum_priority]?x.minimum_priority:'monitor'
    };
  }catch(e){return {...DEFAULT_MONITORING_PREFERENCES,themes:[...DEFAULT_MONITORING_PREFERENCES.themes]}}
}
function saveMonitoringPreferences(){
  const geography=document.getElementById('preference-geography')?.value||'UK';
  const themes=[...document.querySelectorAll('#preference-themes input:checked')].map(x=>x.value);
  const minimum_priority=document.getElementById('preference-priority')?.value||'monitor';
  monitoringPreferences={
    geography,
    themes:themes.length?themes:[...RISK_THEME_ORDER],
    minimum_priority
  };
  try{localStorage.setItem(MONITORING_PREFERENCES_KEY,JSON.stringify(monitoringPreferences))}catch(e){}
  monitoringPreferencesApplied=false;
  const status=document.getElementById('monitoring-preferences-status');
  if(status)status.textContent='Saved. Current investigation filters are unchanged.';
}
function renderMonitoringPreferences(){
  const geo=document.getElementById('preference-geography');
  const priority=document.getElementById('preference-priority');
  const themes=document.getElementById('preference-themes');
  if(!geo||!priority||!themes)return;
  geo.value=monitoringPreferences.geography;
  priority.value=monitoringPreferences.minimum_priority;
  themes.innerHTML=RISK_THEME_ORDER.map(t=>'<label><input type="checkbox" value="'+esc(t)+'" '+(monitoringPreferences.themes.includes(t)?'checked':'')+'> '+esc(riskThemeLabel(t))+'</label>').join('');
  const status=document.getElementById('monitoring-preferences-status');
  if(status)status.textContent='Saved locally in this browser.';
}
function applyMonitoringPreferences(){
  if(monitoringPreferencesApplied)return;
  const themeEl=document.getElementById('risk-theme-filter');
  const geoEl=document.getElementById('risk-geography-filter');
  const severityEl=document.getElementById('risk-severity-filter');
  if(!themeEl||!geoEl||!severityEl)return;
  window.__openingPreferredThemes=[...monitoringPreferences.themes];
  // A single preferred theme can map directly to the investigation selector.
  // Multiple preferred themes remain an opening preference; the session selector stays "All risks".
  if(monitoringPreferences.themes.length===1 && RISK_THEME_ORDER.includes(monitoringPreferences.themes[0])){
    themeEl.value=monitoringPreferences.themes[0];
  }else{
    themeEl.value='all';
  }
  geoEl.value=monitoringPreferences.geography;
  const minimum=monitoringPreferences.minimum_priority;
  severityEl.value='all';
  monitoringPreferencesApplied=true;
  renderRiskWorkspace(window.__riskData||{});
}
function minimumPriorityAllows(signal){
  const minimum=monitoringPreferences.minimum_priority||'monitor';
  return (PRIORITY_RANK[signal.priority_band]||1)>=(PRIORITY_RANK[minimum]||1);
}
const DEFAULT_FOCUS_KEY='ukResilienceDefaultFocus';
const focusNames=['UK','England','Wales','Scotland','Northern Ireland'];
let currentFocus=getDefaultFocus();
let ukMapMarkup=null;

async function loadMapData(){
  try{
    const r=await fetch('data/uk-map.svg',{cache:'no-store'});
    if(!r.ok)throw new Error(r.status);
    ukMapMarkup=await r.text();
  }catch(e){ukMapMarkup=null;}
}

function renderGeographicMap(d){
  const svg=document.getElementById('uk-map');
  if(!svg||!ukMapMarkup)return;
  const parsed=new DOMParser().parseFromString(ukMapMarkup,'image/svg+xml');
  const source=parsed.documentElement;
  svg.setAttribute('viewBox',source.getAttribute('viewBox')||'0 0 760 760');
  svg.innerHTML=source.innerHTML;

  const nationByName={England:'england',Wales:'wales',Scotland:'scotland','Northern Ireland':'northern-ireland'};
  const statuses={};
  Object.entries(nationByName).forEach(([name,key])=>{
    const data=key==='england'?d.england||{}:key==='wales'?d.wales||{}:key==='scotland'?d.scotland||{}:{};
    const weather=regionWeather(d,name);
    const flood=(key==='england'||key==='wales'||key==='scotland')?floodLevel(data):'No automated live feed';
    const feedIssue=(key==='england'&&!d.feeds?.['Environment Agency']?.ok)||(key==='wales'&&!d.feeds?.['Natural Resources Wales']?.ok)||(key==='scotland'&&!d.feeds?.['SEPA']?.ok);
    const overall=weather==='Red'||flood==='Red'?'Red':weather==='Amber'||flood==='Amber'?'Amber':weather==='Yellow'||flood==='Yellow'?'Yellow':feedIssue?'Check':'Clear';
    statuses[name]={weather,flood,overall};
  });

  const selected=getFocus();
  const groups=[...svg.querySelectorAll('g[data-nation]')];
  groups.forEach(group=>{
    const name=group.dataset.nation;
    if(!statuses[name])return;
    const status=statuses[name];
    group.setAttribute('class','map-region risk-'+status.overall.toLowerCase());
    group.setAttribute('tabindex','0');
    group.setAttribute('role','button');
    group.setAttribute('aria-label',name+' — '+(status.overall==='Check'?'Check data':status.overall));
    group.classList.toggle('selected',selected!=='UK'&&name===selected);

    const path=group.querySelector('path');
    if(path&&!group.querySelector('.map-label-text')){
      // Use geographic centroids for the two large, irregular countries where
      // the bounding-box centre falls noticeably away from the visual centre.
      const labelPositions={
        England:[300,572.7],
        Scotland:[200,326.1]
      };
      const box=path.getBBox();
      const pos=labelPositions[name]||[box.x+box.width/2,box.y+box.height/2];
      const text=document.createElementNS('http://www.w3.org/2000/svg','text');
      text.setAttribute('class','map-label-text');
      text.setAttribute('x',String(pos[0]));
      text.setAttribute('y',String(pos[1]));
      text.setAttribute('dominant-baseline','middle');
      text.textContent=name==='Northern Ireland'?'NI':name.toUpperCase();
      group.appendChild(text);
    }
    const choose=()=>{setFocus(name);load()};
    group.onclick=choose;
    group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}};
  });

  const nation=selected==='UK'?{overall:regionRisk(d,'UK'),weather:regionWeather(d,'UK'),flood:'See nations'}:statuses[selected]||statuses.England;
  const weatherItems=d.met_office?.items||[];
  const selectedWeather=selected==='UK'?weatherItems:weatherItems.filter(x=>regionMatch(x,selected));
  const selectedFlood=selected==='England'?(d.england?.items||[]):selected==='Wales'?(d.wales?.items||[]):selected==='Scotland'?(d.scotland?.items||[]):[];
  const feedName=selected==='England'?'Environment Agency':selected==='Wales'?'Natural Resources Wales':selected==='Scotland'?'SEPA':null;
  const feed=feedName?d.feeds?.[feedName]:null;
  const items=[...selectedWeather.map(x=>({...x,type:'Weather'})),...selectedFlood.map(x=>({...x,type:'Flood'}))];
  const itemHtml=items.length?items.slice(0,5).map(x=>'<div class="map-detail-item"><span class="map-detail-item-level '+String(x.level||'Alert').toLowerCase()+'">'+esc(x.level||'Alert')+'</span><span>'+esc(x.title||x.area||'Current item')+'</span></div>').join(''):'<div class="muted">No current warning or flood items for this area.</div>';
  const floodStatus=selected==='Northern Ireland'?'No automated live flood feed':selectedFlood.length?(nation.flood==='Amber'?'Flood warnings active':nation.flood==='Yellow'?'Flood alerts active':nation.flood==='Red'?'Severe flooding active':'Flood information active'):'No current alerts';
  const feedHtml=feed?'<small>Flood data: '+esc(feed.ok?floodStatus:feed.stale?'STALE — last successful update '+ageLabel(feed.last_success_at):'ERROR')+'</small>':'';
  const niInfo=selected==='Northern Ireland'?'<small>DfI Rivers provides flood information and water-level data separately.</small><a class="map-detail-link" href="https://www.infrastructure-ni.gov.uk/topics/rivers-and-flooding" target="_blank" rel="noopener">Open DfI Rivers flood information →</a>':'';
  const detailTitle=selected==='UK'?'UK-wide':selected;
  const detailRisk=nation.overall==='Check'?'CHECK DATA':nation.overall.toUpperCase();
    document.getElementById('map-detail').innerHTML='<div class="map-detail-heading"><strong>'+esc(detailTitle)+'</strong><span class="map-detail-risk '+nation.overall.toLowerCase()+'">'+esc(detailRisk)+'</span></div><div class="map-detail-counts">'+(selected==='UK'?'':'<span><strong>'+selectedWeather.length+'</strong> weather</span><span><strong>'+selectedFlood.length+'</strong> flood</span>')+'</div><small>Weather: '+esc(nation.weather)+' · Flood: '+esc(nation.flood)+'</small>'+feedHtml+niInfo+'<div class="map-detail-items">'+itemHtml+'</div>';
  
  const levels=['Red','Amber','Yellow'];
  const counts=Object.fromEntries(levels.map(x=>[x,weatherItems.filter(i=>i.level===x).length]));
  document.getElementById('weather-risk-summary').innerHTML='<strong>'+weatherItems.length+' active Met Office warning'+(weatherItems.length===1?'':'s')+'</strong> · '+counts.Red+' Red · '+counts.Amber+' Amber · '+counts.Yellow+' Yellow';
}
async function load(){
  try{
    const [current,history,riskSet,registry]=await Promise.all([
      fetch('data/current.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}),
      fetch('data/history.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]),
      fetch('data/go-live-risk-set.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/source-registry.json',{cache:'no-store'}).then(r=>r.json()),
      loadMapData()
    ]);
    window.__riskData=current;render(current,Array.isArray(history)?history:[],riskSet,registry);
  }catch(e){
    document.getElementById('headline').textContent='Data not available yet';
    document.getElementById('status').textContent='OFFLINE';
    document.getElementById('status').classList.add('attention');
  }
}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const totalFor=d=>{
  const m=d.met_office||{},e=d.england||{},w=d.wales||{},s=d.scotland||{};
  return (m.count||0)+(e.warnings||0)+(e.alerts||0)+(e.severe||0)+(w.warnings||0)+(w.alerts||0)+(w.severe||0)+(s.warnings||0)+(s.alerts||0)+(s.severe||0);
};
const keyFor=x=>String(x.level||'')+'|'+String(x.title||x.area||'');
const identityFor=x=>String(x.source||'')+'|'+String(x.title||x.area||'');
const levelRank={Clear:0,Yellow:1,Amber:2,Red:3};
const warningRank=x=>levelRank[x]??0;
function ageLabel(iso){
  if(!iso)return 'age unknown';
  const ms=Math.max(0,Date.now()-new Date(iso).getTime());
  const mins=Math.floor(ms/60000);
  if(mins<60)return mins+' min'+(mins===1?'':'s')+' old';
  const hours=Math.floor(mins/60);
  const rem=mins%60;
  if(hours<24)return hours+'h'+(rem?' '+rem+'m':'')+' old';
  const days=Math.floor(hours/24);
  return days+' day'+(days===1?'':'s')+' old';
}
const floodLevel=d=>{
  if((d.severe||0)>0)return 'Red';
  if((d.warnings||0)>0)return 'Amber';
  if((d.alerts||0)>0)return 'Yellow';
  return 'Clear';
};
const regionMatch=(item,nation)=>{
  const rs=item.regions||[];
  if(rs.includes('UK')) return true;
  if(rs.includes(nation)) return true;
  const text=String(item.title||'').toLowerCase();
  return nation==='Northern Ireland' && text.includes('northern ireland');
};
function regionWeather(d,nation){
  return (d.met_office?.items||[]).filter(x=>regionMatch(x,nation))
    .reduce((best,x)=>warningRank(x.level)>warningRank(best)?x.level:best,'Clear');
}
function regionRisk(d,nation){
  if(nation==='UK'){
    const levels=(d.met_office?.items||[]).map(x=>x.level);
    ['england','wales','scotland'].forEach(k=>levels.push(floodLevel(d[k]||{})));
    return levels.reduce((best,x)=>warningRank(x)>warningRank(best)?x:best,'Clear');
  }
  const key=nation.toLowerCase().replace(' ','_');
  const floodKey=nation==='Northern Ireland'?null:key;
  const weather=regionWeather(d,nation);
  const flood=floodKey?floodLevel(d[floodKey]||{}):'Clear';
  return warningRank(weather)>=warningRank(flood)?weather:flood;
}
function updateDomainVisibility(){
  const theme=document.getElementById('risk-theme-filter')?.value||'all';
  const domain=document.getElementById('risk-domain-filter')?.value||'all';
  const geography=document.getElementById('risk-geography-filter')?.value||'all';
  const showWeather=theme==='natural_and_environmental_hazards'||domain==='climate_and_weather'||domain==='flooding';
  const showWeatherSupporting=showWeather;
  const showDataConfidence=showWeather&&geography==='UK';
  ['weather-risk-content','weather-supporting-content'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.classList.toggle('is-visible',showWeatherSupporting);
  });
  const confidence=document.getElementById('data-confidence-card');
  if(confidence)confidence.classList.toggle('is-visible',showDataConfidence);
}
function renderRiskMap(d){renderGeographicMap(d);}

function getDefaultFocus(){
  try{
    const x=localStorage.getItem(DEFAULT_FOCUS_KEY);
    return focusNames.includes(x)?x:'UK';
  }catch(e){return 'UK'}
}
function getFocus(){
  return focusNames.includes(currentFocus)?currentFocus:getDefaultFocus();
}
function setFocus(v){
  if(focusNames.includes(v))currentFocus=v;
}
function setDefaultFocus(v){
  if(!focusNames.includes(v))return;
  try{localStorage.setItem(DEFAULT_FOCUS_KEY,v)}catch(e){}
  currentFocus=v;
}
function renderPreferences(){
  const el=document.getElementById('default-focus');
  if(el)el.value=getDefaultFocus();
}

function coverageSourceMatches(signalSource,entry){
  const source=String(signalSource||'').toLowerCase();
  const candidates=[entry.name,entry.publisher,entry.id]
    .filter(Boolean)
    .map(x=>String(x).toLowerCase().replaceAll('_',' '));
  return candidates.some(x=>source.includes(x)||x.includes(source));
}
function renderCoverage(d,riskSet,registry){
  const listEl=document.getElementById('coverage-list'),summaryEl=document.getElementById('coverage-summary'),noteEl=document.getElementById('coverage-note');
  if(!listEl||!summaryEl||!riskSet)return;
  const registrySources=registry?.sources||[];
  const feedEntries=Object.entries(d.feeds||{});
  const signals=d.risk_signals||[];
  const domains=riskSet.go_live_domains||[];
  const rows=domains.map(domain=>{
    const sources=(domain.sources||[]).map(id=>registrySources.find(x=>x.id===id)).filter(Boolean);
    const automated=sources.filter(x=>x.endpoint);
    const reference=sources.filter(x=>!x.endpoint);
    const states=automated.map(source=>{
      const feed=feedEntries.find(([name])=>{
        const n=String(name).toLowerCase(), a=String(source.name||'').toLowerCase(), p=String(source.publisher||'').toLowerCase();
        return n===a||n===p||n.includes(p)||a.includes(n);
      })?.[1];
      return {source,feed};
    });
    const unavailable=states.filter(x=>!x.feed||!x.feed.ok);
    const currentSignals=signals.filter(x=>states.some(y=>coverageSourceMatches(x.source,y.source))).length;
    let stateClass='partial',stateLabel='Partial coverage',detail='';
    if(domain.status==='gap'){
      stateClass='gap';stateLabel='No automated coverage';detail='No automated source currently claimed.';
    }else if(automated.length===0){
      stateClass='reference';stateLabel='Reference only';detail='Authoritative source identified, but no automated live feed.';
    }else if(unavailable.length){
      stateClass='unavailable';stateLabel='Data unavailable';detail=unavailable.length===automated.length?'All automated feeds currently unavailable.':unavailable.length+' automated feed'+(unavailable.length===1?'':'s')+' unavailable.';
    }else if(currentSignals===0){
      stateClass='covered';stateLabel='No current signal';detail='Automated sources available; no current signal represented.';
    }else if(domain.status==='covered'){
      stateClass='covered';stateLabel='Covered';detail=currentSignals+' current signal'+(currentSignals===1?'':'s')+' represented.';
    }else{
      stateClass='partial';stateLabel='Partial coverage';detail=currentSignals+' current signal'+(currentSignals===1?'':'s')+'; scope remains incomplete.';
    }
    return {domain,stateClass,stateLabel,detail};
  });
  const covered=rows.filter(x=>x.stateClass==='covered').length;
  const partial=rows.filter(x=>x.stateClass==='partial').length;
  const unavailable=rows.filter(x=>x.stateClass==='unavailable').length;
  const gaps=(riskSet.go_live_theme_coverage||[]).filter(x=>x.status==='gap').length;
  summaryEl.innerHTML='<span class="coverage-stat">'+covered+' covered</span><span class="coverage-stat">'+partial+' partial</span><span class="coverage-stat">'+unavailable+' unavailable</span>';
  listEl.innerHTML=rows.map(x=>'<div class="coverage-row"><div><strong>'+esc(x.domain.label)+'</strong><span>'+esc(x.detail)+'</span></div><span class="coverage-badge '+x.stateClass+'">'+esc(x.stateLabel)+'</span></div>').join('');
  noteEl.textContent=gaps+' of '+(riskSet.go_live_theme_coverage||[]).length+' high-level risk themes currently have no automated coverage. Coverage describes monitoring availability, not comprehensive UK risk coverage.';
}

function renderDataConfidence(d){
  const el=document.getElementById('data-confidence');
  if(!el)return;
  const focus=getFocus();
  const names=focus==='England'?['Met Office','Environment Agency']:focus==='Wales'?['Met Office','Natural Resources Wales']:focus==='Scotland'?['Met Office','SEPA']:focus==='Northern Ireland'?['Met Office']:['Met Office','Environment Agency','Natural Resources Wales','SEPA'];
  const feeds=d.feeds||{};
  const states=names.map(name=>{
    const v=feeds[name];
    if(!v)return {name,state:'PARTIAL',detail:'No automated live feed'};
    if(v.ok)return {name,state:'LIVE',detail:v.last_success_at?'Updated '+ageLabel(v.last_success_at):'Latest collection successful'};
    if(v.stale)return {name,state:'STALE',detail:v.last_success_at?'Last successful update '+ageLabel(v.last_success_at):'Previous data retained'};
    return {name,state:'ERROR',detail:'Feed needs checking'};
  });
  const hasError=states.some(x=>x.state==='ERROR');
  const hasStale=states.some(x=>x.state==='STALE');
  const hasPartial=states.some(x=>x.state==='PARTIAL');
  const overall=hasError?'LIMITED':hasStale||hasPartial?'MIXED':'LIVE';
  const overallText=overall==='LIVE'?'All connected feeds live':overall==='MIXED'?'Some data has a limitation':'One or more required feeds needs checking';
  el.innerHTML='<div class="confidence-summary"><div><strong>Data status</strong><span class="confidence-state '+overall.toLowerCase()+'">'+overall+'</span><small>'+esc(focus==='UK'?'UK-wide':focus)+' · '+esc(overallText)+'</small></div><div class="confidence-feeds">'+states.map(x=>'<div class="confidence-feed"><div><strong>'+esc(x.name)+'</strong><span class="confidence-detail">'+esc(x.detail)+'</span></div><span class="confidence-state '+x.state.toLowerCase()+'">'+esc(x.state)+'</span></div>').join('')+'</div><p class="muted confidence-note">This indicates feed connection and recency only; it does not assess the accuracy or completeness of the underlying information.</p></div>';
}
function renderFocus(d){
  const focus=getFocus();
  const risk=regionRisk(d,focus);
  const weather=focus==='UK'?(d.met_office?.items||[]).length:regionWeather(d,focus);
  const feedIssue=focus==='England'&&!d.feeds?.['Environment Agency']?.ok ||
    focus==='Wales'&&!d.feeds?.['Natural Resources Wales']?.ok ||
    focus==='Scotland'&&!d.feeds?.['SEPA']?.ok;
  let detail=focus==='UK'?weather+' active Met Office warning'+(weather===1?'':'s'):risk==='Clear'?'No current warning or flood item in connected feeds':risk+' risk item currently detected';
  if(feedIssue){const f=focus==='England'?d.feeds?.['Environment Agency']:focus==='Wales'?d.feeds?.['Natural Resources Wales']:focus==='Scotland'?d.feeds?.['SEPA']:null;detail+=' · '+(f?.stale?'STALE — last successful update '+ageLabel(f.last_success_at):'one feed needs checking');}
  document.getElementById('focus-result').innerHTML='<strong>'+esc(focus==='UK'?'UK-wide':focus)+'</strong><span class="focus-risk '+risk.toLowerCase()+'">'+esc(risk.toUpperCase())+'</span><small>'+esc(detail)+'</small>';
  document.getElementById('focus-area').value=focus;
}

function focusMatchesItem(x,focus){
  if(focus==='UK')return true;
  if(x.source==='England'||x.source==='Wales'||x.source==='Scotland')return x.source===focus;
  if(x.source==='Met Office')return regionMatch(x,focus);
  return false;
}
function focusedItems(d,focus){
  const weather=(d.met_office?.items||[]).map(x=>({...x,source:'Met Office'}));
  const flood=focus==='England'?(d.england?.items||[]).map(x=>({...x,source:'England'})):focus==='Wales'?(d.wales?.items||[]).map(x=>({...x,source:'Wales'})):focus==='Scotland'?(d.scotland?.items||[]).map(x=>({...x,source:'Scotland'})):[];
  return [...weather.filter(x=>focusMatchesItem(x,focus)),...flood];
}
function focusedTotal(d,focus){return focusedItems(d,focus).length;}
function renderWeatherToday(d){
  const el=document.getElementById('weather-today');
  const focus=getFocus();
  const uw=d.uk_weather||{};
  if(uw.error){el.innerHTML='<div class="weather-placeholder"><strong>'+esc(focus==='UK'?'UK-wide forecast unavailable':focus+' weather forecast context unavailable')+'</strong><span>See the Met Office national forecast directly.</span></div>';return;}
  const summary=String(uw.summary||'').trim();
  if(!summary){el.innerHTML='<div class="weather-placeholder"><strong>'+esc(focus==='UK'?'UK-wide forecast':focus+' weather context')+'</strong><span>National forecast available.</span></div>';return;}
  const sentences=summary.split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean);
  const headline=(sentences[0]||summary).replace(/[.!?]$/,'');
  const bullets=sentences.slice(1,4);
  const focusWeather=focusedItems(d,focus).filter(x=>x.source==='Met Office');
  const concern=focusWeather[0]?.level&&focusWeather[0]?.level!=='Clear' ? focusWeather[0].level+' warning' : summary.match(/\\b(heavy rain|strong winds|coastal gales|heavy downpours|blustery winds|snow|ice|fog|heat)\\b/ig)?.[0]||'Weather conditions';
  const context=focus==='UK'?'UK-wide forecast':focus+' focus — UK-wide forecast with '+focus.toLowerCase()+' warning context';
  el.innerHTML='<div class="weather-today-content"><strong class="weather-headline">'+esc(headline)+'</strong><div class="weather-concern"><span>'+esc(context)+'</span><strong>'+esc(concern)+'</strong></div>'+(bullets.length?'<ul class="weather-bullets">'+bullets.map(x=>'<li>'+esc(x.replace(/[.!?]$/,''))+'</li>').join('')+'</ul>':'')+'</div>';
}
function renderTimeline(history,current){
  const focus=getFocus();
  const snapshots=[...(Array.isArray(history)?history:[])].filter(h=>h&&typeof h==='object'&&!Array.isArray(h)).slice(0,23).reverse();
  snapshots.push(current);
  if(snapshots.length<2){document.getElementById('warning-timeline').innerHTML='<div class="muted">Building warning history…</div>';return;}
  const events=[];
  for(let i=1;i<snapshots.length;i++){
    const previous=snapshots[i-1],now=snapshots[i];
    const prevItems=[...(previous.met_office?.items||[]).map(x=>({...x,source:'Met Office'})),...(previous.england?.items||[]).map(x=>({...x,source:'England'})),...(previous.wales?.items||[]).map(x=>({...x,source:'Wales'})),...(previous.scotland?.items||[]).map(x=>({...x,source:'Scotland'}))];
    const nowItems=[...(now.met_office?.items||[]).map(x=>({...x,source:'Met Office'})),...(now.england?.items||[]).map(x=>({...x,source:'England'})),...(now.wales?.items||[]).map(x=>({...x,source:'Wales'})),...(now.scotland?.items||[]).map(x=>({...x,source:'Scotland'}))];
    const prevMap=new Map(prevItems.map(x=>[identityFor(x),x]));
    const nowMap=new Map(nowItems.map(x=>[identityFor(x),x]));
    nowItems.forEach(x=>{const old=prevMap.get(identityFor(x));if(!old)events.push({time:now.updated_at,kind:'NEW',className:'new',source:x.source,regions:x.regions||[],title:x.title||x.area||'Current item',detail:'First detected in this collection'});else if(old.level!==x.level){const up=warningRank(x.level)>warningRank(old.level);events.push({time:now.updated_at,kind:up?'ESCALATED':'REDUCED',className:up?'escalated':'reduced',source:x.source,regions:x.regions||[],title:x.title||x.area||'Current item',detail:(old.level||'Unknown')+' → '+(x.level||'Alert')});}});
    prevItems.forEach(x=>{if(!nowMap.has(identityFor(x)))events.push({time:now.updated_at,kind:'RESOLVED',className:'resolved',source:x.source,regions:x.regions||[],title:x.title||x.area||'Current item',detail:'No longer present in the latest collection'});});
  }
  events.sort((a,b)=>new Date(b.time)-new Date(a.time));
  const focusedEvents=focus==='UK'?events:events.filter(x=>x.source===focus||(x.source==='Met Office'&&((x.regions||[]).includes(focus)||String(x.title).toLowerCase().includes(focus.toLowerCase()))));
  const shown=focusedEvents.slice(0,12);
  if(!shown.length){document.getElementById('warning-timeline').innerHTML='<div class="timeline-clear"><strong>No warning changes detected</strong><span>Recent collections have not recorded a new, escalated, reduced or resolved warning.</span></div>';return;}
  document.getElementById('warning-timeline').innerHTML=shown.map(x=>'<div class="timeline-item '+x.className+'"><div class="timeline-marker"></div><div class="timeline-body"><div class="timeline-top"><span class="timeline-tag '+x.className+'">'+esc(x.kind)+'</span><strong>'+esc(x.source)+'</strong><time datetime="'+esc(x.time||'')+'">'+esc(new Date(x.time).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))+'</time></div><div class="timeline-title">'+esc(x.title)+'</div><div class="timeline-detail">'+esc(x.detail)+'</div></div></div>').join('');
}
function renderTrend(history,current){
  const valid=[...history].filter(h=>h&&typeof h==='object'&&!Array.isArray(h)).slice(0,24).reverse();
  valid.push(current);
  const values=valid.map(totalFor);
  if(values.length<2){document.getElementById('trend').innerHTML='<div class="muted">Building history…</div>';return}
  const max=Math.max(1,...values);
  document.getElementById('trend').innerHTML=values.map((v,i)=>{
    const h=Math.max(8,Math.round((v/max)*100));
    return '<div class="bar-wrap" title="'+v+' active item'+(v===1?'':'s')+'"><div class="bar" style="height:'+h+'%"></div></div>';
  }).join('');
  const first=values[0],last=values[values.length-1];
  const direction=last>first?'increased':last<first?'decreased':'unchanged';
  document.getElementById('trend-note').textContent='Last '+values.length+' collected snapshots: active items '+direction+' from '+first+' to '+last+'.';
}
function renderAttention(d,history,newItems,changedItems){
  const focus=getFocus();
  const total=focusedTotal(d,focus);
  const cards=[];
  const feeds=Object.entries(d.feeds||{});
  const relevantFeeds=focus==='England'?['Environment Agency']:focus==='Wales'?['Natural Resources Wales']:focus==='Scotland'?['SEPA']:focus==='Northern Ireland'?[]:null;
  feeds.filter(([name,v])=>{
    if(v.ok || (relevantFeeds&&!relevantFeeds.includes(name)))return false;
    if(v.stale&&v.last_success_at){
      const ageMinutes=Math.max(0,(Date.now()-new Date(v.last_success_at).getTime())/60000);
      return ageMinutes>=30;
    }
    return true;
  }).forEach(([name,v])=>{
    cards.push({
      priority:100,
      html:'<div class="attention-item attention-data"><div class="attention-top"><span class="attention-tag check">DATA</span><strong>'+esc(name)+'</strong></div><div class="attention-text">'+esc(v.stale?'Feed is stale — last successful update '+ageLabel(v.last_success_at)+'.':'Feed reported an error and needs checking.')+'</div></div>'
    });
  });
  const severity={Red:90,Amber:70,Yellow:50};
  const signals=(d.risk_signals||[]).filter(x=>['immediate','high'].includes(x.priority_band)).filter(x=>focus==='UK'||x.geography?.scope===focus||x.geography?.scope==='UK').sort((a,b)=>(b.priority_score||0)-(a.priority_score||0));
  signals.slice(0,2).forEach(x=>{cards.push({priority:Math.min(99,Number(x.priority_score||0)+5),html:'<div class="attention-item attention-signal"><div class="attention-top"><span class="attention-tag check">RISK</span><strong class="attention-source">'+esc(x.source)+'</strong></div><div class="attention-text">'+esc(x.description)+'</div><div class="attention-meta">'+esc(String(x.risk_domain||'').replaceAll('_',' '))+' · priority '+esc(x.priority_band||'monitor')+'</div></div>'});});
  const currentItems=[
    ...(d.met_office?.items||[]).map(x=>({...x,source:'Met Office'})),
    ...(d.england?.items||[]).map(x=>({...x,source:'England'})),
    ...(d.wales?.items||[]).map(x=>({...x,source:'Wales'})),
    ...(d.scotland?.items||[]).map(x=>({...x,source:'Scotland'}))
  ];
  currentItems.filter(x=>focusMatchesItem(x,focus)).forEach(x=>{
    const isNew=newItems.some(n=>identityFor(n)===identityFor(x));
    const changed=changedItems.some(n=>identityFor(n)===identityFor(x));
    const level=x.level||'Alert';
    const base=severity[level]??40;
    const priority=base+(isNew?25:changed?15:0);
    const tag=isNew?'NEW':changed?'CHANGED':level.toUpperCase();
    const tagClass=isNew?'new':changed?'changed':String(level).toLowerCase();
    cards.push({
      priority,
      html:'<div class="attention-item attention-'+tagClass+'"><div class="attention-top"><span class="attention-tag '+tagClass+'">'+esc(tag)+'</span><strong class="attention-source">'+esc(x.source)+'</strong></div><div class="attention-text">'+esc(x.title||x.area||'Current warning or alert')+'</div>'+(isNew?'<div class="attention-meta">Detected since the previous collection</div>':changed?'<div class="attention-meta">Severity changed since the previous collection</div>':'<div class="attention-meta">Currently active</div>')+'</div>'
    });
  });
  cards.sort((a,b)=>b.priority-a.priority);
  const top=cards.slice(0,4);
  let html='';
  if(top.length){
    html=top.map(x=>x.html).join('');
    if(cards.length>4) html+='<div class="attention-more">+'+(cards.length-4)+' additional active item'+(cards.length-4===1?'':'s')+' shown in the detailed sections below.</div>';
  }else{
    html='<div class="attention-clear"><strong>'+(total?'No new change requires highlighting':'Nothing currently requires attention')+'</strong><span>'+(total?'Active warnings and flood items are shown in the sections below.':'No current warning, flood alert, or connected feed issue was detected.')+'</span></div>';
  }
  const el=document.getElementById('attention-list');
  if(el)el.innerHTML=html;
}
function applyFocusToDashboard(focus){
  document.querySelectorAll('[data-flood-nation]').forEach(card=>{
    const nation=card.dataset.floodNation;
    const visible=focus==='UK'||nation==='weather'||nation===focus;
    card.style.display=visible?'':'none';
  });
  const weatherHeading=document.getElementById('weather-heading');
  if(weatherHeading)weatherHeading.textContent=focus==='UK'?'Met Office warnings':focus+' weather warnings';
}
function render(d,history,riskSet,registry){
  document.getElementById('updated').textContent='Data updated '+new Date(d.updated_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
  const weather=d.met_office||{}, ew=d.england||{}, wa=d.wales||{}, sc=d.scotland||{};
  const focus=getFocus();
  const focusItems=focusedItems(d,focus);
  applyFocusToDashboard(focus);
  document.getElementById('weather-count').textContent=(focus==='UK'?weather.items||[]:focusItems.filter(x=>x.source==='Met Office')).length;
  document.getElementById('england-count').textContent=focus==='England'||focus==='UK'?(ew.warnings||0)+(ew.alerts||0)+(ew.severe||0):0;
  document.getElementById('wales-count').textContent=focus==='Wales'||focus==='UK'?(wa.warnings||0)+(wa.alerts||0)+(wa.severe||0):0;
  document.getElementById('scotland-count').textContent=focus==='Scotland'||focus==='UK'?(sc.warnings||0)+(sc.alerts||0)+(sc.severe||0):0;
  const feedValues=Object.entries(d.feeds||{}).filter(([name])=>focus==='UK'||(focus==='England'&&name==='Environment Agency')||(focus==='Wales'&&name==='Natural Resources Wales')||(focus==='Scotland'&&name==='SEPA')).map(([,v])=>v),hasFeedIssue=feedValues.some(v=>!v.ok),total=focusedTotal(d,focus);
  const previous=history.find(h=>h&&typeof h==='object'&&!Array.isArray(h));
  const currentItems=[
    ...(weather.items||[]).map(x=>({...x,source:'Met Office'})),
    ...(ew.items||[]).map(x=>({...x,source:'England'})),
    ...(wa.items||[]).map(x=>({...x,source:'Wales'})),
    ...(sc.items||[]).map(x=>({...x,source:'Scotland'}))
  ];
  const previousItems=[
    ...(previous?.met_office?.items||[]).map(x=>({...x,source:'Met Office'})),
    ...(previous?.england?.items||[]).map(x=>({...x,source:'England'})),
    ...(previous?.wales?.items||[]).map(x=>({...x,source:'Wales'})),
    ...(previous?.scotland?.items||[]).map(x=>({...x,source:'Scotland'}))
  ];
  const previousByIdentity=new Map(previousItems.map(x=>[identityFor(x),x]));
  const currentByIdentity=new Map(currentItems.map(x=>[identityFor(x),x]));
  const newItems=currentItems.filter(x=>focusMatchesItem(x,focus)&&!previousByIdentity.has(identityFor(x)));
  const changedItems=currentItems.filter(x=>{
    if(!focusMatchesItem(x,focus))return false;
    const old=previousByIdentity.get(identityFor(x));
    return !!old && old.level!==x.level;
  });
  const resolvedItems=previousItems.filter(x=>focusMatchesItem(x,focus)&&!currentByIdentity.has(identityFor(x)));
  const removedCount=resolvedItems.length;
  const status=document.getElementById('status');status.className='status';
  if(hasFeedIssue){status.textContent='CHECK DATA';status.classList.add('attention');document.getElementById('headline').textContent=total?total+' active warning/alert items for '+(focus==='UK'?'the UK':focus)+' — data feed issue':'No active items reported for '+(focus==='UK'?'the UK':focus)+', but a data feed needs checking'}
  else{status.textContent=total?'ATTENTION':'ALL CLEAR';if(total)status.classList.add('attention');document.getElementById('headline').textContent=total?total+' active warning/alert items for '+(focus==='UK'?'the UK':focus):'No active warning/alert items for '+(focus==='UK'?'the UK':focus)}
  const change=[];if(newItems.length)change.push('New: '+newItems.length);if(changedItems.length)change.push('Changed: '+changedItems.length);if(removedCount)change.push('Resolved: '+removedCount);if(!change.length)change.push(previous?'No significant change since the previous collection':'Baseline established');
  document.getElementById('changes').textContent=change.join(' · ');
  list('weather-list',focusItems.filter(x=>x.source==='Met Office'));list('england-list',focus==='England'||focus==='UK'?ew.items||[]:[]);list('wales-list',focus==='Wales'||focus==='UK'?wa.items||[]:[]);list('scotland-list',focus==='Scotland'||focus==='UK'?sc.items||[]:[]);
  const feeds=d.feeds||{};document.getElementById('feeds').innerHTML=Object.entries(feeds).map(([k,v])=>'<div class="feed"><span>'+esc(k)+'</span><span class="'+(v.ok?'ok':'bad')+'">'+(v.ok?'OK':(v.stale?'STALE':'ERROR'))+'</span></div>').join('');
  const changeCards=[
    ...newItems.map(x=>({kind:'NEW',className:'new',source:x.source,level:x.level||'Alert',title:x.title||x.area||'Current item'})),
    ...changedItems.map(x=>{
      const old=previousByIdentity.get(identityFor(x));
      return {kind:'CHANGED',className:'changed',source:x.source,level:x.level||'Alert',title:x.title||x.area||'Current item',detail:(old?.level||'Unknown')+' → '+(x.level||'Alert')};
    }),
    ...resolvedItems.map(x=>({kind:'RESOLVED',className:'resolved',source:x.source,level:x.level||'Alert',title:x.title||x.area||'Current item'}))
  ];
  document.getElementById('new-items').innerHTML=changeCards.length?changeCards.slice(0,8).map(x=>'<div class="change-item '+x.className+'"><div class="change-top"><span class="change-tag '+x.className+'">'+esc(x.kind)+'</span><strong>'+esc(x.source)+'</strong></div><div>'+esc(x.title)+'</div>'+(x.detail?'<small>'+esc(x.detail)+'</small>':'')+'</div>').join(''):'<div class="muted">No new, changed or resolved warning items detected.</div>';
  renderWeatherToday(d);
  populateRiskAssessmentFilters(d);renderMonitoringPreferences();applyMonitoringPreferences();bindRiskAssessment(d);renderRiskWorkspace(d);renderRiskAssessment(d);updateDomainVisibility();
  renderRiskMap(d);renderCoverage(d,riskSet,registry);renderDataConfidence(d);renderTrend(history,d);renderTimeline(history,d);
}
function list(id,items){
  const el=document.getElementById(id);if(!items.length){el.innerHTML='<div class="muted">No current items.</div>';return}
  el.innerHTML=items.slice(0,6).map(x=>'<div class="item '+String(x.level||'').toLowerCase()+'"><strong>'+esc(x.level||'Alert')+'</strong> — '+esc(x.title||x.area||'Current item')+'</div>').join('');
}
document.addEventListener('DOMContentLoaded',()=>{
  const focusArea=document.getElementById('focus-area');
  const defaultFocus=document.getElementById('default-focus');
  const applyDefault=document.getElementById('apply-default-focus');
  if(focusArea)focusArea.addEventListener('change',e=>{setFocus(e.target.value);load()});
  if(defaultFocus)defaultFocus.addEventListener('change',e=>{setDefaultFocus(e.target.value);load()});
  if(applyDefault)applyDefault.addEventListener('click',()=>{setFocus(getDefaultFocus());load()});
  const serviceExample=document.getElementById('load-example-service'); if(serviceExample)serviceExample.addEventListener('click',loadExampleService);
  const serviceClear=document.getElementById('clear-service'); if(serviceClear)serviceClear.addEventListener('click',clearService);
  const example=document.getElementById('load-example-profile'); if(example)example.addEventListener('click',loadExampleExposureProfile);
  const clear=document.getElementById('clear-exposure-profile'); if(clear)clear.addEventListener('click',clearExposureProfile);
  renderPreferences();
  renderMonitoringPreferences();
  const savePreferences=document.getElementById('save-monitoring-preferences');
  if(savePreferences&&!savePreferences.dataset.bound){savePreferences.dataset.bound='1';savePreferences.addEventListener('click',saveMonitoringPreferences)}
  window.__riskSessionInteracted=false;
  load();
  setInterval(load,5*60*1000);
});
