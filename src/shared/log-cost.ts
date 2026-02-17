import { supabase } from '../supabase';
import { logger } from '../logger';

const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5-20250929': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.0 },
  'claude-opus-4-6': { input: 15.0, output: 75.0 },
};

export async function logCost(
  agent: string,
  taskType: string,
  tokensInput: number,
  tokensOutput: number,
  model = 'claude-sonnet-4-5-20250929'
): Promise<void> {
  const pricing = PRICING[model] ?? PRICING['claude-sonnet-4-5-20250929'];
  const cost = (tokensInput * pricing.input + tokensOutput * pricing.output) / 1_000_000;

  const { error } = await supabase.from('agent_cost_log').insert({
    agent, task_type: taskType,
    tokens_input: tokensInput, tokens_output: tokensOutput,
    model, estimated_cost_usd: cost,
  });
  if (error) logger.error('Failed to log cost', { error });
}
