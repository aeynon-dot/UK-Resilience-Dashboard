async function load(){
  try{
    const [current,history]=await Promise.all([
      fetch('data/current.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}),
      fetch('data/history.json',{cache:'no-store'}).then(r=>r.ok?r.json():[])
    ]);
    render(current,history);
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
function render(d,history){
  document.getElementById('updated').textContent='Data updated '+new Date(d.updated_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
  const weather=d.met_office||{}, ew=d.england||{}, wa=d.wales||{}, sc=d.scotland||{};
  document.getElementById('weather-count').textContent=weather.count ?? 0;
  document.getElementById('england-count').textContent=(ew.warnings||0)+(ew.alerts||0)+(ew.severe||0);
  document.getElementById('wales-count').textContent=(wa.warnings||0)+(wa.alerts||0)+(wa.severe||0);
  document.getElementById('scotland-count').textContent=(sc.warnings||0)+(sc.alerts||0)+(sc.severe||0);

  const feedValues=Object.values(d.feeds||{});
  const hasFeedIssue=feedValues.some(v=>!v.ok);
  const total=totalFor(d);
  const previous=history?.[0];
  const previousKeys=new Set([
    ...(previous?.met_office?.items||[]).map(keyFor),
    ...(previous?.england?.items||[]).map(keyFor),
    ...(previous?.wales?.items||[]).map(keyFor),
    ...(previous?.scotland?.items||[]).map(keyFor)
  ]);
  const currentItems=[
    ...(weather.items||[]).map(x=>({...x,source:'Met Office'})),
    ...(ew.items||[]).map(x=>({...x,source:'England'})),
    ...(wa.items||[]).map(x=>({...x,source:'Wales'})),
    ...(sc.items||[]).map(x=>({...x,source:'Scotland'}))
  ];
  const newItems=currentItems.filter(x=>!previousKeys.has(keyFor(x)));
  const removedCount=Math.max(0, previous ? totalFor(previous)-total : 0);

  const status=document.getElementById('status');
  status.className='status';
  if(hasFeedIssue){
    status.textContent='CHECK DATA';
    status.classList.add('attention');
    document.getElementById('headline').textContent=total?total+' active warning/alert items — data feed issue':'No active items reported, but a data feed needs checking';
  }else{
    status.textContent=total?'ATTENTION':'ALL CLEAR';
    if(total) status.classList.add('attention');
    document.getElementById('headline').textContent=total?total+' active warning/alert items detected':'No active warning/alert items in the collected feeds';
  }

  const change=[];
  if(newItems.length) change.push('New: '+newItems.length);
  if(removedCount) change.push('Fewer active items: '+removedCount);
  if(!change.length) change.push(previous?'No significant change since the previous collection':'Baseline established');
  document.getElementById('changes').textContent=change.join(' · ');

  list('weather-list',weather.items||[]);
  list('england-list',ew.items||[]);
  list('wales-list',wa.items||[]);
  list('scotland-list',sc.items||[]);

  const feeds=d.feeds||{};
  document.getElementById('feeds').innerHTML=Object.entries(feeds).map(([k,v])=>{
    const label=v.ok?'OK':(v.stale?'STALE':'ERROR');
    return '<div class="feed"><span>'+esc(k)+'</span><span class="'+(v.ok?'ok':'bad')+'">'+label+'</span></div>';
  }).join('');

  document.getElementById('new-items').innerHTML=newItems.length
    ? newItems.slice(0,8).map(x=>'<div class="change-item"><strong>'+esc(x.source)+'</strong> — '+esc(x.level||'Alert')+' — '+esc(x.title||'Current item')+'</div>').join('')
    : '<div class="muted">No new warning or alert items detected.</div>';

  const uw=d.uk_weather||{}; document.getElementById('weather-today').innerHTML=uw.error?'<div class="weather-placeholder"><strong>UK-wide forecast unavailable</strong><br>See the Met Office national forecast directly.</div>':'<div class="weather-placeholder"><strong>UK-wide forecast</strong><br>'+esc(uw.summary||'National forecast available')+'</div>';
}
function list(id,items){
  const el=document.getElementById(id);
  if(!items.length){el.innerHTML='<div class="muted">No current items.</div>';return}
  el.innerHTML=items.slice(0,6).map(x=>'<div class="item '+String(x.level||'').toLowerCase()+'"><strong>'+esc(x.level||'Alert')+'</strong> — '+esc(x.title||x.area||'Current item')+'</div>').join('');
}
load();
