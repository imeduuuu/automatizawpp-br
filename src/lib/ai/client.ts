import OpenAI from 'openai';

let cachedClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  cachedClient = new OpenAI({ apiKey, timeout: 60000, maxRetries: 3 });
  return cachedClient;
}

export const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export async function callAI(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 2000
): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  return content;
}

export async function callAIStructured<T>(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 2000
): Promise<T> {
  const content = await callAI(systemPrompt, userMessage, maxTokens);

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${content}`);
  }
}
