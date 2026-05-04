import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { getPrompt, Language, resolveLanguage } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

/**
 * Fallback bilingue. Sprint 1.2 V.L.A.E.G.
 */
function getFallback(context: AgentContext, lang: Language) {
  const isHigh = context.lead.intentLevel === 'HIGH';
  return {
    scoreDelta: isHigh ? 12 : 5,
    statusRecommendation: isHigh ? 'SALES_READY' : 'QUALIFYING',
    evidence: [
      lang === 'pt-BR'
        ? 'A conversa indica interesse ativo.'
        : 'La conversación indica interés activo.',
    ],
    nextQuestion:
      lang === 'pt-BR'
        ? 'Além de você, quem mais participa da decisão final?'
        : '¿Además de ti, quién más participa en la decisión final?',
  };
}

/**
 * Sprint 3.4 V.L.A.E.G. — Deuda #5.
 * Normaliza payload para garantir `message: string` não vazia.
 * Como qualification não gera resposta direta ao lead, usamos `nextQuestion`
 * como fonte canônica do `message` (a próxima pergunta É a mensagem que
 * o orquestrador eventualmente envia). Mantém `nextQuestion` para compat.
 */
function normalizePayload(
  raw: Record<string, unknown> | null | undefined,
  fallback: ReturnType<typeof getFallback>,
): Record<string, unknown> {
  const source = raw && typeof raw === 'object' ? raw : {};

  const candidate =
    (typeof source.message === 'string' && source.message.trim() !== '' && source.message) ||
    (typeof (source as Record<string, unknown>).nextQuestion === 'string' &&
      ((source as Record<string, unknown>).nextQuestion as string).trim() !== '' &&
      ((source as Record<string, unknown>).nextQuestion as string)) ||
    (typeof (source as Record<string, unknown>).response === 'string' &&
      ((source as Record<string, unknown>).response as string).trim() !== '' &&
      ((source as Record<string, unknown>).response as string)) ||
    fallback.nextQuestion;

  return {
    ...fallback,
    ...source,
    message: candidate,
  };
}

export class QualificationAgent implements SalesAgent {
  name = 'QUALIFICATION' as const;

  async run(context: AgentContext) {
    const lang: Language = resolveLanguage(context.lead.preferredLanguage ?? null);
    const systemPrompt = getPrompt('qualification', lang);

    const result = await runAgentPrompt(systemPrompt, context, 'QUALIFICATION');
    const fallback = getFallback(context, lang);
    const payload = normalizePayload(
      result.json as Record<string, unknown> | null,
      fallback,
    );

    return {
      agent: this.name,
      summary: 'Avaliação de qualificação concluída.',
      payload,
    };
  }
}
