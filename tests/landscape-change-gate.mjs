import assert from 'node:assert/strict';
import { assessLandscapeChange } from '../ai/landscape-change-gate.mjs';

const base = {
  assessment_id: 'LS-20261002T100000Z',
  monitoring_scope: {
    geography: 'UK',
    domains: ['flooding'],
    filters: { themes: [], minimum_priority: 'monitor' }
  },
  signals: [
    { signal_id: 'a', severity: 'moderate', status: 'active', priority_band: 'moderate', change_status: 'unknown' }
  ],
  relationships: [],
  data_quality: { stale_sources: [], failed_sources: [] }
};

assert.deepEqual(assessLandscapeChange(null, base), { reassess: true, reasons: ['initial_load'] });

assert.deepEqual(
  assessLandscapeChange(base, { ...base, monitoring_scope: { ...base.monitoring_scope, geography: 'England' } }),
  { reassess: true, reasons: ['geography_change'] }
);

assert.deepEqual(
  assessLandscapeChange(base, { ...base, monitoring_scope: { ...base.monitoring_scope, domains: ['flooding', 'weather'] } }),
  { reassess: true, reasons: ['domain_change'] }
);

assert.deepEqual(
  assessLandscapeChange(base, { ...base, monitoring_scope: { ...base.monitoring_scope, filters: { themes: ['weather'], minimum_priority: 'monitor' } } }),
  { reassess: true, reasons: ['material_filter_change'] }
);

const newHigh = { ...base, signals: [...base.signals, { signal_id: 'b', severity: 'high', status: 'active', priority_band: 'high', change_status: 'new' }] };
assert.deepEqual(assessLandscapeChange(base, newHigh), { reassess: true, reasons: ['new_significant_signal'] });

const newMonitor = { ...base, signals: [...base.signals, { signal_id: 'b', severity: 'moderate', status: 'active', priority_band: 'monitor', change_status: 'new' }] };
assert.deepEqual(assessLandscapeChange(base, newMonitor), { reassess: false, reasons: [] });

const changed = { ...base, signals: [{ ...base.signals[0], status: 'escalated' }] };
assert.deepEqual(assessLandscapeChange(base, changed), { reassess: true, reasons: ['material_signal_change'] });

const escalated = { ...base, signals: [{ ...base.signals[0], priority_band: 'high' }] };
assert.deepEqual(assessLandscapeChange(base, escalated), { reassess: true, reasons: ['escalation_or_deescalation'] });

const related = { ...base, relationships: [{ signal_ids: ['a', 'b'], relationship_type: 'candidate_shared_context' }] };
assert.deepEqual(assessLandscapeChange(base, related), { reassess: true, reasons: ['related_signals_emerge'] });

const stale = { ...base, data_quality: { stale_sources: ['met-office'], failed_sources: [] } };
assert.deepEqual(assessLandscapeChange(base, stale), { reassess: true, reasons: ['evidence_quality_change'] });

assert.deepEqual(assessLandscapeChange(base, base), { reassess: false, reasons: [] });
assert.deepEqual(assessLandscapeChange(base, base, { manualReassess: true }), { reassess: true, reasons: ['manual_reassess'] });

const combined = assessLandscapeChange(base, newHigh, { manualReassess: true });
assert.equal(combined.reassess, true);
assert.deepEqual(combined.reasons, ['manual_reassess', 'new_significant_signal']);

console.log('MVP5.1 landscape change gate checks: PASS');
