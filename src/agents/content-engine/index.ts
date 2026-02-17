import { callClaude } from '../../shared/claude';
import { CONTENT_ENGINE_SYSTEM_PROMPT } from './system-prompt';

export async function ceLinkedIn(topic: string): Promise<string> {
  const result = await callClaude({
    agent: 'content-engine',
    taskType: 'linkedin_post',
    systemPrompt: CONTENT_ENGINE_SYSTEM_PROMPT,
    userMessage: `Write a LinkedIn post about:\n\n${topic}`,
    maxTokens: 1024,
  });
  return result.text;
}

export async function ceBlog(topic: string): Promise<string> {
  const result = await callClaude({
    agent: 'content-engine',
    taskType: 'blog_post',
    systemPrompt: CONTENT_ENGINE_SYSTEM_PROMPT,
    userMessage: `Write a blog post about:\n\n${topic}`,
    maxTokens: 4096,
  });
  return result.text;
}

export async function ceIdeas(context: string): Promise<string> {
  const result = await callClaude({
    agent: 'content-engine',
    taskType: 'content_ideas',
    systemPrompt: CONTENT_ENGINE_SYSTEM_PROMPT,
    userMessage: `Generate 5 content ideas based on:\n\n${context}`,
    maxTokens: 1024,
  });
  return result.text;
}
