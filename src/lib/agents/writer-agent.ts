import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { getPrompt, Language, resolveLanguage } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

/**
 * Fallback bilingue. Sprint 1.2 V.L.A.E.G.
 */
function getFallback(context: AgentContext, lang: Language) {
  const finalMessage =
    context.message ??
    (lang === 'pt-BR'
      ? 'Pode me dizer qual sua prioridade principal? Assim adapto os próximos passos.'
      : '¿Puedes decirme cuál es tu prioridad principal? Así adapto los próximos pasos.');

  const subject = lang === 'pt-BR' ? 'Próximo passo rápido' : 'Próximo paso rápido';
  const subjectLabel = lang === 'pt-BR' ? 'Assunto' : 'Asunto';

  return {
    finalMessage,
    channelVariants: {
      WHATSAPP: context.message,
      EMAIL: `${subjectLabel}: ${subject}\n\n${context.message}`,
      SMS: context.message,
    },
    toneNotes: lang === 'pt-BR' ? 'Conciso e consultivo.' : 'Conciso y consultivo.',
  };
}

/**
 * Sprint 3.4 V.L.A.E.G. — Deuda #5.
 * Writer devolve `finalMessage` — normalizamos para `message` mantendo
 * `finalMessage` como alias.
 */
function normalizePayload(
  raw: Record<string, unknown> | null | undefined,
  fallback: ReturnType<typeof getFallback>,
): Record<string, unknown> {
  const source = raw && typeof raw === 'object' ? raw : {};

  const candidate =
    (typeof source.message === 'string' && source.message.trim() !== '' && source.message) ||
    (typeof (source as Record<string, unknown>).finalMessage === 'string' &&
      ((source as Record<string, unknown>).finalMessage as string).trim() !== '' &&
      ((source as Record<string, unknown>).finalMessage as string)) ||
    (typeof (source as Record<string, unknown>).text === 'string' &&
      ((source as Record<string, unknown>).text as string).trim() !== '' &&
      ((source as Record<string, unknown>).text as string)) ||
    fallback.finalMessage;

  return {
    ...fallback,
    ...source,
    message: candidate,
  };
}

export class WriterAgent implements SalesAgent {
  name = 'WRITER' as const;

  async run(context: AgentContext) {
    const lang: Language = resolveLanguage(context.lead.preferredLanguage ?? null);
    const systemPrompt = getPrompt('writer', lang);

    const result = await runAgentPrompt(systemPrompt, context, 'WRITER');
    const fallback = getFallback(context, lang);
    const payload = normalizePayload(
      result.json as Record<string, unknown> | null,
      fallback,
    );

    return {
      agent: this.name,
      summary: 'Mensagem polida para consistência de canal.',
      payload,
    };
  }
}
