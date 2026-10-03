(function(){
'use strict';
const FEEDBACK_PREFIX='mvp52-individual-feedback:';
function escText(value){const d=document.createElement('div');d.textContent=String(value??'');return d.innerHTML;}
function assessment(signal){
  const change=signal.change_type&&signal.change_type!=='unknown'?signal.change_type:'no change classification provided';
  const band=signal.priority_band||'monitor';const native=signal.source_native_status||null;
  const claims=[['source',signal.source||'Unknown source'],['priority_band',band]];
  if(change!=='no change classification provided')claims.push(['change_status',change==='new'?'new':'changed']);
  if(native)claims.push(['source_native_status',native]);
  return {
    why:change==='new'?'The signal is newly recorded in the RM snapshot, so checking the underlying authoritative record is a useful next investigation.':'The signal has a recorded RM status and monitoring priority that make the underlying authoritative record worth checking.',
    significance:'Potential significance depends on the monitored geography, domain and the user’s own context. RM evidence alone does not establish organisational exposure.',
    uncertainty:['This is a deterministic development/shadow assessment, not a live AI provider response.','The RM signal does not establish organisational exposure.'],
    investigate:['Open the authoritative source and confirm the current source-native status.','Check whether the monitored geography and risk domain are relevant to your organisation.','Review any related signals before drawing a conclusion.'],
    claims
  };
}
function render(signal){
  const detail=document.getElementById('risk-detail');if(!detail||detail.hidden)return;
  if(document.getElementById('mvp52-development-panel'))return;
  const a=assessment(signal);const key=FEEDBACK_PREFIX+String(signal.id||'');
  const stored=(()=>{try{return localStorage.getItem(key)}catch(e){return null}})();
  const panel=document.createElement('section');panel.id='mvp52-development-panel';panel.className='mvp52-panel';
  panel.innerHTML='<div class="mvp52-panel-head"><div><span class="eyebrow">MVP5.2 INDIVIDUAL INTERPRETATION</span><h4>Development assessment</h4><p>This is a deterministic development/shadow assessment used to exercise the MVP5.2 journey. It is not live AI.</p></div><span class="mvp52-status">DEVELOPMENT</span></div>'+
    '<div class="mvp52-grid"><article><h5>Why it may matter</h5><p>'+escText(a.why)+'</p></article><article><h5>Potential significance</h5><p>'+escText(a.significance)+'</p></article><article><h5>Uncertainty</h5><ul>'+a.uncertainty.map(x=>'<li>'+escText(x)+'</li>').join('')+'</ul></article><article><h5>Investigate next</h5><ul>'+a.investigate.map(x=>'<li>'+escText(x)+'</li>').join('')+'</ul></article></div>'+
    '<details class="mvp52-evidence"><summary>Show me the evidence</summary><p>The interpretation is bounded to these exact RM fields:</p><ul>'+a.claims.map(x=>'<li><code>'+escText(x[0])+'</code> = <strong>'+escText(x[1])+'</strong></li>').join('')+'</ul><p>Source record: <code>'+escText(signal.source_record_id||'Not provided')+'</code></p></details>'+
    '<div class="mvp52-feedback"><strong>Was this interpretation useful?</strong><button type="button" data-mvp52-feedback="useful">Useful</button><button type="button" data-mvp52-feedback="not-useful">Not useful</button><span class="mvp52-feedback-status">'+(stored?'Feedback recorded for this evaluation.':'')+'</span></div>';
  detail.appendChild(panel);
  panel.querySelectorAll('[data-mvp52-feedback]').forEach(btn=>btn.addEventListener('click',()=>{try{localStorage.setItem(key,btn.dataset.mvp52Feedback)}catch(e){}panel.querySelector('.mvp52-feedback-status').textContent='Feedback recorded for this evaluation.';}));
}
function observe(){
  const detail=document.getElementById('risk-detail');if(!detail)return;
  const observer=new MutationObserver(()=>{if(detail.hidden){const old=document.getElementById('mvp52-development-panel');if(old)old.remove();return;}const id=detail.querySelector('.risk-detail-reference');if(!id||document.getElementById('mvp52-development-panel'))return;const signals=window.__riskData?.risk_signals||[];const signal=signals.find(x=>String(x.source_record_id||x.id||'')===String(id.textContent||'').replace(/^Source reference:\s*/,'').trim())||null;if(signal)render(signal);});
  observer.observe(detail,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
}
function addStyle(){
  const s=document.createElement('style');s.textContent='.mvp52-panel{margin:12px 0 0;border:1px solid #d7e0e7;border-radius:10px;background:#f7f9fa;padding:14px}.mvp52-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:1px solid #e2e8ed;padding-bottom:10px;margin-bottom:10px}.mvp52-panel-head h4{margin:5px 0 3px;font-size:.95rem}.mvp52-panel-head p{margin:0;font-size:.74rem;color:#627d98}.mvp52-status{font-size:.62rem;font-weight:900;padding:4px 7px;border-radius:999px;background:#e2e7eb;color:#52606d}.mvp52-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mvp52-grid article{background:#fff;border:1px solid #e1e6eb;border-radius:8px;padding:10px}.mvp52-grid h5{margin:0 0 5px;font-size:.76rem;color:#334e68}.mvp52-grid p,.mvp52-grid li{font-size:.78rem;line-height:1.4;margin:0}.mvp52-grid ul{margin:0;padding-left:18px}.mvp52-evidence{margin-top:8px;background:#fff;border:1px solid #e1e6eb;border-radius:8px;padding:9px}.mvp52-evidence summary{cursor:pointer;font-size:.76rem;font-weight:800;color:#334e68}.mvp52-evidence p,.mvp52-evidence li{font-size:.74rem;line-height:1.4}.mvp52-evidence ul{padding-left:18px}.mvp52-feedback{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:9px;font-size:.74rem}.mvp52-feedback button{font:inherit;font-weight:800;border:1px solid #9fb3c8;border-radius:7px;background:#fff;color:#243b53;padding:5px 8px;cursor:pointer}.mvp52-feedback-status{color:#627d98}@media(max-width:700px){.mvp52-grid{grid-template-columns:1fr}.mvp52-panel-head{flex-direction:column}}';document.head.appendChild(s);
}
document.addEventListener('DOMContentLoaded',()=>{addStyle();observe();});
})();