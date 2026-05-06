import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { OrchestratorAgent } from '@/lib/agents/orchestrator';
import { LeadResponseAgent } from '@/lib/agents/lead-response-agent';
import { QualificationAgent } from '@/lib/agents/qualification-agent';
import { ObjectionHandlingAgent } from '@/lib/agents/objection-agent';
import { CloserAgent } from '@/lib/agents/closer-agent';
import { getLeadMemorySummary, updateLeadMemory } from '@/lib/memory/memory-service';
import { scheduleFollowUp } from '@/lib/followup/sequence-engine';
import { OutboundDeliveryResult, sendOutboundMessage } from '@/lib/channels/router';
import { AgentContext, AgentExecutionResult } from '@/lib/agents/contracts';

const leadResponse = new LeadResponseAgent();
const qualification = new QualificationAgent();
const objectionHandler = new ObjectionHandlingAgent();
const closer = new CloserAgent();

const orchestrator = new OrchestratorAgent();

function toOptionalNumber(value: unknown) {
  if (typeof value !== 'number') return undefined;
  return Number.isFinite(value) ? value : undefined;
}

function getChannelMessage(payload: Record<string, unknown> | undefined, channel: string, fallback: string) {
  const variants = payload?.channelVariants;
  if (!variants || typeof variants !== 'object') return fallback.trim();

  const value = (variants as Record<string, unknown>)[channel];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback.trim();
}

function formatReplySubject(subject?: string) {
  const normalized = subject?.trim();
  if (!normalized) return 'AutomatizaWPP';
  return /^(re|aw|fwd):/i.test(normalized) ? normalized : `Re: ${normalized}`;
}

function extractEmailDraft(draft: string, fallbackSubject?: string) {
  const normalized = draft.replace(/\r\n/g, '\n').trim();
  const match = normalized.match(/^Subject:\s*(.+)\n+([\s\S]*)$/i);
  if (!match) {
    return {
      subject: formatReplySubject(fallbackSubject),
      body: normalized
    };
  }

  return {
    subject: match[1].trim() || formatReplySubject(fallbackSubject),
    body: match[2].trim() || normalized
  };
}

function getOutboundRecipient(lead: { id: string; email: string | null; phone: string | null }, channel: string) {
  switch (channel) {
    case 'EMAIL':
      return lead.email ?? null;
    case 'SMS':
    case 'WHATSAPP':
    case 'VOICE':
      return lead.phone ?? lead.email ?? null;
    default:
      return lead.email ?? lead.phone ?? lead.id;
  }
}

function toReceivedAt(value: string | number | undefined) {
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

function buildInboundMetadata(messageId?: string, metadata?: Record<string, unknown>) {
  const merged = {
    ...(metadata ?? {}),
    ...(messageId ? { messageId } : {})
  };

  return Object.keys(merged).length > 0 ? (merged as Prisma.InputJsonValue) : undefined;
}

function buildOutboundMetadata(delivery: OutboundDeliveryResult, subject?: string) {
  const metadata = {
    ...(delivery.messageId ? { messageId: delivery.messageId } : {}),
    ...(subject ? { subject } : {}),
    sent: delivery.sent
  };

  return metadata as Prisma.InputJsonValue;
}

export async function runSalesOrchestration(input: {
  workspaceId: string;
  leadId: string;
  message: string;
  channel: 'WEB_CHAT' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'INSTAGRAM_DM' | 'FACEBOOK_MESSENGER' | 'VOICE' | 'INTERNAL';
  subject?: string;
  threadRef?: string;
  messageId?: string;
  receivedAt?: string | number;
  metadata?: Record<string, unknown>;
}) {
  const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
  if (!lead) {
    throw new Error(`Lead ${input.leadId} not found`);
  }

  const receivedAt = toReceivedAt(input.receivedAt) ?? new Date();
  const conversationId = await ensureConversation(input.workspaceId, input.leadId, input.channel, {
    subject: input.subject,
    threadRef: input.threadRef,
    touchedAt: receivedAt
  });

  await prisma.message.create({
    data: {
      leadId: input.leadId,
      conversationId,
      channel: input.channel,
      direction: 'INBOUND',
      body: input.message,
      buyingSignals: [],
      complianceFlags: [],
      metadata: buildInboundMetadata(input.messageId, input.metadata),
      receivedAt
    }
  });

  const memorySummary = await getLeadMemorySummary(input.leadId);
  const orchestration = await orchestrator.run({
    workspaceId: input.workspaceId,
    lead: {
      id: lead.id,
      fullName: lead.fullName ?? ([lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Unnamed lead'),
      company: lead.company,
      source: lead.source,
      productInterest: lead.productInterest,
      status: lead.status,
      leadScoreValue: lead.leadScoreValue,
      intentLevel: lead.intentLevel,
      urgencyLevel: lead.urgencyLevel,
      buyingStage: lead.buyingStage,
      closeProbability: lead.closeProbability,
      nextAction: lead.nextAction,
      lastContactAt: lead.lastContactAt?.toISOString() ?? null,
      preferredLanguage: (lead.preferredLanguage === 'es' || lead.preferredLanguage === 'pt-BR' ? lead.preferredLanguage : null),
    },
    objective: 'Handle inbound lead event',
    channel: input.channel,
    message: input.message,
    memorySummary: memorySummary ?? undefined,
    complianceState: {
      optedOut: Boolean(lead.optOutAt),
      dailyTouches: 0,
      maxTouchesPerDay: Number(process.env.MAX_TOUCHES_PER_DAY ?? '2'),
      quietHours: false
    }
  });

  // Dispatch specialized agent based on orchestrator decision
  const decision = orchestration.payload as Record<string, unknown>;
  const action = String(decision.action ?? 'RESPOND');

  const agentContext: AgentContext = {
    workspaceId: input.workspaceId,
    lead: {
      id: lead.id,
      fullName: lead.fullName ?? 'Lead',
      email: lead.email ?? undefined,
      phone: lead.phone ?? undefined,
      company: lead.company ?? undefined,
      source: lead.source,
      productInterest: lead.productInterest ?? undefined,
      status: lead.status,
      leadScoreValue: lead.leadScoreValue ?? 0,
      intentLevel: lead.intentLevel ?? 'MEDIUM',
      urgencyLevel: lead.urgencyLevel ?? 'MEDIUM',
      buyingStage: lead.buyingStage ?? 'AWARENESS',
      closeProbability: lead.closeProbability ?? 0.5,
      assignedTo: undefined,
      qualificationScore: lead.leadScoreValue,
      preferredLanguage: (lead.preferredLanguage === 'es' || lead.preferredLanguage === 'pt-BR' ? lead.preferredLanguage : null),
    },
    objective: action,
    channel: input.channel,
    message: input.message,
    memorySummary: memorySummary ?? undefined,
    complianceState: {
      optedOut: Boolean(lead.optOutAt),
      dailyTouches: 0,
      maxTouchesPerDay: Number(process.env.MAX_TOUCHES_PER_DAY ?? '2'),
      quietHours: false
    }
  };

  let specialistResult: AgentExecutionResult = orchestration;
  try {
    if (action === 'QUALIFY' || action === 'RESPOND') {
      specialistResult = await leadResponse.run(agentContext);
    } else if (action === 'HANDLE_OBJECTION') {
      specialistResult = await objectionHandler.run(agentContext);
    } else if (action === 'CLOSE') {
      specialistResult = await closer.run(agentContext);
    } else if (action === 'SCORE') {
      await qualification.run(agentContext);
      specialistResult = await leadResponse.run(agentContext);
    }
  } catch (err) {
    console.error('[SalesEngine] Specialist agent failed:', err);
  }

  const agentRun = await prisma.agentRun.create({
    data: {
      workspaceId: input.workspaceId,
      leadId: input.leadId,
      agent: orchestration.agent,
      status: 'COMPLETED',
      inputPayload: input as Prisma.InputJsonValue,
      outputPayload: orchestration as unknown as Prisma.InputJsonValue,
      startedAt: new Date(),
      endedAt: new Date()
    }
  });

  await prisma.agentTask.create({
    data: {
      agentRunId: agentRun.id,
      agent: orchestration.agent,
      action: orchestration.summary,
      status: 'COMPLETED',
      inputPayload: input as Prisma.InputJsonValue,
      outputPayload: orchestration.payload as Prisma.InputJsonValue
    }
  });

  const agentPayload = specialistResult.payload as Record<string, unknown>;
  const finalMessage = String(agentPayload?.message ?? agentPayload?.response ?? '');
  const channelMessage = getChannelMessage(agentPayload, input.channel, finalMessage);

  const roiPayload = agentPayload?.roiSummary as Record<string, unknown> | undefined;

  let delivery: OutboundDeliveryResult | null = null;

  if (channelMessage) {
    const recipient = getOutboundRecipient(lead, input.channel);
    let outboundBody = channelMessage;
    let outboundSubject: string | undefined;

    if (input.channel === 'EMAIL') {
      const draft = extractEmailDraft(channelMessage, input.subject);
      outboundBody = draft.body;
      outboundSubject = draft.subject;
    }

    delivery = recipient
      ? await sendOutboundMessage({
          channel: input.channel,
          to: recipient,
          body: outboundBody,
          subject: outboundSubject
        })
      : { sent: false };

    await prisma.message.create({
      data: {
        leadId: input.leadId,
        conversationId,
        channel: input.channel,
        direction: 'OUTBOUND',
        body: outboundBody,
        buyingSignals: [],
        complianceFlags: [],
        metadata: buildOutboundMetadata(delivery, outboundSubject),
        sentAt: delivery.sent ? new Date() : undefined
      }
    });
  }

  await updateLeadMemory({
    leadId: input.leadId,
    lastTouchpointSummary: `Last inbound: ${input.message.slice(0, 160)}`,
    leadVolumePeriod: toOptionalNumber(roiPayload?.leadVolumePeriod),
    missedFollowupPct: toOptionalNumber(roiPayload?.missedFollowupPct),
    avgDealValue: toOptionalNumber(roiPayload?.avgDealValue),
    estimatedMissedRevenue: toOptionalNumber(roiPayload?.estimatedMissedRevenue),
    estimatedRecoveryLow: toOptionalNumber(roiPayload?.estimatedRecoveryLow),
    estimatedRecoveryHigh: toOptionalNumber(roiPayload?.estimatedRecoveryHigh),
    roiSummary: roiPayload ? JSON.stringify(roiPayload) : undefined
  });

  await scheduleFollowUp(
    {
      leadId: input.leadId,
      intentLevel: lead.intentLevel,
      urgencyLevel: lead.urgencyLevel,
      stalledHours: 24,
      optedOut: Boolean(lead.optOutAt)
    },
    input.channel,
    'Automated persistence after inbound conversation',
    { action: agentPayload?.action }
  );

  return {
    agent: orchestration.agent,
    summary: orchestration.summary,
    payload: orchestration.payload,
    delivery
  };
}

async function ensureConversation(
  workspaceId: string,
  leadId: string,
  channel: string,
  options: { subject?: string; threadRef?: string; touchedAt?: Date } = {}
) {
  const existing = await prisma.conversation.findFirst({
    where: { workspaceId, leadId, channel: channel as never, isClosed: false },
    orderBy: { updatedAt: 'desc' }
  });

  if (existing) {
    if (options.subject || options.threadRef || options.touchedAt) {
      await prisma.conversation.update({
        where: { id: existing.id },
        data: {
          subject: options.subject ?? existing.subject,
          threadRef: options.threadRef ?? existing.threadRef,
          lastMessageAt: options.touchedAt ?? existing.lastMessageAt
        }
      });
    }

    return existing.id;
  }

  const created = await prisma.conversation.create({
    data: {
      workspaceId,
      leadId,
      channel: channel as never,
      subject: options.subject,
      threadRef: options.threadRef,
      lastMessageAt: options.touchedAt
    }
  });

  return created.id;
}
