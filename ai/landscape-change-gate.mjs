const SIGNIFICANT_PRIORITY = new Set(['high', 'immediate']);
const MATERIAL_SIGNAL_FIELDS = ['severity', 'status', 'priority_band', 'change_status'];

function stable(value) {
  return JSON.stringify(value ?? null);
}

function signalMap(context) {
  return new Map((context?.signals ?? []).map(signal => [signal.signal_id, signal]));
}

function isSignificant(signal) {
  return SIGNIFICANT_PRIORITY.has(signal?.priority_band);
}

function signalMateriallyChanged(previous, current) {
  return MATERIAL_SIGNAL_FIELDS.some(field => previous?.[field] !== current?.[field]);
}

function isEscalationOrDeescalation(previous, current) {
  const rank = { monitor: 1, moderate: 2, high: 3, immediate: 4 };
  const before = rank[previous?.priority_band];
  const after = rank[current?.priority_band];
  return Number.isFinite(before) && Number.isFinite(after) && before !== after;
}

function relationshipsChanged(previous, current) {
  const before = new Set((previous?.relationships ?? []).map(r => \`\${(r.signal_ids ?? []).join('|')}::\${r.relationship_type}\`));
  return (current?.relationships ?? []).some(r => !before.has(\`\${(r.signal_ids ?? []).join('|')}::\${r.relationship_type}\`));
}

function dataQualityMateriallyChanged(previous, current) {
  const before = previous?.data_quality ?? {};
  const after = current?.data_quality ?? {};
  return stable(before.stale_sources) !== stable(after.stale_sources)
    || stable(before.failed_sources) !== stable(after.failed_sources);
}

/**
 * Decide whether the current landscape warrants a new AI assessment.
 *
 * This is deliberately deterministic. It does not interpret risk or rank signals.
 */
export function assessLandscapeChange(previous, current, { manualReassess = false } = {}) {
  if (!current || typeof current !== 'object') throw new TypeError('Current assessment context is required');

  const reasons = [];

  if (!previous) reasons.push('initial_load');
  if (manualReassess) reasons.push('manual_reassess');

  if (previous) {
    if (previous?.monitoring_scope?.geography !== current?.monitoring_scope?.geography) {
      reasons.push('geography_change');
    }

    if (stable(previous?.monitoring_scope?.domains) !== stable(current?.monitoring_scope?.domains)) {
      reasons.push('domain_change');
    }

    if (stable(previous?.monitoring_scope?.filters) !== stable(current?.monitoring_scope?.filters)) {
      reasons.push('material_filter_change');
    }

    const before = signalMap(previous);
    const after = signalMap(current);

    for (const [id, signal] of after) {
      if (!before.has(id) && isSignificant(signal)) {
        reasons.push('new_significant_signal');
        break;
      }
    }

    for (const [id, signal] of after) {
      const prior = before.get(id);
      if (!prior) continue;

      if (isEscalationOrDeescalation(prior, signal)) {
        reasons.push('escalation_or_deescalation');
        break;
      }

      if (signalMateriallyChanged(prior, signal)) {
        reasons.push('material_signal_change');
        break;
      }
    }

    if (relationshipsChanged(previous, current)) reasons.push('related_signals_emerge');

    if (dataQualityMateriallyChanged(previous, current)) reasons.push('evidence_quality_change');
  }

  return { reassess: reasons.length > 0, reasons: [...new Set(reasons)] };
}
