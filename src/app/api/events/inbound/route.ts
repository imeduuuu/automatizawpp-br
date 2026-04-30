import { NextRequest, NextResponse } from 'next/server';
import { runOrchestratorAgent } from '@/lib/agents/orchestrator';
import { runLeadResponseAgent } from '@/lib/agents/lead-response';
import { runQualificationAgent } from '@/lib/agents/qualification';
import { prisma } from '@/lib/db';
import { normalizeBirdEvent } from '@/lib/channels/bird-normalizer';
import { routeMessage } from '@/lib/channels/router';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Normalize payload from n8n/external providers
    const normalized = normalizeBirdEvent(body, process.env.BIRD_WORKSPACE_ID || 'default');
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Find or create lead
    let lead = await prisma.lead.findFirst({
      where: {
        workspaceId: normalized.workspaceId,
        OR: [
          { email: normalized.lead.email },
          { phone: normalized.lead.phone },
        ],
      },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          workspaceId: normalized.workspaceId,
          fullName: normalized.lead.fullName || 'Unknown',
          email: normalized.lead.email || `contact-${Date.now()}@unknown.local`,
          phone: normalized.lead.phone,
          source: normalized.lead.source,
          status: 'NEW',
          leadScoreValue: 0,
          intentLevel: 'LOW',
          urgencyLevel: 'LOW',
          buyingStage: 'AWARENESS',
        },
      });
    }

    // Store conversation
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: normalized.workspaceId,
        leadId: lead.id,
        channel: normalized.channel,
        subject: normalized.subject,
        threadRef: normalized.threadRef,
      },
    });

    // Store message
    await prisma.message.create({
      data: {
        leadId: lead.id,
        conversationId: conversation.id,
        channel: normalized.channel,
        direction: 'INBOUND',
        body: normalized.message,
        metadata: {
          ...normalized.metadata,
          messageId: normalized.messageId,
        },
      },
    });

    // Run orchestrator to decide action
    const decision = await runOrchestratorAgent({
      leadId: lead.id,
      message: normalized.message,
      channel: normalized.channel,
    });

    let agentResponse = '';

    if (decision.action === 'RESPOND') {
      agentResponse = await runLeadResponseAgent(lead.id, normalized.message);
    } else if (decision.action === 'QUALIFY') {
      const qualResult = await runQualificationAgent(lead.id, normalized.message);
      agentResponse = `Lead qualified: ${qualResult.score}/100 - ${qualResult.intent} intent`;
    } else if (decision.action === 'HOLD') {
      agentResponse = 'Action on hold due to compliance rules';
    }

    // Dispatch response back to lead via appropriate channel
    let delivery: { sent: boolean; messageId?: string } = { sent: false };
    if (agentResponse && decision.action !== 'HOLD') {
      const to = normalized.lead.email || normalized.lead.phone || '';
      if (to) {
        delivery = await routeMessage({
          channel: normalized.channel,
          to,
          subject: normalized.subject ? `Re: ${normalized.subject}` : 'Re: Tu consulta',
          body: agentResponse,
        });
      }
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      action: decision.action,
      response: agentResponse,
      delivery,
    });
  } catch (error) {
    console.error('Inbound event error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
