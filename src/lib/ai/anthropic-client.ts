import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

// Solo validamos en runtime, no en build
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

/**
 * Sprint 1.6 V.L.A.E.G. — Hardening crítico:
 * (a) Reforço da instrução JSON no system prompt (no caller, opcional).
 * (b) Prefill assistant com `{` para forçar Claude a continuar com JSON válido.
 * (c) Strip defensivo de markdown/fences/texto extra antes do JSON.parse.
 * (d) Em caso de falha total, NÃO lançar exceção: logar texto cru e devolver fallback null.
 *     O caller (cada agente) decide aplicar getFallback(lang).
 */
export async function callAIStructured<T>(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 2000
): Promise<T> {
  const client = getAnthropicClient();

  // Prefill: forçamos o modelo a abrir com `{` para que continue produzindo JSON.
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '{' },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== 'text') {
    console.error('[callAIStructured] Unexpected response block type', block);
    return null as unknown as T;
  }

  // Anthropic devolve apenas a continuação após o prefill — prepend `{` manualmente.
  const raw = '{' + block.text;

  const cleaned = stripToJson(raw);

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('[callAIStructured] Failed to parse JSON. Returning null. raw=', raw, 'cleaned=', cleaned, 'err=', err);
    return null as unknown as T;
  }
}

/**
 * Recorta a string até obter (idealmente) JSON válido:
 *  - Remove fences ```json … ``` e ``` … ```.
 *  - Substring entre o primeiro `{` e o último `}` (ou `[` … `]`).
 *  - Trim defensivo.
 */
function stripToJson(text: string): string {
  let s = text.trim();

  // Remover fences markdown se vierem.
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    s = fenceMatch[1].trim();
  }

  // Recorte ao primeiro `{` … último `}` (objeto).
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1);
  } else {
    // Caso seja array.
    const firstBracket = s.indexOf('[');
    const lastBracket = s.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      s = s.slice(firstBracket, lastBracket + 1);
    }
  }

  return s.trim();
}

// Backward compatibility con imports tipo: import { anthropic } from '@/lib/ai/anthropic-client'
export function getAnthropic() {
  return getAnthropicClient();
}

// Proxy que actúa como cliente Anthropic
export const anthropicClient = new Proxy({} as Anthropic, {
  get(target, prop) {
    return Reflect.get(getAnthropicClient(), prop);
  }
});
