import { callClaude } from '../../shared/claude';
import { UPWORK_SYSTEM_PROMPT } from './system-prompt';

export async function generateProposal(jobDescription: string): Promise<string> {
  const result = await callClaude({
    agent: 'upwork-bd',
    taskType: 'proposal_generation',
    systemPrompt: UPWORK_SYSTEM_PROMPT,
    userMessage: `Write a proposal for this Upwork job:\n\n${jobDescription}`,
    maxTokens: 1024,
  });
  return result.text;
}
