import { NextResponse } from 'next/server';
import { LeadStatus, SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

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
  topStatus: Array<{ status: string; count: number }>;
  recentContacts: Array<{
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    status: LeadStatus;
    createdAt: string;
  }>;
}

function toPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(1));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));

    const where = workspaceId ? { workspaceId } : {};

    const totalLeads = await prisma.lead.count({ where });
    const mrrTotal = await prisma.subscription.aggregate({
      where: { ...where, status: SubscriptionStatus.ACTIVE },
      _sum: { mrr: true }
    });
    const callsToday = await prisma.callRecord.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    const emailsToday = await prisma.emailEvent.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    const avgCallDuration = await prisma.callRecord.aggregate({
      where,
      _avg: { durationSec: true }
    });
    const recentContacts = await prisma.lead.findMany({
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
    });

    // Get status breakdown
    const leads = await prisma.lead.findMany({
      where,
      select: { status: true }
    });

    const statusCount = new Map<string, number>();
    for (const lead of leads) {
      const current = statusCount.get(lead.status) || 0;
      statusCount.set(lead.status, current + 1);
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
