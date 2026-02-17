import { callClaude } from '../../shared/claude';
import { HSPOT_OPS_SYSTEM_PROMPT } from './system-prompt';

export async function hsWorkflow(question: string): Promise<string> {
  const result = await callClaude({
    agent: 'hspot-ops',
    taskType: 'workflow_help',
    systemPrompt: HSPOT_OPS_SYSTEM_PROMPT,
    userMessage: `Help with this HubSpot workflow question:\n\n${question}`,
    maxTokens: 2048,
  });
  return result.text;
}

export async function hsDebug(issue: string): Promise<string> {
  const result = await callClaude({
    agent: 'hspot-ops',
    taskType: 'debug',
    systemPrompt: HSPOT_OPS_SYSTEM_PROMPT,
    userMessage: `Debug this HubSpot issue:\n\n${issue}`,
    maxTokens: 2048,
  });
  return result.text;
}

export async function hsAsk(question: string): Promise<string> {
  const result = await callClaude({
    agent: 'hspot-ops',
    taskType: 'general_question',
    systemPrompt: HSPOT_OPS_SYSTEM_PROMPT,
    userMessage: question,
    maxTokens: 2048,
  });
  return result.text;
}
