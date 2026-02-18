import { callClaude } from '../../shared/claude';
import { CONTENT_ENGINE_SYSTEM_PROMPT } from './system-prompt';

export async function runContentPipeline(topic: string): Promise<{ ideas: string; post: string }> {
  // Step 1: Research trending angles
  const research = await callClaude({
    agent: 'content-engine',
    taskType: 'content_ideas',
    systemPrompt: CONTENT_ENGINE_SYSTEM_PROMPT,
    userMessage: `Research the top 3 LinkedIn content angles for this topic. For each, give: the hook (first line), why it works now, and the target audience.\n\nTopic: ${topic}`,
    maxTokens: 1024,
  });

  // Step 2: Write the best one
  const post = await callClaude({
    agent: 'content-engine',
    taskType: 'linkedin_post',
    systemPrompt: CONTENT_ENGINE_SYSTEM_PROMPT,
    userMessage: `Based on this research, write a LinkedIn post using the strongest angle.\n\nResearch:\n${research.text}\n\nRules: Hook in first line. Under 1300 characters. End with a question. No hashtags. No emojis.`,
    maxTokens: 1024,
  });

  return { ideas: research.text, post: post.text };
}
