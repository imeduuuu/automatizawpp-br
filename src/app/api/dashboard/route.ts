import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';
import { LeadStatus, SubscriptionStatus } from '@prisma/client';

function toPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

interface DashboardMetrics {
  totalContacts: number;
  newContacts: number;
  qualifiedContacts: number;
  closedWonContacts: number;
  conversionRate: number;
  mrrTotal: number;
  callsToday: number;
  emailsToday: number;
  avgCallDuration: number;
  topStatus: { status: LeadStatus; count: number }[];
  recentContacts: Array<{
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    status: LeadStatus;
    createdAt: string;
  }>;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));

    const where = workspaceId ? { workspaceId } : {};

    const [
      leadStatusRows,
      totalLeads,
      mrrTotal,
      callsToday,
      emailsToday,
      avgCallDuration,
      recentContacts
    ] = await prisma.$transaction([
      prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: { _all: true }
      }),
      prisma.lead.count({ where }),
      prisma.subscription.aggregate({
        where: { ...where, status: SubscriptionStatus.ACTIVE },
        _sum: { mrr: true }
      }),
      prisma.callRecord.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.emailEvent.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.callRecord.aggregate({
        where,
        _avg: { durationSec: true }
      }),
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true
        }
      })
    ]);

    const statusCount = new Map<LeadStatus, number>();
    for (const row of leadStatusRows) {
      statusCount.set(row.status, row._count._all);
    }

    const newContacts = statusCount.get(LeadStatus.NEW) ?? 0;
    const qualifiedContacts =
      (statusCount.get(LeadStatus.QUALIFIED) ?? 0) +
      (statusCount.get(LeadStatus.PROPOSAL_SENT) ?? 0) +
      (statusCount.get(LeadStatus.NEGOTIATING) ?? 0);
    const closedWonContacts = statusCount.get(LeadStatus.CLOSED_WON) ?? 0;
    const conversionRate = toPercent(closedWonContacts, totalLeads);

    const topStatus = Array.from(statusCount.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const metrics: DashboardMetrics = {
      totalContacts: totalLeads,
      newContacts,
      qualifiedContacts,
      closedWonContacts,
      conversionRate,
      mrrTotal: mrrTotal._sum.mrr ?? 0,
      callsToday,
      emailsToday,
      avgCallDuration: Math.round(avgCallDuration._avg.durationSec ?? 0),
      topStatus,
      recentContacts: recentContacts.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString()
      }))
    };

    return NextResponse.json(metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
