import { callClaude } from '../../shared/claude';
import { NIRVANA_PA_SYSTEM_PROMPT } from './system-prompt';

export async function paDraft(request: string): Promise<string> {
  const result = await callClaude({
    agent: 'nirvana-pa',
    taskType: 'draft_message',
    systemPrompt: NIRVANA_PA_SYSTEM_PROMPT,
    userMessage: `Draft this communication:\n\n${request}`,
    maxTokens: 2048,
  });
  return result.text;
}

export async function paPrioritize(context: string): Promise<string> {
  const result = await callClaude({
    agent: 'nirvana-pa',
    taskType: 'prioritize',
    systemPrompt: NIRVANA_PA_SYSTEM_PROMPT,
    userMessage: `Help me prioritize:\n\n${context}`,
    maxTokens: 2048,
  });
  return result.text;
}

export async function paAsk(question: string): Promise<string> {
  const result = await callClaude({
    agent: 'nirvana-pa',
    taskType: 'general_assist',
    systemPrompt: NIRVANA_PA_SYSTEM_PROMPT,
    userMessage: question,
    maxTokens: 2048,
  });
  return result.text;
}
