import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { getPrompt, Language, resolveLanguage } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

/**
 * Fallback bilingue (PT-BR / ES). Sprint 1.2 V.L.A.E.G.
 * Default 'es' cuando preferredLanguage es null/undefined.
 */
function getFallback(context: AgentContext, lang: Language) {
  const name = context.lead.fullName.split(' ')[0] ?? (lang === 'pt-BR' ? 'tudo bem' : 'hola');
  const message =
    lang === 'pt-BR'
      ? `Olá ${name}, obrigado pelo contato. Para te orientar bem, qual é o resultado de vendas mais urgente que você quer alcançar nos próximos 30 dias?`
      : `Hola ${name}, gracias por escribirnos. Para guiarte bien, ¿cuál es el resultado de ventas más urgente que quieres alcanzar en los próximos 30 días?`;

  return {
    message,
    intentHypothesis: context.lead.intentLevel,
    confidence: 0.6,
    suggestedNextAgent: 'QUALIFICATION',
  };
}

/**
 * Sprint 3.4 V.L.A.E.G. — Deuda #5.
 * Garante que `payload.message` esteja sempre populado (string não vazia)
 * para o QA gate e o `routeMessage` em route.ts. Mantém aliases originais.
 */
function normalizePayload(
  raw: Record<string, unknown> | null | undefined,
  fallback: ReturnType<typeof getFallback>,
): Record<string, unknown> {
  const source = raw && typeof raw === 'object' ? raw : {};

  const candidate =
    (typeof source.message === 'string' && source.message.trim() !== '' && source.message) ||
    (typeof (source as Record<string, unknown>).response === 'string' &&
      ((source as Record<string, unknown>).response as string).trim() !== '' &&
      ((source as Record<string, unknown>).response as string)) ||
    (typeof (source as Record<string, unknown>).text === 'string' &&
      ((source as Record<string, unknown>).text as string).trim() !== '' &&
      ((source as Record<string, unknown>).text as string)) ||
    fallback.message;

  return {
    ...fallback,
    ...source,
    message: candidate,
  };
}

export class LeadResponseAgent implements SalesAgent {
  name = 'LEAD_RESPONSE' as const;

  async run(context: AgentContext) {
    const lang: Language = resolveLanguage(context.lead.preferredLanguage ?? null);
    const systemPrompt = getPrompt('leadResponse', lang);

    const result = await runAgentPrompt(systemPrompt, context, 'LEAD_RESPONSE');
    const fallback = getFallback(context, lang);
    const payload = normalizePayload(
      result.json as Record<string, unknown> | null,
      fallback,
    );

    return {
      agent: this.name,
      summary: 'Resposta ao lead inbound gerada.',
      payload,
    };
  }
}
