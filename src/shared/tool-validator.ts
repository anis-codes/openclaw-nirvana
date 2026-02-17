import { z } from 'zod';
import { logAction } from './log-action';
import { logger } from '../logger';

export const schemas = {
  salesforce_query: z.object({
    records: z.array(z.object({
      Id: z.string().length(18),
      attributes: z.object({ type: z.string() }),
    }).passthrough()),
    totalSize: z.number().nonnegative(),
    done: z.boolean(),
  }),

  hubspot_contacts: z.object({
    results: z.array(z.object({
      id: z.string(),
      properties: z.record(z.string(), z.unknown()),
    })),
  }),

  upwork_rss_item: z.object({
    title: z.string().min(1),
    link: z.string().url(),
    description: z.string(),
  }),
};

type SchemaKey = keyof typeof schemas;

interface ValidationResult {
  valid: boolean;
  data?: unknown;
  errors?: string[];
}

export async function validateToolResponse(
  source: SchemaKey,
  response: unknown
): Promise<ValidationResult> {
  const schema = schemas[source];
  const result = schema.safeParse(response);

  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
    logger.warn('Tool validation failed', { source, errors });
    await logAction({
      agent: 'system', action: 'validation_failure',
      error: errors.join('; '),
      metadata: { source, errorCount: errors.length },
    });
    return { valid: false, errors };
  }
  return { valid: true, data: result.data };
}
