import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePublicToken } from '@/lib/public-auth';
import { LeadStatus } from '@prisma/client';

function toPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

export async function GET(request: NextRequest) {
  try {
    const hasToken = validatePublicToken(request);
    if (!hasToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const where = { workspaceId };

    const [leadStatusRows, totalLeads, callsToday, emailsToday, recentContacts] =
      await Promise.all([
        prisma.lead.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        prisma.lead.count({ where }),
        prisma.callRecord.count({
          where: {
            ...where,
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.emailEvent.count({
          where: {
            leadId: { not: undefined },
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.lead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, fullName: true, status: true, createdAt: true },
        }),
      ]);

    const statusCount = new Map<LeadStatus, number>();
    for (const row of leadStatusRows) {
      statusCount.set(row.status, row._count._all);
    }

    const newContacts = statusCount.get(LeadStatus.NEW) ?? 0;
    const qualifiedContacts =
      (statusCount.get(LeadStatus.QUALIFIED) ?? 0) +
      (statusCount.get(LeadStatus.PROPOSAL_SENT) ?? 0) +
      (statusCount.get(LeadStatus.NEGOTIATION) ?? 0);
    const closedWonContacts = statusCount.get(LeadStatus.CLOSED_WON) ?? 0;
    const conversionRate = toPercent(closedWonContacts, totalLeads);

    const data = {
      summary: {
        totalContacts: totalLeads,
        newContacts,
        qualifiedContacts,
        closedWonContacts,
        conversionRate,
        callsToday,
        emailsToday,
      },
      recentActivity: recentContacts.map(c => ({
        id: c.id,
        name: c.fullName,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
