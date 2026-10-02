import assert from 'node:assert/strict';
import { createAssessmentGateway } from '../ai/assessment-gateway.mjs';
const context={assessment_id:'LS-2026-10-02-001',timestamp:'2026-10-02T12:45:16Z'};
const gateway=createAssessmentGateway({provider:{async assess(received,metadata){assert.equal(received,context);assert.equal(metadata.landscape_snapshot_id,context.assessment_id);return{assessment_status:'supported',attention_items:[]};}},clock:()=>new Date('2026-10-02T13:00:00Z')});
const result=await gateway.assess(context);assert.equal(result.assessment_status,'supported');assert.equal(result.landscape_snapshot_id,context.assessment_id);assert.equal(result.generated_at,'2026-10-02T13:00:00.000Z');assert.match(result.assessment_id,/^AI-/);
const failingGateway=createAssessmentGateway({provider:{async assess(){throw new Error('provider failure');}},clock:()=>new Date('2026-10-02T13:01:00Z')});const failure=await failingGateway.assess(context);assert.equal(failure.assessment_status,'unavailable');assert.equal(failure.landscape_snapshot_id,context.assessment_id);assert.match(failure.limitations[0],/RM evidence remains available/);
await assert.rejects(async()=>createAssessmentGateway({provider:{}}),/AI provider must expose assess/);
console.log('MVP5 provider-neutral gateway checks: PASS');