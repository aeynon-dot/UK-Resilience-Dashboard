import { assessLandscapeChange } from './landscape-change-gate.mjs';

function validateAssessmentShape(result) {
  if (!result || typeof result !== 'object') {
    throw new TypeError('Assessment result must be an object');
  }
  const validStatuses = new Set(['supported', 'with_limitations', 'insufficient_evidence', 'unavailable']);
  if (!validStatuses.has(result.assessment_status)) {
    throw new TypeError('Assessment result has invalid assessment_status');
  }
  if (result.assessment_status === 'supported' || result.assessment_status === 'with_limitations') {
    if (!Array.isArray(result.attention_items) || result.attention_items.length > 5) {
      throw new TypeError('Supported assessment must contain at most 5 attention_items');
    }
  }
  return result;
}

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
