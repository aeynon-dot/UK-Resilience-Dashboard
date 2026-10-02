import crypto from 'node:crypto';

const VALID_STATUSES = new Set([
  'supported',
  'with_limitations',
  'insufficient_evidence',
  'unavailable'
]);

function requireProvider(provider) {
  if (!provider || typeof provider.assess !== 'function') {
    throw new TypeError('AI provider must expose assess(context, metadata)');
  }
}

function createAssessmentId() {
  return `AI-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Provider-neutral gateway boundary.
 *
 * The provider receives only the bounded assessment context and gateway
 * metadata. Credentials and provider-specific configuration remain outside
 * this module.
 */
export function createAssessmentGateway({ provider, clock = () => new Date() } = {}) {
  requireProvider(provider);

  return {
    async assess(context) {
      if (!context || typeof context !== 'object') {
        throw new TypeError('Assessment context is required');
      }

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

        if (!VALID_STATUSES.has(result.assessment_status)) {
          throw new Error('AI provider returned an invalid assessment_status');
        }

        return {
          ...result,
          assessment_id: result.assessment_id ?? metadata.assessment_id,
          generated_at: result.generated_at ?? generatedAt,
          landscape_snapshot_id: result.landscape_snapshot_id ?? context.assessment_id
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

export { VALID_STATUSES };
