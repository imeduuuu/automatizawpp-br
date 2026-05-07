import OpenAI from 'openai';

// Cliente lazy — só instancia quando chamado, não no import.
// Evita crash de módulo quando OPENAI_API_KEY não está configurada.
let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }
    openaiInstance = new OpenAI({ apiKey, timeout: 60000, maxRetries: 3 });
  }
  return openaiInstance;
}

export const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export async function callAI(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 2000
): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
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
    throw new Error('Resposta vazia do OpenAI');
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
    throw new Error(`Falha ao fazer parse da resposta AI como JSON: ${content}`);
  }
}
