import { callAIStructured } from '@/lib/ai/anthropic-client';
import { ORCHESTRATOR_PROMPT } from './prompts';
import { prisma } from '@/lib/db';
import { ChannelType } from '@prisma/client';

export type OrchestratorAction =
  | 'RESPOND'
  | 'QUALIFY'
  | 'HANDLE_OBJECTION'
  | 'CLOSE'
  | 'FOLLOW_UP'
  | 'ESCALATE'
  | 'HOLD';

export interface OrchestratorDecision {
  action: OrchestratorAction;
  reasoning: string;
  targetAgent: string;
  confidence: number;
}

interface OrchestratorInput {
  leadId: string;
  message: string;
  channel: ChannelType;
}

export async function runOrchestratorAgent(input: OrchestratorInput): Promise<OrchestratorDecision> {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    include: {
      memory: true,
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!lead) {
    throw new Error(`Lead ${input.leadId} not found`);
  }

  const complianceCheck = await checkCompliance(lead);
  if (!complianceCheck.allowed) {
    return {
      action: 'HOLD',
      reasoning: `Compliance check failed: ${complianceCheck.reason}`,
      targetAgent: 'compliance',
      confidence: 1.0,
    };
  }

  const contextMessage = buildOrchestratorContext({
    lead,
    incomingMessage: input.message,
    channel: input.channel,
  });

  const decision = await callAIStructured<OrchestratorDecision>(
    ORCHESTRATOR_PROMPT,
    contextMessage
  );

  const validActions: OrchestratorAction[] = [
    'RESPOND',
    'QUALIFY',
    'HANDLE_OBJECTION',
    'CLOSE',
    'FOLLOW_UP',
    'ESCALATE',
    'HOLD',
  ];

  if (!validActions.includes(decision.action)) {
    throw new Error(`Invalid action returned: ${decision.action}`);
  }

  return decision;
}

interface ComplianceResult {
  allowed: boolean;
  reason?: string;
}

async function checkCompliance(lead: { optOutAt: Date | null; id: string; conversations?: Record<string, unknown>[] }): Promise<ComplianceResult> {
  if (lead.optOutAt) {
    return {
      allowed: false,
      reason: 'Lead has opted out',
    };
  }

  const maxTouchesPerDay = parseInt(process.env.MAX_TOUCHES_PER_DAY || '5', 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const touchesToday = await prisma.conversation.count({
    where: {
      leadId: lead.id,
      createdAt: {
        gte: today,
      },
    },
  });

  if (touchesToday >= maxTouchesPerDay) {
    return {
      allowed: false,
      reason: `Max touches per day (${maxTouchesPerDay}) reached`,
    };
  }

  const quietHoursStart = parseInt(process.env.QUIET_HOURS_START || '21', 10);
  const quietHoursEnd = parseInt(process.env.QUIET_HOURS_END || '9', 10);
  const currentHour = new Date().getHours();

  const inQuietHours =
    quietHoursStart > quietHoursEnd
      ? currentHour >= quietHoursStart || currentHour < quietHoursEnd
      : currentHour >= quietHoursStart && currentHour < quietHoursEnd;

  if (inQuietHours) {
    return {
      allowed: false,
      reason: `Within quiet hours (${quietHoursStart}:00 - ${quietHoursEnd}:00)`,
    };
  }

  return { allowed: true };
}

interface ContextInput {
  lead: Record<string, unknown> & {
    id: string;
    status: string;
  };
  incomingMessage: string;
  channel: string;
}

function buildOrchestratorContext(input: ContextInput): string {
  const { lead, incomingMessage, channel } = input;

  const conversations = Array.isArray(lead.conversations) ? lead.conversations : [];
  const recentConversations = conversations
    .slice(0, 5)
    .map((c: Record<string, unknown>) => {
      const createdAt = c.createdAt || '';
      const ch = c.channel || '';
      const msg = c.body || '';
      return `[${createdAt}] ${ch}: ${msg}`;
    })
    .join('\n');

  return `
LEAD CONTEXT:
- ID: ${lead.id || 'unknown'}
- Name: ${lead.fullName || 'Unknown'}
- Email: ${lead.email || 'N/A'}
- Phone: ${lead.phone || 'N/A'}
- Score: ${lead.leadScoreValue || 0}/100
- Status: ${lead.status || 'unknown'}
- Intent: ${lead.intentLevel || 'unknown'}
- Urgency: ${lead.urgencyLevel || 'unknown'}
- Buying Stage: ${lead.buyingStage || 'awareness'}

LEAD MEMORY:
${lead.memory ? JSON.stringify(lead.memory, null, 2) : 'No memory yet'}

RECENT CONVERSATIONS:
${recentConversations || 'No conversations yet'}

INCOMING MESSAGE (${channel}):
"${incomingMessage}"

Based on this context, select the best next action for the AI to take.`;
}

import { SalesAgent, AgentContext } from '@/lib/agents/contracts';

export class OrchestratorAgent implements SalesAgent {
  name = 'ORCHESTRATOR' as const;

  async run(context: AgentContext) {
    const lead = context.lead;
    const message = context.message ?? '';

    const complianceState = context.complianceState ?? {
      dailyTouches: 0,
      maxTouchesPerDay: 5,
      optedOut: false,
      quietHours: false,
    };

    const compliance = !complianceState.optedOut && complianceState.dailyTouches < complianceState.maxTouchesPerDay && !complianceState.quietHours;

    if (!compliance) {
      return {
        agent: this.name,
        summary: 'Orchestrator action blocked by compliance check',
        payload: {
          action: 'HOLD',
          reasoning: 'Compliance rules prevent action',
          targetAgent: 'compliance',
          confidence: 1.0,
        },
      };
    }

    const contextMessage = `
LEAD CONTEXT:
- ID: ${lead.id}
- Name: ${lead.fullName}
- Email: ${lead.email}
- Phone: ${lead.phone}
- Score: ${lead.leadScoreValue}/100
- Status: ${lead.status}
- Intent: ${lead.intentLevel}
- Urgency: ${lead.urgencyLevel}
- Buying Stage: ${lead.buyingStage}

RECENT MESSAGES:
${(context.recentMessages || []).join('\n') || 'No recent messages'}

INCOMING MESSAGE:
"${message}"

Based on this context, select the best next action for the AI to take.`;

    const decision = await callAIStructured<OrchestratorDecision>(
      ORCHESTRATOR_PROMPT,
      contextMessage
    );

    return {
      agent: this.name,
      summary: `Orchestrator selected action: ${decision.action}`,
      payload: decision,
    };
  }
}
