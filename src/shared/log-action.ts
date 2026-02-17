import { supabase } from '../supabase';
import { logger } from '../logger';

interface ActionLog {
  agent: string;
  action: string;
  inputSummary?: string;
  outputSummary?: string;
  tokensInput?: number;
  tokensOutput?: number;
  durationMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export async function logAction(log: ActionLog): Promise<void> {
  const { error } = await supabase.from('agent_logs').insert({
    agent: log.agent,
    action: log.action,
    input_summary: log.inputSummary,
    output_summary: log.outputSummary,
    tokens_input: log.tokensInput ?? 0,
    tokens_output: log.tokensOutput ?? 0,
    duration_ms: log.durationMs,
    error: log.error,
    metadata: log.metadata ?? {},
  });
  if (error) {
    logger.error('Failed to log action to Supabase', { error, log });
  }
}
