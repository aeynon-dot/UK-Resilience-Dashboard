async function load(){
  try{
    const r=await fetch('data/current.json',{cache:'no-store'});
    if(!r.ok) throw new Error(r.status);
    render(await r.json());
  }catch(e){
    document.getElementById('headline').textContent='Data not available yet';
    document.getElementById('status').textContent='OFFLINE';
    document.getElementById('status').classList.add('attention');
  }
}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function render(d){
 document.getElementById('updated').textContent='Data updated '+new Date(d.updated_at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
 const weather=d.met_office||{}, ew=d.england||{}, wa=d.wales||{}, sc=d.scotland||{};
 document.getElementById('weather-count').textContent=weather.count ?? '—';
 document.getElementById('england-count').textContent=(ew.warnings||0)+(ew.alerts||0)+(ew.severe||0);
 document.getElementById('wales-count').textContent=(wa.warnings||0)+(wa.alerts||0)+(wa.severe||0);
 document.getElementById('scotland-count').textContent=(sc.warnings||0)+(sc.alerts||0)+(sc.severe||0);
 const total=(weather.count||0)+(ew.warnings||0)+(ew.alerts||0)+(ew.severe||0)+(wa.warnings||0)+(wa.alerts||0)+(wa.severe||0)+(sc.warnings||0)+(sc.alerts||0)+(sc.severe||0);
 const status=document.getElementById('status');
 status.textContent=total?'ATTENTION':'ALL CLEAR';
 if(total) status.classList.add('attention');
 document.getElementById('headline').textContent=total?total+' active warning/alert items detected':'No active warning/alert items in the collected feeds';
 list('weather-list',weather.items||[]); list('england-list',ew.items||[]); list('wales-list',wa.items||[]); list('scotland-list',sc.items||[]);
 const feeds=d.feeds||{};
 document.getElementById('feeds').innerHTML=Object.entries(feeds).map(([k,v])=>'<div class="feed"><span>'+esc(k)+'</span><span class="'+(v.ok?'ok':'bad')+'">'+(v.ok?'OK':'ERROR')+'</span></div>').join('');
}
function list(id,items){
 const el=document.getElementById(id);
 if(!items.length){el.innerHTML='<div class="muted">No current items.</div>';return}
 el.innerHTML=items.slice(0,6).map(x=>'<div class="item '+String(x.level||'').toLowerCase()+'"><strong>'+esc(x.level||'Alert')+'</strong> — '+esc(x.title||x.area||'Current item')+'</div>').join('');
}
load();