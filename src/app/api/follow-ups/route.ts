import { NextResponse } from 'next/server';
import { LeadStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

const FOLLOW_UP_STATUSES: LeadStatus[] = ['CALL_ATTEMPTED', 'QUALIFIED', 'PROPOSAL_SENT', 'FOLLOW_UP'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));

    const leads = await prisma.lead.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        status: { in: FOLLOW_UP_STATUSES }
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        lastCallAt: true,
        lastEmailAt: true,
        nextActionAt: true,
        assignedTo: true,
        createdAt: true
      }
    });

    const sorted = leads.sort((a, b) => {
      const aTime = a.nextActionAt ? a.nextActionAt.getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.nextActionAt ? b.nextActionAt.getTime() : Number.POSITIVE_INFINITY;

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const followUps = sorted.map((lead) => ({
      id: lead.id,
      name: lead.fullName?.trim() || [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() || 'Lead sem nome',
      phone: lead.phone,
      status: lead.status,
      lastCallAt: lead.lastCallAt?.toISOString() ?? null,
      lastEmailAt: lead.lastEmailAt?.toISOString() ?? null,
      nextActionAt: lead.nextActionAt?.toISOString() ?? null,
      assignedTo: lead.assignedTo
    }));

    return NextResponse.json({ followUps, total: followUps.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
