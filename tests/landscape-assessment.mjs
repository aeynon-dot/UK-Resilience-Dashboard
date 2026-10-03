import assert from 'node:assert/strict';
import { assessLandscape } from '../ai/landscape-assessment.mjs';

const context = {
  assessment_id: 'LS-20261002T140000Z',
  monitoring_scope: { geography: 'UK', domains: ['flooding'], filters: { themes: [], minimum_priority: 'monitor' } },
  signals: [{ signal_id: 'a', priority_band: 'high', severity: 'high', status: 'active' }],
  relationships: [],
  data_quality: { stale_sources: [], failed_sources: [] }
};

let calls = 0;
const gateway = {
  async assess(input) {
    calls += 1;
    if (calls === 1) {
      assert.equal(input, context);
    } else {
      assert.equal(input.monitoring_scope.geography, 'England');
    }
    return {
      assessment_status: 'supported',
      attention_items: [{
        title: 'Developing flood-related concern',
        assessment: 'Potentially significant within the monitored landscape.',
        supporting_signal_ids: ['a'],
        evidence_claims: [{ signal_id: 'a', field: 'severity', value: 'high' }],
        rationale: 'Recent material signal with strong relevance to the monitored scope.',
        evidence_strength: 'strong',
        uncertainty: ['Organisational impact has not been assessed.'],
        investigation_areas: ['Confirm exposure and current authoritative guidance.']
      }]
    };
  }
};

const initial = await assessLandscape({ current: context, gateway });
assert.equal(initial.reassess, true);
assert.deepEqual(initial.reasons, ['initial_load']);
assert.equal(initial.assessment.assessment_status, 'supported');
assert.equal(initial.landscape_snapshot_id, context.assessment_id);
assert.equal(calls, 1);

const unchanged = await assessLandscape({ previous: context, current: context, gateway });
assert.equal(unchanged.reassess, false);
assert.deepEqual(unchanged.reasons, []);
assert.equal(unchanged.assessment, null);
assert.equal(calls, 1);

const changed = {
  ...context,
  monitoring_scope: { ...context.monitoring_scope, geography: 'England' }
};
const second = await assessLandscape({ previous: context, current: changed, gateway });
assert.equal(second.reassess, true);
assert.deepEqual(second.reasons, ['geography_change']);
assert.equal(calls, 2);

const unavailableGateway = {
  async assess() {
    return {
      assessment_status: 'unavailable',
      limitations: ['AI assessment unavailable; RM evidence remains available.']
    };
  }
};
const unavailable = await assessLandscape({ current: context, gateway: unavailableGateway });
assert.equal(unavailable.assessment.assessment_status, 'unavailable');

const invalidGateway = {
  async assess() {
    return { assessment_status: 'supported' };
  }
};
await assert.rejects(
  () => assessLandscape({ current: context, gateway: invalidGateway }),
  /attention_items/
);

console.log('MVP5.1 landscape assessment orchestration checks: PASS');
