/**
 * Sprint 3.2 V.L.A.E.G. — Language Detector
 *
 * Detecta o idioma de uma mensagem inbound (PT-BR ou ES) com duas estratégias:
 *  1) Heurística rápida (sem LLM): conta marcadores específicos de cada idioma.
 *  2) Fallback LLM (Claude Haiku) quando heurística for ambígua.
 *
 * Usado pelo endpoint /api/events/inbound (Sprint 3.1) quando
 * `lead.preferredLanguage` está vazio. O caller é responsável por persistir
 * o resultado em `Lead.preferredLanguage` (NÃO chamamos prisma aqui).
 *
 * NOTA PARA O CALLER (route.ts inbound):
 *   - Se `lead.preferredLanguage` já existe, NÃO chamar `detectLanguage`.
 *   - Se vazio: const lang = await detectLanguage(message.content);
 *   - Persistir UMA vez:
 *       await prisma.lead.update({
 *         where: { id: leadId },
 *         data: { preferredLanguage: lang },
 *       });
 *   - Em chamadas seguintes, ler do `lead.preferredLanguage` (cache).
 */

import { callAI } from '@/lib/ai/anthropic-client';

// ──────────────────────────────────────────────────────────────────────────
// Marcadores por idioma
// ──────────────────────────────────────────────────────────────────────────

// Marcadores PT-BR — palavras/sufixos típicos.
// Estratégia: substring match em palavras "longas" (≥4 chars) que dificilmente
// aparecem como subcadeia em palavras espanholas. Para palavras curtas
// usamos token-bound (PT_BR_TOKEN_MATCH).
//
// Importante: palavras curtas ambíguas como "no", "me", "te" NÃO entram aqui
// porque existem nos dois idiomas. "ola" (sem acento) também NÃO entra
// porque é substring de "hola" (ES) e produziria falso positivo.
const PT_BR_MARKERS = [
  'você',
  'voce',
  'está',
  'não',
  'são',
  'obrigado',
  'obrigada',
  'gostaria',
  'preciso',
  'conhecer',
  'melhor',
  'quanto',
  'custa',
  'produto',
  'também',
  'tambem',
  'então',
  'entao',
  'fico',
  'olá',
];

// Sufixos PT-BR (substring match).
const PT_BR_SUFFIXES = ['ção', 'ções', 'ões', 'inho', 'inha'];

// Tokens PT-BR exatos (limite de palavra, não substring).
const PT_BR_TOKEN_MATCH = ['ola', 'mais', 'aqui', 'sobre'];

// Marcadores ES — palavras típicas (substring match em palavras longas).
const ES_MARKERS = [
  'usted',
  'gracias',
  'hola',
  'gustaría',
  'gustaria',
  'necesito',
  'conocer',
  'mejor',
  'cuánto',
  'cuanto',
  'cuesta',
  'también',
  'tambien',
  'aquí',
  'entonces',
  'producto',
  'español',
];

// Sufixos ES (substring match).
const ES_SUFFIXES = ['ción', 'ciones'];

// Tokens ES exatos (limite de palavra).
const ES_TOKEN_MATCH = ['más', 'mas', 'qué', 'que', 'tú', 'sobre'];

// ──────────────────────────────────────────────────────────────────────────
// Heurística rápida (sync)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Detecta idioma só com heurística (sem chamar LLM).
 *
 * Retorna:
 *  - 'pt-BR' se há clara maioria de marcadores PT-BR (≥3 e diferença ≥2).
 *  - 'es' se há clara maioria de marcadores ES (≥3 e diferença ≥2).
 *  - null se ambíguo, vazio ou poucos tokens.
 */
export function detectLanguageHeuristic(text: string): 'es' | 'pt-BR' | null {
  if (!text || typeof text !== 'string') return null;

  const normalized = text.toLowerCase().trim();
  if (normalized.length === 0) return null;

  // Tokeniza por espaços/pontuação para detectar palavras curtas com limite.
  const tokens = normalized.split(/[\s,.!?;:()"'¿¡]+/).filter(Boolean);
  const tokenSet = new Set(tokens);

  // Se muito curto, deixa o LLM decidir.
  if (tokens.length < 3) return null;

  let ptScore = 0;
  let esScore = 0;

  // Marcadores principais — substring match (cobre conjugações).
  for (const m of PT_BR_MARKERS) {
    if (normalized.includes(m)) ptScore++;
  }
  for (const m of ES_MARKERS) {
    if (normalized.includes(m)) esScore++;
  }

  // Sufixos — substring match.
  for (const s of PT_BR_SUFFIXES) {
    if (normalized.includes(s)) ptScore++;
  }
  for (const s of ES_SUFFIXES) {
    if (normalized.includes(s)) esScore++;
  }

  // Tokens exatos (limite de palavra) — evita substring inside.
  for (const w of PT_BR_TOKEN_MATCH) {
    if (tokenSet.has(w)) ptScore++;
  }
  for (const w of ES_TOKEN_MATCH) {
    if (tokenSet.has(w)) esScore++;
  }

  // Decisão: maioria clara (≥3 marcadores e diferença ≥2 sobre o oposto).
  if (ptScore >= 3 && ptScore - esScore >= 2) return 'pt-BR';
  if (esScore >= 3 && esScore - ptScore >= 2) return 'es';

  // Caso intermediário: se um lado tem ≥2 e o outro tem 0, aceita.
  if (ptScore >= 2 && esScore === 0) return 'pt-BR';
  if (esScore >= 2 && ptScore === 0) return 'es';

  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Detecção com LLM (Claude Haiku) — fallback
// ──────────────────────────────────────────────────────────────────────────

const LLM_TIMEOUT_MS = 5000;

const SYSTEM_PROMPT =
  'Você é um detector de idioma. Responda APENAS com "es" ou "pt-BR", sem nada mais.';

function buildUserPrompt(text: string): string {
  // Trunca para evitar prompts gigantes — 500 chars é suficiente.
  const truncated = text.length > 500 ? text.slice(0, 500) : text;
  return `Detecte o idioma da seguinte mensagem. Responda APENAS com "es" ou "pt-BR".\nMensagem: """${truncated}"""`;
}

/**
 * Roda callAI com timeout via AbortController/Promise.race.
 * `callAI` não aceita signal nativamente, mas envolvemos em race manual.
 */
async function callAIWithTimeout(
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number
): Promise<string | null> {
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    const result = await Promise.race([
      callAI(systemPrompt, userPrompt, 20),
      timeoutPromise,
    ]);
    return result;
  } catch (err) {
    console.error('[language-detector] callAI falhou:', err);
    return null;
  }
}

/**
 * Parser estrito da resposta do LLM. Aceita só "es" ou "pt-BR" (case-insensitive,
 * com possível pontuação ao redor). Qualquer outra coisa → null (caller usa default).
 */
function parseLLMResponse(raw: string | null): 'es' | 'pt-BR' | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase().replace(/[".,!?;:`]/g, '');
  if (cleaned === 'es' || cleaned === 'español' || cleaned === 'espanol') {
    return 'es';
  }
  if (cleaned === 'pt-br' || cleaned === 'pt' || cleaned === 'português' || cleaned === 'portugues') {
    return 'pt-BR';
  }
  // Se o modelo respondeu algo como "es." ou "El idioma es es", tenta achar.
  if (/\bpt-?br\b/.test(cleaned) || /\bportugu/.test(cleaned)) return 'pt-BR';
  if (/\bes\b/.test(cleaned) || /\bespa(n|ñ)ol\b/.test(cleaned)) return 'es';
  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Função principal (async)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Detecta idioma da mensagem. Estratégia:
 *   1) Heurística rápida → se decisiva, retorna.
 *   2) LLM (Claude Haiku) com timeout 5s → parse.
 *   3) Fallback final: 'es' (default da plataforma).
 *
 * NÃO acessa banco. O caller deve persistir em `Lead.preferredLanguage`.
 */
export async function detectLanguage(text: string): Promise<'es' | 'pt-BR'> {
  // Caso vazio/inválido → default.
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log('[language-detector] heuristic=empty', 'final=es');
    return 'es';
  }

  // 1) Heurística.
  const heuristic = detectLanguageHeuristic(text);
  if (heuristic) {
    console.log('[language-detector] heuristic=' + heuristic, 'final=' + heuristic);
    return heuristic;
  }

  // 2) LLM fallback.
  const raw = await callAIWithTimeout(SYSTEM_PROMPT, buildUserPrompt(text), LLM_TIMEOUT_MS);
  const parsed = parseLLMResponse(raw);

  if (parsed) {
    console.log('[language-detector] heuristic=null', 'llm_raw=' + JSON.stringify(raw), 'final=' + parsed);
    return parsed;
  }

  // 3) Fallback final.
  console.log('[language-detector] heuristic=null', 'llm_raw=' + JSON.stringify(raw), 'final=es (fallback)');
  return 'es';
}
