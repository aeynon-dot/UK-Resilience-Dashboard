const FOCUS_KEY='ukResilienceFocus';
const focusNames=['UK','England','Wales','Scotland','Northern Ireland'];
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

  const selected=getFocus()==='UK'?'England':getFocus();
  const groups=[...svg.querySelectorAll('g[data-nation]')];
  groups.forEach(group=>{
    const name=group.dataset.nation;
    if(!statuses[name])return;
    const status=statuses[name];
    group.setAttribute('class','map-region risk-'+status.overall.toLowerCase());
    group.setAttribute('tabindex','0');
    group.setAttribute('role','button');
    group.setAttribute('aria-label',name+' — '+(status.overall==='Check'?'Check data':status.overall));
    group.classList.toggle('selected',name===selected);

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

  const nation=statuses[selected]||statuses.England;
  const weatherItems=d.met_office?.items||[];
  const selectedWeather=selected==='UK'?weatherItems:weatherItems.filter(x=>regionMatch(x,selected));
  const selectedFlood=selected==='England'?(d.england?.items||[]):selected==='Wales'?(d.wales?.items||[]):selected==='Scotland'?(d.scotland?.items||[]):[];
  const feedName=selected==='England'?'Environment Agency':selected==='Wales'?'Natural Resources Wales':selected==='Scotland'?'SEPA':null;
  const feed=feedName?d.feeds?.[feedName]:null;
  const items=[...selectedWeather.map(x=>({...x,type:'Weather'})),...selectedFlood.map(x=>({...x,type:'Flood'}))];
  const itemHtml=items.length?items.slice(0,5).map(x=>'<div class="map-detail-item"><span class="map-detail-item-level '+String(x.level||'Alert').toLowerCase()+'">'+esc(x.level||'Alert')+'</span><span>'+esc(x.title||x.area||'Current item')+'</span></div>').join(''):'<div class="muted">No current warning or flood items for this area.</div>';
  const feedHtml=feed?'<small>Flood data: '+esc(feed.ok?'OK':feed.stale?'STALE — last successful update '+ageLabel(feed.last_success_at):'ERROR')+'</small>':'';
  const niInfo=selected==='Northern Ireland'?'<small>DfI Rivers provides flood information and water-level data separately.</small><a class="map-detail-link" href="https://www.infrastructure-ni.gov.uk/topics/rivers-and-flooding" target="_blank" rel="noopener">Open DfI Rivers flood information →</a>':'';
  document.getElementById('map-detail').innerHTML='<strong>'+esc(selected==='UK'?'UK-wide':selected)+'</strong><span class="map-detail-risk '+nation.overall.toLowerCase()+'">'+esc(nation.overall==='Check'?'CHECK DATA':nation.overall.toUpperCase())+'</span><small>Weather: '+esc(nation.weather)+' · Flood: '+esc(nation.flood)+'</small>'+feedHtml+niInfo+'<div class="map-detail-items">'+itemHtml+'</div>';
  
  const levels=['Red','Amber','Yellow'];
  const counts=Object.fromEntries(levels.map(x=>[x,weatherItems.filter(i=>i.level===x).length]));
  document.getElementById('weather-risk-summary').innerHTML='<strong>'+weatherItems.length+' active Met Office warning'+(weatherItems.length===1?'':'s')+'</strong> · '+counts.Red+' Red · '+counts.Amber+' Amber · '+counts.Yellow+' Yellow';
}
async function load(){
  try{
    const [current,history]=await Promise.all([
      fetch('data/current.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}),
      fetch('data/history.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]),
      loadMapData()
    ]);
    render(current,Array.isArray(history)?history:[]);
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
function renderRiskMap(d){renderGeographicMap(d);}

function getFocus(){
  try{
    const x=localStorage.getItem(FOCUS_KEY);
    return focusNames.includes(x)?x:'UK';
  }catch(e){return 'UK'}
}
function setFocus(v){
  try{localStorage.setItem(FOCUS_KEY,v)}catch(e){}
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
function renderAttention(d,history,newItems){
  const total=totalFor(d);
  const cards=[];
  const feeds=Object.entries(d.feeds||{});
  feeds.filter(([,v])=>!v.ok).forEach(([name,v])=>{
    cards.push({
      priority:100,
      html:'<div class="attention-item attention-data"><div class="attention-top"><span class="attention-tag check">DATA</span><strong>'+esc(name)+'</strong></div><div class="attention-text">'+esc(v.stale?'Feed is stale — last successful update '+ageLabel(v.last_success_at)+'.':'Feed reported an error and needs checking.')+'</div></div>'
    });
  });
  const severity={Red:90,Amber:70,Yellow:50};
  const currentItems=[
    ...(d.met_office?.items||[]).map(x=>({...x,source:'Met Office'})),
    ...(d.england?.items||[]).map(x=>({...x,source:'England'})),
    ...(d.wales?.items||[]).map(x=>({...x,source:'Wales'})),
    ...(d.scotland?.items||[]).map(x=>({...x,source:'Scotland'}))
  ];
  currentItems.forEach(x=>{
    const isNew=newItems.some(n=>keyFor(n)===keyFor(x)&&n.source===x.source);
    const level=x.level||'Alert';
    const base=severity[level]??40;
    const priority=base+(isNew?25:0);
    const tag=isNew?'NEW':level.toUpperCase();
    const tagClass=isNew?'new':String(level).toLowerCase();
    cards.push({
      priority,
      html:'<div class="attention-item attention-'+tagClass+'"><div class="attention-top"><span class="attention-tag '+tagClass+'">'+esc(tag)+'</span><strong class="attention-source">'+esc(x.source)+'</strong></div><div class="attention-text">'+esc(x.title||x.area||'Current warning or alert')+'</div>'+(isNew?'<div class="attention-meta">Detected since the previous collection</div>':'<div class="attention-meta">Currently active</div>')+'</div>'
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
  document.getElementById('attention-list').innerHTML=html;
}
function render(d,history){
  document.getElementById('updated').textContent='Data updated '+new Date(d.updated_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
  const weather=d.met_office||{}, ew=d.england||{}, wa=d.wales||{}, sc=d.scotland||{};
  document.getElementById('weather-count').textContent=weather.count ?? 0;
  document.getElementById('england-count').textContent=(ew.warnings||0)+(ew.alerts||0)+(ew.severe||0);
  document.getElementById('wales-count').textContent=(wa.warnings||0)+(wa.alerts||0)+(wa.severe||0);
  document.getElementById('scotland-count').textContent=(sc.warnings||0)+(sc.alerts||0)+(sc.severe||0);
  const feedValues=Object.values(d.feeds||{}),hasFeedIssue=feedValues.some(v=>!v.ok),total=totalFor(d);
  const previous=history.find(h=>h&&typeof h==='object'&&!Array.isArray(h));
  const previousKeys=new Set([
    ...(previous?.met_office?.items||[]).map(keyFor),...(previous?.england?.items||[]).map(keyFor),
    ...(previous?.wales?.items||[]).map(keyFor),...(previous?.scotland?.items||[]).map(keyFor)
  ]);
  const currentItems=[
    ...(weather.items||[]).map(x=>({...x,source:'Met Office'})),
    ...(ew.items||[]).map(x=>({...x,source:'England'})),
    ...(wa.items||[]).map(x=>({...x,source:'Wales'})),
    ...(sc.items||[]).map(x=>({...x,source:'Scotland'}))
  ];
  const newItems=currentItems.filter(x=>!previousKeys.has(keyFor(x)));
  const removedCount=Math.max(0,previous?totalFor(previous)-total:0);
  const status=document.getElementById('status');status.className='status';
  if(hasFeedIssue){status.textContent='CHECK DATA';status.classList.add('attention');document.getElementById('headline').textContent=total?total+' active warning/alert items — data feed issue':'No active items reported, but a data feed needs checking'}
  else{status.textContent=total?'ATTENTION':'ALL CLEAR';if(total)status.classList.add('attention');document.getElementById('headline').textContent=total?total+' active warning/alert items detected':'No active warning/alert items in the collected feeds'}
  const change=[];if(newItems.length)change.push('New: '+newItems.length);if(removedCount)change.push('Fewer active items: '+removedCount);if(!change.length)change.push(previous?'No significant change since the previous collection':'Baseline established');
  document.getElementById('changes').textContent=change.join(' · ');
  list('weather-list',weather.items||[]);list('england-list',ew.items||[]);list('wales-list',wa.items||[]);list('scotland-list',sc.items||[]);
  const feeds=d.feeds||{};document.getElementById('feeds').innerHTML=Object.entries(feeds).map(([k,v])=>'<div class="feed"><span>'+esc(k)+'</span><span class="'+(v.ok?'ok':'bad')+'">'+(v.ok?'OK':(v.stale?'STALE':'ERROR'))+'</span></div>').join('');
  document.getElementById('new-items').innerHTML=newItems.length?newItems.slice(0,8).map(x=>'<div class="change-item"><strong>'+esc(x.source)+'</strong> — '+esc(x.level||'Alert')+' — '+esc(x.title||'Current item')+'</div>').join(''):'<div class="muted">No new warning or alert items detected.</div>';
  const uw=d.uk_weather||{};document.getElementById('weather-today').innerHTML=uw.error?'<div class="weather-placeholder"><strong>UK-wide forecast unavailable</strong><br>See the Met Office national forecast directly.</div>':'<div class="weather-placeholder"><strong>UK-wide forecast</strong><br>'+esc(uw.summary||'National forecast available')+'</div>';
  renderRiskMap(d);renderFocus(d);renderAttention(d,history,newItems);renderTrend(history,d);
}
function list(id,items){
  const el=document.getElementById(id);if(!items.length){el.innerHTML='<div class="muted">No current items.</div>';return}
  el.innerHTML=items.slice(0,6).map(x=>'<div class="item '+String(x.level||'').toLowerCase()+'"><strong>'+esc(x.level||'Alert')+'</strong> — '+esc(x.title||x.area||'Current item')+'</div>').join('');
}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.map-region').forEach(el=>{
    const choose=()=>{setFocus(el.dataset.nation);load()};
    el.addEventListener('click',choose);
  });
  document.getElementById('focus-area').addEventListener('change',e=>{setFocus(e.target.value);load()});
  load();
  setInterval(load,5*60*1000);
});
