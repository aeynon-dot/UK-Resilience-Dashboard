import assert from 'node:assert/strict';
import fs from 'node:fs';

const cases = JSON.parse(fs.readFileSync('tests/fixtures/mvp5-1-landscape-cases.json', 'utf8'));

assert.equal(Array.isArray(cases.reassessment_cases), true);
assert.equal(Array.isArray(cases.attention_contract), true);

for (const testCase of cases.reassessment_cases) {
  assert.equal(typeof testCase.name, 'string');
  assert.equal(typeof testCase.expected_reassessment, 'boolean');
  assert.equal(typeof testCase.reason, 'string');
}

const expectedTriggerNames = new Set([
  'initial_load',
  'geography_change',
  'domain_change',
  'material_filter_change',
  'new_significant_signal',
  'material_signal_change',
  'escalation_or_deescalation',
  'related_signals_emerge',
  'manual_reassess',
  'routine_refresh',
  'timestamp_only_change',
  'minor_metadata_change'
]);

for (const testCase of cases.reassessment_cases) {
  assert.ok(expectedTriggerNames.has(testCase.trigger), `unknown trigger: ${testCase.trigger}`);
}

for (const item of cases.attention_contract) {
  assert.deepEqual(
    Object.keys(item.required_fields).sort(),
    ['assessment','evidence_claims','evidence_strength','investigation_areas','rationale','supporting_signal_ids','title','uncertainty'].sort()
  );
  assert.equal(item.forbid_numerical_score, true);
  assert.equal(item.forbid_authoritative_ranking, true);
}

assert.equal(cases.safe_failure.assessment_status, 'unavailable');
assert.equal(cases.safe_failure.rm_evidence_remains_available, true);
assert.equal(cases.safe_failure.invented_fallback_allowed, false);

console.log('MVP5.1 landscape assessment contract checks: PASS');
