import { addHours } from 'date-fns';
import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { getPrompt, Language, resolveLanguage } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';
import { prisma } from '@/lib/db';

function extractEstimatedRevenue(summary?: string) {
  if (!summary) return null;
  const match = summary.match(/estimated missed revenue[:\s]+(\d+(?:[\.,]\d+)?)/i);
  if (!match) return null;
  return Number(match[1].replace(',', '.'));
}

/**
 * Fallback bilingue. Sprint 1.2 V.L.A.E.G.
 */
function getFallback(context: AgentContext, lang: Language) {
  const sendAt = addHours(new Date(), context.lead.intentLevel === 'HIGH' ? 6 : 24).toISOString();
  if (lang === 'pt-BR') {
    return {
      channel: context.channel ?? 'WHATSAPP',
      sendAt,
      message:
        'Follow-up rápido: com base nos seus objetivos, posso desenhar um plano concreto de 30 dias. Quer que eu te envie uma proposta curta com os resultados esperados?',
      rationale: 'Follow-up persistente, mas focado em valor.',
      complianceCheck: 'pass',
    };
  }
  return {
    channel: context.channel ?? 'WHATSAPP',
    sendAt,
    message:
      'Seguimiento rápido: en base a tus objetivos, puedo diseñar un plan concreto de 30 días. ¿Quieres que te envíe una propuesta corta con los resultados esperados?',
    rationale: 'Follow-up persistente pero enfocado en valor.',
    complianceCheck: 'pass',
  };
}

/**
 * Sprint 3.4 V.L.A.E.G. — Deuda #5.
 * Normaliza payload do follow-up garantindo `message: string` não vazia.
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

/**
 * Mensagem ROI bilingue (substitui o texto ES hardcoded anterior).
 */
function buildRoiReminderMessage(roiRevenue: number, lang: Language): string {
  const formatted = Math.round(roiRevenue).toLocaleString('pt-BR');
  if (lang === 'pt-BR') {
    return `Retomando o dado que vimos: o impacto potencial de oportunidades não atendidas gira em torno de ${formatted}€. Se quiser, em 15 min te mostro um plano simples para recuperar parte de forma conservadora.`;
  }
  return `Retomo el dato que vimos: el impacto potencial de oportunidades no atendidas ronda ${formatted}€. Si quieres, en 15 min te enseño un plan simple para recuperar una parte de forma conservadora.`;
}

export class FollowUpAgent implements SalesAgent {
  name = 'FOLLOW_UP' as const;

  async run(context: AgentContext) {
    const lang: Language = resolveLanguage(context.lead.preferredLanguage ?? null);
    const roiRevenue = extractEstimatedRevenue(context.memorySummary);

    if (roiRevenue && roiRevenue > 0) {
      const message = buildRoiReminderMessage(roiRevenue, lang);
      return {
        agent: this.name,
        summary: 'Follow-up gerado reutilizando insight de ROI.',
        payload: {
          channel: context.channel ?? 'WHATSAPP',
          sendAt: addHours(new Date(), 18).toISOString(),
          message,
          rationale: 'Lembrete de ROI em tom consultivo.',
          complianceCheck: 'pass',
          roiMode: true,
        },
      };
    }

    const systemPrompt = getPrompt('followUp', lang);
    const result = await runAgentPrompt(systemPrompt, context, 'FOLLOW_UP');
    const fallback = getFallback(context, lang);
    const payload = normalizePayload(
      result.json as Record<string, unknown> | null,
      fallback,
    );

    return {
      agent: this.name,
      summary: 'Recomendação de tarefa de follow-up gerada.',
      payload,
    };
  }
}

export async function runFollowUpAgent(leadId: string, _attemptCount: number): Promise<string | null> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { conversations: { take: 1, orderBy: { updatedAt: 'desc' } } },
    });

    if (!lead) {
      console.warn(`Lead ${leadId} not found`);
      return null;
    }

    const context: AgentContext = {
      workspaceId: lead.workspaceId ?? '',
      lead: {
        id: lead.id,
        fullName: lead.fullName ?? 'Lead',
        email: lead.email ?? undefined,
        phone: lead.phone ?? undefined,
        company: lead.company ?? undefined,
        source: lead.source,
        productInterest: undefined,
        status: lead.status,
        leadScoreValue: lead.leadScoreValue ?? 0,
        intentLevel: (lead.leadScoreValue ?? 0) > 70 ? 'HIGH' : 'MEDIUM',
        urgencyLevel: 'MEDIUM',
        buyingStage: 'AWARENESS',
        closeProbability: 0.5,
        assignedTo: undefined,
        qualificationScore: lead.leadScoreValue,
        // Sprint 1.2: pasamos preferredLanguage del lead Prisma al AgentContext.
        preferredLanguage: (lead.preferredLanguage === 'pt-BR' ? 'pt-BR' : 'es') as 'es' | 'pt-BR',
      },
      objective: 'Follow up with lead to maintain engagement and move toward conversion',
      channel: lead.conversations[0]?.channel ?? 'EMAIL',
      memorySummary: '',
      complianceState: {
        dailyTouches: 0,
        maxTouchesPerDay: 5,
        optedOut: false,
        quietHours: false,
      },
    };

    const agent = new FollowUpAgent();
    const result = await agent.run(context);

    const payload = result.payload as Record<string, unknown>;
    return (payload.message as string) ?? null;
  } catch (error) {
    console.error(`Error running follow-up agent for lead ${leadId}:`, error);
    return null;
  }
}
