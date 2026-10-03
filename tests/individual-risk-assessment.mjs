import assert from 'node:assert/strict';
import {buildIndividualRiskContext,createIndividualRiskAssessmentGateway,validateIndividualProviderOutput} from '../ai/individual-risk-assessment.mjs';

const context={
 assessment_id:'LS-20261003T064933Z',
 timestamp:'2026-10-03T06:49:33Z',
 monitoring_scope:{geography:'UK',domains:['flooding','health']},
 signals:[
  {signal_id:'risk:flood',title:'Rivers Ehen, Calder, Irt and Esk',description:'Rivers Ehen, Calder, Irt and Esk',domain:'flooding',hazard:'flooding',geography:{scope:'England'},severity:'moderate',status:'active',priority_band:'high',change_status:'new',source:'Environment Agency',source_record_id:'ea:123',source_native_status:'Alert',authoritative_source_url:'https://check-for-flooding.service.gov.uk/',collected_at:'2026-10-03T06:49:33Z',evidence_confidence:'high'},
  {signal_id:'risk:health',title:'Respiratory surveillance',description:'Respiratory surveillance',domain:'health',hazard:'health',geography:{scope:'England'},severity:'low',status:'monitoring',priority_band:'monitor',change_status:'new',source:'UKHSA',source_record_id:'uk:1',source_native_status:null,authoritative_source_url:'https://www.gov.uk/government/organisations/uk-health-security-agency',collected_at:'2026-10-03T06:49:33Z',evidence_confidence:'high'}
 ],
 relationships:[{signal_ids:['risk:flood','risk:health'],relationship_type:'candidate_shared_context',supporting_evidence:['Signals share geography; candidate relationship, not causation.']}],
 data_quality:{stale_sources:[],failed_sources:[],limitations:[]}
};

const individual=buildIndividualRiskContext(context,'risk:flood');
assert.equal(individual.signal.signal_id,'risk:flood');
assert.equal(individual.related_signals[0].signal_id,'risk:health');

const valid={
 assessment_status:'supported',
 provider:'shadow-development',
 model:'deterministic-preview',
 prompt_version:'mvp5.2-preview-1',
 schema_version:'mvp5.2-individual-1',
 assessment:'The signal warrants investigation because it is a new Environment Agency alert in England.',
 why_it_matters:'The combination of a new status and high monitoring priority makes this worth checking against the authoritative source.',
 potential_significance:'Potential significance depends on whether the monitored area is relevant to the user context; no organisational exposure is established here.',
 evidence_claims:[
  {signal_id:'risk:flood',field:'source_native_status',value:'Alert'},
  {signal_id:'risk:flood',field:'change_status',value:'new'},
  {signal_id:'risk:flood',field:'priority_band',value:'high'}
 ],
 uncertainty:['The RM signal does not establish organisational exposure.'],
 investigation_areas:['Check the authoritative Environment Agency record.','Establish whether the monitored geography is relevant to the organisation.']
};
validateIndividualProviderOutput(valid,individual);

assert.throws(()=>validateIndividualProviderOutput({...valid,evidence_claims:[{signal_id:'risk:flood',field:'source_native_status',value:'Flooding is imminent'}]},individual),/does not match context/);
assert.throws(()=>validateIndividualProviderOutput({...valid,why_it_matters:'This affects your organisation directly.',evidence_claims:valid.evidence_claims},individual),/organisation-specific/);
assert.throws(()=>validateIndividualProviderOutput({...valid,assessment:'The source says “Flooding is possible – be prepared”.',evidence_claims:valid.evidence_claims},individual),/quoted claim/);

let calls=0;
const gateway=createIndividualRiskAssessmentGateway({clock:()=>new Date('2026-10-03T07:00:00Z'),provider:{async assess(){calls++;return valid;}}});
const assessed=await gateway.assess(individual);
assert.equal(calls,1);
assert.equal(assessed.signal_id,'risk:flood');
assert.equal(assessed.assessment_status,'supported');

const failing=createIndividualRiskAssessmentGateway({clock:()=>new Date('2026-10-03T07:00:00Z'),provider:{async assess(){throw new Error('offline');}}});
const unavailable=await failing.assess(individual);
assert.equal(unavailable.assessment_status,'unavailable');
assert.match(unavailable.limitations[0],/RM evidence remains available/);

console.log('Individual risk assessment tests passed');
