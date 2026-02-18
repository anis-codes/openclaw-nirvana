import { getSkillsForAgent } from './skill-loader';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { logAction } from './log-action';
import { logCost } from './log-cost';
import { logger } from '../logger';

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

// Dynamic LLM routing: match task complexity to model cost
const MODELS = {
  haiku:  'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20250929',
  opus:   'claude-opus-4-6',
} as const;

// Task type -> model tier mapping
const TASK_ROUTING: Record<string, keyof typeof MODELS> = {
  // Haiku: simple lookups, quick generations (~90% cheaper)
  soql_query:        'haiku',
  general_question:  'haiku',
  content_ideas:     'haiku',
  market_analysis:   'haiku',

  // Sonnet: quality writing, workflows, proposals (default)
  proposal_generation: 'sonnet',
  workflow_help:       'sonnet',
  linkedin_post:       'sonnet',
  blog_post:           'sonnet',
  draft_message:       'sonnet',
  prioritize:          'sonnet',
  trade_idea:          'sonnet',
  general_assist:      'sonnet',

  // Opus: complex debugging, architecture decisions
  debug:             'opus',
};

function getModelForTask(taskType: string, explicitModel?: string): string {
  if (explicitModel) return explicitModel;
  const tier = TASK_ROUTING[taskType] ?? 'sonnet';
  return MODELS[tier];
}

interface ClaudeRequest {
  agent: string;
  taskType: string;
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
}

interface ClaudeResponse {
  text: string;
  tokensInput: number;
  tokensOutput: number;
}

export async function callClaude(req: ClaudeRequest): Promise<ClaudeResponse> {
  const model = getModelForTask(req.taskType, req.model);
  const start = Date.now();

  try {
    const response = await client.messages.create({
      model,
      max_tokens: req.maxTokens ?? 2048,
      system: req.systemPrompt + getSkillsForAgent(req.agent),
      messages: [{ role: 'user', content: req.userMessage }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');
    const tokIn = response.usage.input_tokens;
    const tokOut = response.usage.output_tokens;
    const duration = Date.now() - start;

    await logAction({
      agent: req.agent, action: req.taskType,
      inputSummary: req.userMessage.slice(0, 200),
      outputSummary: text.slice(0, 200),
      tokensInput: tokIn, tokensOutput: tokOut,
      durationMs: duration,
    });

    await logCost(req.agent, req.taskType, tokIn, tokOut, model);

    logger.info(`Claude call: ${req.agent}/${req.taskType} [${model.split('-').slice(1, 2)}]`, {
      tokens: { input: tokIn, output: tokOut }, duration,
    });

    return { text, tokensInput: tokIn, tokensOutput: tokOut };
  } catch (err) {
    await logAction({
      agent: req.agent, action: req.taskType,
      error: String(err), durationMs: Date.now() - start,
    });
    throw err;
  }
}
