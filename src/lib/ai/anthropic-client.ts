import Anthropic from '@anthropic-ai/sdk';

let cachedClient: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  cachedClient = new Anthropic({ apiKey, timeout: 60000 });
  return cachedClient;
}

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

export async function callAI(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 2000
): Promise<string> {
  const response = await getAnthropic().messages.create({
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

  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const clean = codeBlock ? codeBlock[1].trim() : content.trim();

  try {
    return JSON.parse(clean) as T;
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${content}`);
  }
}
