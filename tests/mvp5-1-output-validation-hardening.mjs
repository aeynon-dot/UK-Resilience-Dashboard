import assert from 'node:assert/strict';
import { createAssessmentGateway } from '../ai/assessment-gateway.mjs';

const context = {
  assessment_id: 'LS-20261002T150000Z',
  signals: [{ signal_id: 'sig-1', severity: 'moderate', source_native_status: 'Alert' }, { signal_id: 'sig-2' }]
};

const item = {
  title: 'Developing concern',
  assessment: 'Potentially significant within the monitored landscape.',
  supporting_signal_ids: ['sig-1'],
  evidence_claims: [{ signal_id: 'sig-1', field: 'severity', value: 'moderate' }],
  rationale: 'Recent material signal with strong relevance.',
  evidence_strength: 'strong',
  uncertainty: ['Organisational impact has not been assessed.'],
  investigation_areas: ['Confirm exposure and current authoritative guidance.']
};

function gatewayFor(result) {
  return createAssessmentGateway({
    provider: { async assess() { return result; } },
    clock: () => new Date('2026-10-02T15:00:00Z')
  });
}

const valid = await gatewayFor({
  assessment_status: 'supported',
  attention_items: [item],
  provider: 'fixture',
  model: 'test-model'
}).assess(context);

assert.equal(valid.assessment_status, 'supported');
assert.equal(valid.landscape_snapshot_id, context.assessment_id);
assert.equal(valid.generated_at, '2026-10-02T15:00:00.000Z');
assert.equal(valid.provider, 'fixture');

const reserved = await gatewayFor({
  assessment_status: 'supported',
  attention_items: [],
  assessment_id: 'spoof',
  generated_at: '2000-01-01T00:00:00Z',
  landscape_snapshot_id: 'spoof'
}).assess(context);
assert.equal(reserved.assessment_status, 'unavailable');
assert.equal(reserved.landscape_snapshot_id, context.assessment_id);
assert.equal(reserved.generated_at, '2026-10-02T15:00:00.000Z');

const unsupportedSourceWording = await gatewayFor({
  assessment_status: 'supported',
  attention_items: [{ ...item, assessment: 'The source reports “Flooding is possible – be prepared”.' }]
}).assess({ ...context, signals: [{ signal_id: 'sig-1', severity: 'moderate', source_native_status: 'Alert' }, { signal_id: 'sig-2' }] });
assert.equal(unsupportedSourceWording.assessment_status, 'unavailable');

const supportedSourceStatusClaim = await gatewayFor({
  assessment_status: 'supported',
  attention_items: [{ ...item, assessment: 'The source status is “Alert”.', evidence_claims: [{ signal_id: 'sig-1', field: 'source_native_status', value: 'Alert' }] }]
}).assess({ ...context, signals: [{ signal_id: 'sig-1', severity: 'moderate', source_native_status: 'Alert' }, { signal_id: 'sig-2' }] });
assert.equal(supportedSourceStatusClaim.assessment_status, 'supported');

const unknownEvidenceValue = await gatewayFor({
  assessment_status: 'supported',
  attention_items: [{ ...item, evidence_claims: [{ signal_id: 'sig-1', field: 'source_native_status', value: 'Flooding is possible – be prepared' }] }]
}).assess({ ...context, signals: [{ signal_id: 'sig-1', severity: 'moderate', source_native_status: 'Alert' }, { signal_id: 'sig-2' }] });
assert.equal(unknownEvidenceValue.assessment_status, 'unavailable');

const invalidEvidenceField = await gatewayFor({
  assessment_status: 'supported',
  attention_items: [{ ...item, evidence_claims: [{ signal_id: 'sig-1', field: 'unknown_field', value: 'x' }] }]
}).assess(context);
assert.equal(invalidEvidenceField.assessment_status, 'unavailable');
const unknownSignal = await gatewayFor({
  assessment_status: 'supported',
  attention_items: [{ ...item, supporting_signal_ids: ['not-real'] }]
}).assess(context);
assert.equal(unknownSignal.assessment_status, 'unavailable');

const tooMany = await gatewayFor({
  assessment_status: 'supported',
  attention_items: Array.from({ length: 6 }, (_, i) => ({ ...item, title: `Item ${i}` }))
}).assess(context);
assert.equal(tooMany.assessment_status, 'unavailable');

const numericalScore = await gatewayFor({
  assessment_status: 'supported',
  attention_items: [item],
  risk_score: 97
}).assess(context);
assert.equal(numericalScore.assessment_status, 'unavailable');

const malformed = await gatewayFor({
  assessment_status: 'supported',
  attention_items: [{ ...item, uncertainty: 'not-an-array' }]
}).assess(context);
assert.equal(malformed.assessment_status, 'unavailable');

const unsupportedRanking = await gatewayFor({
  assessment_status: 'supported',
  attention_items: [item],
  ranking: 1
}).assess(context);
assert.equal(unsupportedRanking.assessment_status, 'unavailable');

const insufficient = await gatewayFor({
  assessment_status: 'insufficient_evidence',
  limitations: ['Insufficient evidence.']
}).assess(context);
assert.equal(insufficient.assessment_status, 'insufficient_evidence');

console.log('MVP5.1 output-validation hardening checks: PASS');
