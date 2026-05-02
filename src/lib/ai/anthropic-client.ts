import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

// Only validate at runtime, not during build
let anthropicInstance: Anthropic | null = null;

function getAnthropicClient() {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({
      apiKey,
      timeout: 60000,
    });
  }
  return anthropicInstance;
}

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

export async function callAI(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 2000
): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage },
    ],
  });

  const block = response.content[0];
  if (block?.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic');
  }

  return block.text;
}

export async function callAIStructured<T>(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 2000
): Promise<T> {
  const content = await callAI(systemPrompt, userMessage, maxTokens);

  // Extract JSON from markdown code block or raw content
  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const clean = codeBlock ? codeBlock[1].trim() : content.trim();

  try {
    return JSON.parse(clean) as T;
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${content}`);
  }
}

// For backward compatibility with imports like: import { anthropic } from '@/lib/ai/anthropic-client'
export function getAnthropic() {
  return getAnthropicClient();
}

// Export a proxy that acts like the Anthropic client
export const anthropicClient = new Proxy({} as Anthropic, {
  get(target, prop) {
    return Reflect.get(getAnthropicClient(), prop);
  }
});
