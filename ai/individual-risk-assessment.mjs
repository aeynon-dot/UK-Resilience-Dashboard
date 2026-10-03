const VALID_STATUSES = new Set(['supported','with_limitations','insufficient_evidence','unavailable']);
const EVIDENCE_FIELDS = new Set([
  'title','description','domain','hazard','geography','severity','status',
  'priority_band','change_status','source','source_record_id','source_native_status',
  'authoritative_source_url','observed_at','collected_at','evidence_confidence'
]);
const RESERVED_FIELDS = new Set(['assessment_id','generated_at','signal_id']);
const FORBIDDEN_ORG_PHRASES = [
  'your organisation','your organization','your business','your company',
  'your site','your sites','your workforce','your supplier','your suppliers'
];

function invalid(message){throw new TypeError('Individual risk assessment is invalid: '+message);}
function strings(value,field){if(!Array.isArray(value)||value.some(x=>typeof x!=='string'))invalid(field+' must be an array of strings');}
function string(value,field){if(typeof value!=='string')invalid(field+' must be a string');}

export function buildIndividualRiskContext(context, signalId){
  if(!context||typeof context!=='object')throw new TypeError('Assessment context is required');
  if(typeof signalId!=='string'||!signalId)throw new TypeError('signalId is required');
  const signals=Array.isArray(context.signals)?context.signals:[];
  const signal=signals.find(x=>x.signal_id===signalId);
  if(!signal)throw new Error('Risk signal not found: '+signalId);
  const related=(context.relationships??[])
    .filter(r=>Array.isArray(r.signal_ids)&&r.signal_ids.includes(signalId))
    .map(r=>r.signal_ids.filter(id=>id!==signalId))
    .flat()
    .filter((id,i,a)=>a.indexOf(id)===i)
    .map(id=>signals.find(x=>x.signal_id===id))
    .filter(Boolean)
    .slice(0,10);
  return {
    assessment_id:context.assessment_id,
    timestamp:context.timestamp,
    signal,
    related_signals:related,
    data_quality:context.data_quality??{stale_sources:[],failed_sources:[],limitations:[]},
    monitoring_scope:context.monitoring_scope??{}
  };
}

function validateEvidenceClaims(claims,context){
  if(!Array.isArray(claims)||claims.length===0)invalid('evidence_claims must be a non-empty array');
  const all=[context.signal,...(context.related_signals??[])];
  for(const claim of claims){
    if(!claim||typeof claim!=='object'||Array.isArray(claim))invalid('evidence claim must be an object');
    const keys=Object.keys(claim);
    if(keys.length!==3||!['signal_id','field','value'].every(k=>keys.includes(k)))invalid('evidence claim requires only signal_id, field and value');
    string(claim.signal_id,'evidence claim signal_id');string(claim.field,'evidence claim field');string(claim.value,'evidence claim value');
    if(!EVIDENCE_FIELDS.has(claim.field))invalid('unsupported evidence claim field: '+claim.field);
    const source=all.find(x=>x.signal_id===claim.signal_id);
    if(!source)invalid('unknown evidence claim signal ID: '+claim.signal_id);
    const actual=source[claim.field];
    const normalised=Array.isArray(actual)?actual.join(', '):String(actual??'');
    if(normalised!==claim.value)invalid('evidence claim does not match context: '+claim.signal_id+'.'+claim.field);
  }
}

function validateQuotedClaims(output,context){
  const text=[output.assessment,output.why_it_matters,output.potential_significance,...output.uncertainty,...output.investigation_areas].join(' ');
  const quoted=[...text.matchAll(/“([^”]{4,})”/g),...text.matchAll(/"([^"]{4,})"/g)].map(m=>m[1].trim());
  if(!quoted.length)return;
  const sourceText=JSON.stringify([context.signal,...(context.related_signals??[])]);
  for(const quote of quoted)if(!sourceText.includes(quote))invalid('quoted claim is not present in bounded evidence: '+quote);
}

function validateNoOrgClaims(output){
  const text=[output.assessment,output.why_it_matters,output.potential_significance,...output.uncertainty,...output.investigation_areas].join(' ').toLowerCase();
  const hit=FORBIDDEN_ORG_PHRASES.find(x=>text.includes(x));
  if(hit)invalid('organisation-specific claim is outside MVP5.2 scope: '+hit);
}

export function validateIndividualProviderOutput(result,context){
  if(!result||typeof result!=='object'||Array.isArray(result))invalid('result must be an object');
  if(Object.keys(result).some(k=>RESERVED_FIELDS.has(k)))invalid('provider must not supply RM-owned provenance fields');
  if(!VALID_STATUSES.has(result.assessment_status))invalid('invalid assessment_status');
  const allowed=new Set(['assessment_status','provider','model','prompt_version','schema_version','assessment','why_it_matters','potential_significance','evidence_claims','uncertainty','investigation_areas','limitations','usage']);
  const unexpected=Object.keys(result).filter(k=>!allowed.has(k));
  if(unexpected.length)invalid('unsupported top-level fields: '+unexpected.join(', '));
  if(result.assessment_status==='supported'||result.assessment_status==='with_limitations'){
    for(const f of ['assessment','why_it_matters','potential_significance'])string(result[f],f);
    strings(result.uncertainty,'uncertainty');strings(result.investigation_areas,'investigation_areas');
    validateEvidenceClaims(result.evidence_claims,context);
    validateQuotedClaims(result,context);
    validateNoOrgClaims(result);
  }else if('evidence_claims' in result){
    invalid('evidence_claims are only permitted for supported or limited assessments');
  }
  if('limitations' in result)strings(result.limitations,'limitations');
  for(const f of ['provider','model','prompt_version','schema_version'])if(f in result)string(result[f],f);
  if('usage' in result){
    if(!result.usage||typeof result.usage!=='object'||Array.isArray(result.usage))invalid('usage must be an object');
    for(const f of ['input_tokens','output_tokens'])if(f in result.usage&&(!Number.isInteger(result.usage[f])||result.usage[f]<0))invalid('usage.'+f+' must be a non-negative integer');
    if('estimated_cost' in result.usage&&(!Number.isFinite(result.usage.estimated_cost)||result.usage.estimated_cost<0))invalid('usage.estimated_cost must be a non-negative number');
  }
  return result;
}

export function createIndividualRiskAssessmentGateway({provider,clock=()=>new Date()}={}){
  if(!provider||typeof provider.assess!=='function')throw new TypeError('AI provider must expose assess(context, metadata)');
  return {async assess(context){
    if(!context||typeof context!=='object')throw new TypeError('Individual risk context is required');
    const generatedAt=clock().toISOString();
    const metadata={assessment_id:'AI-'+generatedAt.replace(/[-:.TZ]/g,''),signal_id:context.signal.signal_id,generated_at:generatedAt};
    try{
      const result=await provider.assess(context,metadata);
      if(!result||typeof result!=='object')throw new TypeError('Provider returned no structured assessment');
      validateIndividualProviderOutput(result,context);
      return {...result,assessment_id:metadata.assessment_id,generated_at:generatedAt,signal_id:context.signal.signal_id};
    }catch(error){
      return {
        assessment_status:'unavailable',
        assessment_id:metadata.assessment_id,
        generated_at:generatedAt,
        signal_id:context.signal.signal_id,
        limitations:['AI assessment unavailable; RM evidence remains available.']
      };
    }
  }};
}

export {VALID_STATUSES,EVIDENCE_FIELDS};
