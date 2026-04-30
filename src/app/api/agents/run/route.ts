import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { agentRegistry } from '@/lib/agents/registry';

const schema = z.object({
  agent: z.enum([
    'LEAD_RESPONSE',
    'QUALIFICATION',
    'MEMORY',
    'OBJECTION_HANDLER',
    'FOLLOW_UP',
    'CALL_ASSIST',
    'CLOSER',
    'SALES_QA',
    'WRITER'
  ]),
  workspaceId: z.string(),
  leadId: z.string(),
  objective: z.string(),
  message: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const agent = agentRegistry[parsed.data.agent];
    const result = await agent.run({
      workspaceId: parsed.data.workspaceId,
      objective: parsed.data.objective,
      message: parsed.data.message,
      lead: {
        id: lead.id,
        fullName: lead.fullName ?? 'Lead',
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
        lastContactAt: lead.lastContactAt?.toISOString() ?? null
      }
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
