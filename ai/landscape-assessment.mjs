import { assessLandscapeChange } from './landscape-change-gate.mjs';

function validateAssessmentShape(result) {
  if (!result || typeof result !== 'object') {
    throw new TypeError('Assessment result must be an object');
  }
  if (result.assessment_status === 'supported' || result.assessment_status === 'with_limitations') {
    if (!Array.isArray(result.attention_items)) {
      throw new TypeError('Supported assessment must contain attention_items');
    }
    for (const item of result.attention_items) {
      for (const field of ['title', 'assessment', 'supporting_signal_ids', 'rationale', 'evidence_strength', 'uncertainty', 'investigation_areas']) {
        if (!(field in item)) throw new TypeError(`Attention item missing required field: ${field}`);
      }
    }
  }
  return result;
}

/**
 * Orchestrate deterministic landscape-change detection and the provider-neutral
 * assessment gateway. The gate decides whether to reassess; the AI provider
 * interprets the bounded snapshot but does not alter RM evidence.
 */
export async function assessLandscape({ previous = null, current, gateway, manualReassess = false } = {}) {
  if (!current || typeof current !== 'object') throw new TypeError('Current assessment context is required');
  if (!gateway || typeof gateway.assess !== 'function') throw new TypeError('Assessment gateway is required');

  const change = assessLandscapeChange(previous, current, { manualReassess });

  if (!change.reassess) {
    return {
      reassess: false,
      reasons: [],
      assessment: null,
      landscape_snapshot_id: current.assessment_id
    };
  }

  const assessment = validateAssessmentShape(await gateway.assess(current));

  return {
    reassess: true,
    reasons: change.reasons,
    assessment,
    landscape_snapshot_id: current.assessment_id
  };
}
