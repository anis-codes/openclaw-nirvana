import { callClaude } from '../../shared/claude';
import { SFDC_OPS_SYSTEM_PROMPT } from './system-prompt';

export async function sfQuery(question: string): Promise<string> {
  const result = await callClaude({
    agent: 'sfdc-ops',
    taskType: 'soql_query',
    systemPrompt: SFDC_OPS_SYSTEM_PROMPT,
    userMessage: `Generate a SOQL query for this request:\n\n${question}`,
    maxTokens: 1024,
  });
  return result.text;
}

export async function sfDebug(errorOrIssue: string): Promise<string> {
  const result = await callClaude({
    agent: 'sfdc-ops',
    taskType: 'debug',
    systemPrompt: SFDC_OPS_SYSTEM_PROMPT,
    userMessage: `Debug this Salesforce issue:\n\n${errorOrIssue}`,
    maxTokens: 2048,
  });
  return result.text;
}

export async function sfAsk(question: string): Promise<string> {
  const result = await callClaude({
    agent: 'sfdc-ops',
    taskType: 'general_question',
    systemPrompt: SFDC_OPS_SYSTEM_PROMPT,
    userMessage: question,
    maxTokens: 2048,
  });
  return result.text;
}
