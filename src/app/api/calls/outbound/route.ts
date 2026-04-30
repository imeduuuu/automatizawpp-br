import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { CallAssistAgent } from '@/lib/agents/call-agent';
import { createSalesCall } from '@/lib/calls/call-orchestrator';

const schema = z.object({
  workspaceId: z.string(),
  leadId: z.string(),
  objective: z.string().default('Close discovery call'),
  to: z.string()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const agent = new CallAssistAgent();
  const callPlan = await agent.run({
    workspaceId: parsed.data.workspaceId,
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
    },
    objective: parsed.data.objective
  });

  const script = JSON.stringify(callPlan.payload.scriptSections ?? callPlan.payload, null, 2);
  const callRecord = await createSalesCall(lead.workspaceId, parsed.data.leadId, parsed.data.to, script);

  return NextResponse.json({ callRecord, callPlan });
}
