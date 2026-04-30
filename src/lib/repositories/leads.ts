import { LeadStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { LeadView } from '@/lib/types';

function mapLead(lead: {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  productInterest: string | null;
  status: LeadStatus;
  leadScoreValue: number;
  intentLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  buyingStage: 'AWARENESS' | 'DISCOVERY' | 'CONSIDERATION' | 'EVALUATION' | 'DECISION' | 'COMMITMENT';
  closeProbability: number;
  assignedTo: string | null;
  qualificationScore: number | null;
  nextAction: string | null;
  nextActionAt: Date | null;
  lastContactAt: Date | null;
  lastCallAt: Date | null;
  lastEmailAt: Date | null;
}): LeadView {
  return {
    id: lead.id,
    fullName: lead.fullName ?? ([lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Unnamed lead'),
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    productInterest: lead.productInterest,
    status: lead.status,
    leadScoreValue: lead.leadScoreValue,
    intentLevel: lead.intentLevel,
    urgencyLevel: lead.urgencyLevel,
    buyingStage: lead.buyingStage,
    closeProbability: lead.closeProbability,
    assignedTo: lead.assignedTo,
    qualificationScore: lead.qualificationScore,
    nextAction: lead.nextAction,
    nextActionAt: lead.nextActionAt?.toISOString() ?? null,
    lastContactAt: lead.lastContactAt?.toISOString() ?? null,
    lastCallAt: lead.lastCallAt?.toISOString() ?? null,
    lastEmailAt: lead.lastEmailAt?.toISOString() ?? null
  };
}

export async function listLeads(workspaceId?: string): Promise<LeadView[]> {
  try {
    const leads = await prisma.lead.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: [{ leadScoreValue: 'desc' }, { updatedAt: 'desc' }],
      take: 100
    });
    return leads.map(mapLead);
  } catch {
    return [];
  }
}

export async function getLeadById(leadId: string, workspaceId?: string): Promise<LeadView | null> {
  try {
    const lead = workspaceId
      ? await prisma.lead.findFirst({ where: { id: leadId, workspaceId } })
      : await prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      return null;
    }

    return mapLead(lead);
  } catch {
    return null;
  }
}
