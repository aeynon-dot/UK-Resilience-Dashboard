import crypto from 'node:crypto';

const VALID_STATUSES = new Set([
  'supported',
  'with_limitations',
  'insufficient_evidence',
  'unavailable'
]);
const MAX_ATTENTION_ITEMS = 5;
const RESERVED_FIELDS = new Set([
  'assessment_id',
  'generated_at',
  'landscape_snapshot_id'
]);

function requireProvider(provider) {
  if (!provider || typeof provider.assess !== 'function') {
    throw new TypeError('AI provider must expose assess(context, metadata)');
  }
}

function createAssessmentId() {
  return `AI-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${crypto.randomBytes(3).toString('hex')}`;
}

function invalid(message) {
  throw new TypeError(`AI provider returned invalid assessment: ${message}`);
}

function validateString(value, field) {
  if (typeof value !== 'string') invalid(`${field} must be a string`);
}

function validateStringArray(value, field) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    invalid(`${field} must be an array of strings`);
  }
}

const EVIDENCE_FIELDS = new Set([
  'title', 'description', 'domain', 'hazard', 'geography', 'severity',
  'priority_band', 'change_status', 'source', 'source_record_id',
  'source_native_status', 'authoritative_source_url', 'observed_at',
  'collected_at', 'evidence_confidence'
]);

function validateEvidenceClaims(claims, context) {
  if (!Array.isArray(claims) || claims.length === 0) {
    invalid('evidence_claims must be a non-empty array');
  }
  for (const claim of claims) {
    if (!claim || typeof claim !== 'object' || Array.isArray(claim)) {
      invalid('evidence claim must be an object');
    }
    const keys = Object.keys(claim);
    if (!['signal_id', 'field', 'value'].every(field => keys.includes(field))) {
      invalid('evidence claim requires signal_id, field and value');
    }
    if (keys.some(key => !['signal_id', 'field', 'value'].includes(key))) {
      invalid('unsupported evidence-claim fields');
    }
    validateString(claim.signal_id, 'evidence claim signal_id');
    validateString(claim.field, 'evidence claim field');
    validateString(claim.value, 'evidence claim value');
    if (!EVIDENCE_FIELDS.has(claim.field)) {
      invalid('unsupported evidence claim field: ' + claim.field);
    }
    const signal = (context.signals ?? []).find(item => item.signal_id === claim.signal_id);
    if (!signal) invalid('unknown evidence claim signal ID: ' + claim.signal_id);
    const actual = signal[claim.field];
    const normalised = Array.isArray(actual) ? actual.join(', ') : String(actual ?? '');
    if (normalised !== claim.value) {
      invalid('evidence claim does not match context: ' + claim.signal_id + '.' + claim.field);
    }
  }
}

function validateQuotedClaims(item, context) {
  const text = [item.title, item.assessment, item.rationale, ...item.uncertainty, ...item.investigation_areas].join(' ');
  const quoted = [
    ...text.matchAll(/“([^”]{4,})”/g),
    ...text.matchAll(/"([^"]{4,})"/g)
  ].map(match => match[1].trim());
  if (!quoted.length) return;
  const contextText = JSON.stringify(context.signals ?? []);
  for (const quote of quoted) {
    if (!contextText.includes(quote)) {
      invalid('quoted claim is not present in AssessmentContext: ' + quote);
    }
  }
}

function validateAttentionItems(items, context) {
  if (!Array.isArray(items)) invalid('attention_items must be an array');
  if (items.length > MAX_ATTENTION_ITEMS) invalid(`attention_items must contain at most ${MAX_ATTENTION_ITEMS} items`);

  const knownIds = new Set((context.signals ?? []).map(signal => signal.signal_id));
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) invalid('attention item must be an object');
    const required = ['title', 'assessment', 'supporting_signal_ids', 'evidence_claims', 'rationale', 'evidence_strength', 'uncertainty', 'investigation_areas'];
    for (const field of required) {
      if (!(field in item)) invalid(`attention item missing required field: ${field}`);
    }
    for (const field of ['title', 'assessment', 'rationale', 'evidence_strength']) {
      validateString(item[field], `attention item ${field}`);
    }
    validateStringArray(item.supporting_signal_ids, 'supporting_signal_ids');
    validateEvidenceClaims(item.evidence_claims, context);
    validateQuotedClaims(item, context);
    validateStringArray(item.uncertainty, 'uncertainty');
    validateStringArray(item.investigation_areas, 'investigation_areas');

    for (const signalId of item.supporting_signal_ids) {
      if (!knownIds.has(signalId)) invalid(`unknown supporting signal ID: ${signalId}`);
    }

    const forbidden = Object.keys(item).filter(key =>
      !required.includes(key)
    );
    if (forbidden.length) invalid(`unsupported attention-item fields: ${forbidden.join(', ')}`);
  }
}

function validateProviderOutput(result, context) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    invalid('result must be an object');
  }

  if (Object.keys(result).some(key => RESERVED_FIELDS.has(key))) {
    invalid('provider must not supply RM-owned provenance fields');
  }

  if (!VALID_STATUSES.has(result.assessment_status)) {
    invalid('invalid assessment_status');
  }

  const allowed = new Set([
    'assessment_status',
    'provider',
    'model',
    'prompt_version',
    'schema_version',
    'attention_items',
    'limitations',
    'usage'
  ]);
  const unexpected = Object.keys(result).filter(key => !allowed.has(key));
  if (unexpected.length) invalid(`unsupported top-level fields: ${unexpected.join(', ')}`);

  if ('limitations' in result) validateStringArray(result.limitations, 'limitations');

  if ('attention_items' in result) validateAttentionItems(result.attention_items, context);

  if (result.assessment_status === 'supported' || result.assessment_status === 'with_limitations') {
    if (!('attention_items' in result)) invalid('supported/limited assessment must contain attention_items');
  }

  if (result.assessment_status === 'insufficient_evidence' && 'attention_items' in result) {
    invalid('insufficient_evidence must not contain attention_items');
  }

  if (result.assessment_status === 'unavailable' && 'attention_items' in result) {
    invalid('unavailable assessment must not contain attention_items');
  }

  if ('usage' in result) {
    if (!result.usage || typeof result.usage !== 'object' || Array.isArray(result.usage)) invalid('usage must be an object');
    for (const field of ['input_tokens', 'output_tokens']) {
      if (field in result.usage && (!Number.isInteger(result.usage[field]) || result.usage[field] < 0)) {
        invalid(`usage.${field} must be a non-negative integer`);
      }
    }
    if ('estimated_cost' in result.usage &&
        (typeof result.usage.estimated_cost !== 'number' || !Number.isFinite(result.usage.estimated_cost) || result.usage.estimated_cost < 0)) {
      invalid('usage.estimated_cost must be a non-negative number');
    }
    const unexpectedUsage = Object.keys(result.usage).filter(key =>
      !['input_tokens', 'output_tokens', 'estimated_cost'].includes(key)
    );
    if (unexpectedUsage.length) invalid(`unsupported usage fields: ${unexpectedUsage.join(', ')}`);
  }

  for (const field of ['provider', 'model', 'prompt_version', 'schema_version']) {
    if (field in result) validateString(result[field], field);
  }

  return result;
}

export function createAssessmentGateway({ provider, clock = () => new Date() } = {}) {
  requireProvider(provider);
  return {
    async assess(context) {
      if (!context || typeof context !== 'object') throw new TypeError('Assessment context is required');
      const generatedAt = clock().toISOString();
      const metadata = {
        assessment_id: createAssessmentId(),
        landscape_snapshot_id: context.assessment_id,
        generated_at: generatedAt
      };

      try {
        const result = await provider.assess(context, metadata);
        if (!result || typeof result !== 'object') {
          return {
            assessment_status: 'unavailable',
            assessment_id: metadata.assessment_id,
            generated_at: generatedAt,
            landscape_snapshot_id: context.assessment_id,
            limitations: ['AI provider returned no structured assessment.']
          };
        }

        validateProviderOutput(result, context);

        return {
          ...result,
          assessment_id: metadata.assessment_id,
          generated_at: generatedAt,
          landscape_snapshot_id: context.assessment_id
        };
      } catch (error) {
        return {
          assessment_status: 'unavailable',
          assessment_id: metadata.assessment_id,
          generated_at: generatedAt,
          landscape_snapshot_id: context.assessment_id,
          limitations: ['AI assessment unavailable; RM evidence remains available.']
        };
      }
    }
  };
}

export { VALID_STATUSES, validateProviderOutput, MAX_ATTENTION_ITEMS };
