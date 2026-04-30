import { callAI } from '@/lib/ai/anthropic-client';
import { LEAD_RESPONSE_PROMPT } from './prompts';
import { prisma } from '@/lib/db';

export async function runLeadResponseAgent(leadId: string, message: string): Promise<string> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const context = `Lead: ${lead.fullName} (${lead.email})\nMessage: "${message}"`;
  const response = await callAI(LEAD_RESPONSE_PROMPT, context);

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: 'CONTACTED' },
  });

  return response;
}
