import { addHours } from 'date-fns';
import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { AGENT_PROMPTS } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';
import { prisma } from '@/lib/db';

function extractEstimatedRevenue(summary?: string) {
  if (!summary) return null;
  const match = summary.match(/estimated missed revenue[:\s]+(\d+(?:[\.,]\d+)?)/i);
  if (!match) return null;
  return Number(match[1].replace(',', '.'));
}

export class FollowUpAgent implements SalesAgent {
  name = 'FOLLOW_UP' as const;

  async run(context: AgentContext) {
    const roiRevenue = extractEstimatedRevenue(context.memorySummary);

    if (roiRevenue && roiRevenue > 0) {
      const message = `Retomo el dato que vimos: el impacto potencial de oportunidades no atendidas ronda ${Math.round(roiRevenue).toLocaleString('pt-BR')}€. Si quieres, en 15 min te enseño un plan simple para recuperar una parte de forma conservadora.`;
      return {
        agent: this.name,
        summary: 'Follow-up generated reusing ROI insight.',
        payload: {
          channel: context.channel ?? 'WHATSAPP',
          sendAt: addHours(new Date(), 18).toISOString(),
          message,
          rationale: 'ROI reminder in business-advisor tone.',
          complianceCheck: 'pass',
          roiMode: true
        }
      };
    }

    const result = await runAgentPrompt(AGENT_PROMPTS.FOLLOW_UP, context, 'FOLLOW_UP');
    const fallback = {
      channel: context.channel ?? 'WHATSAPP',
      sendAt: addHours(new Date(), context.lead.intentLevel === 'HIGH' ? 6 : 24).toISOString(),
      message:
        'Quick follow-up: based on your goals, I can map a concrete 30-day plan. Want me to send a short proposal with expected outcomes?',
      rationale: 'Persistent but value-first follow-up strategy.',
      complianceCheck: 'pass'
    };

    return {
      agent: this.name,
      summary: 'Follow-up task recommendation generated.',
      payload: (result.json as Record<string, unknown>) ?? fallback
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- _attemptCount faz parte do contrato chamado por followup/runner.ts (passa task.attempt) e será usado quando a lógica diferenciar mensagens por tentativa.
export async function runFollowUpAgent(leadId: string, _attemptCount: number): Promise<string | null> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { conversations: { take: 1, orderBy: { updatedAt: 'desc' } } }
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
        qualificationScore: lead.leadScoreValue
      },
      objective: 'Follow up with lead to maintain engagement and move toward conversion',
      channel: lead.conversations[0]?.channel ?? 'EMAIL',
      memorySummary: '',
      complianceState: {
        dailyTouches: 0,
        maxTouchesPerDay: 5,
        optedOut: false,
        quietHours: false
      }
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
