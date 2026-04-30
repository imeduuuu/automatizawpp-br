import { prisma } from '@/lib/db';

type ResolveLeadInput = {
  workspaceId: string;
  leadId?: string;
  lead?: {
    fullName?: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    productInterest?: string;
  };
};

export async function resolveLead(input: ResolveLeadInput) {
  if (input.leadId) {
    const byId = await prisma.lead.findUnique({ where: { id: input.leadId } });
    if (byId) return byId;
  }

  if (input.lead?.email) {
    const byEmail = await prisma.lead.findFirst({
      where: {
        workspaceId: input.workspaceId,
        email: input.lead.email
      }
    });
    if (byEmail) return byEmail;
  }

  if (input.lead?.phone) {
    const byPhone = await prisma.lead.findFirst({
      where: {
        workspaceId: input.workspaceId,
        phone: input.lead.phone
      },
      orderBy: { updatedAt: 'desc' }
    });
    if (byPhone) return byPhone;
  }

  return prisma.lead.create({
    data: {
      workspaceId: input.workspaceId,
      fullName: input.lead?.fullName ?? 'New inbound lead',
      email: input.lead?.email,
      phone: input.lead?.phone,
      company: input.lead?.company,
      source: input.lead?.source ?? 'Inbound',
      productInterest: input.lead?.productInterest,
      status: 'NEW'
    }
  });
}
