import { getSkillsForAgent } from "./skill-loader";
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { logAction } from './log-action';
import { logCost } from './log-cost';
import { logger } from '../logger';

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

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
  const model = req.model ?? 'claude-sonnet-4-5-20250929';
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

    logger.info(`Claude call: ${req.agent}/${req.taskType}`, {
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
