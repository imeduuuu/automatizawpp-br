import { LeadStatus, SubscriptionStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function toPercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return Number((0).toFixed(1));
  }
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function getLeadName(lead: { fullName: string | null; firstName: string | null; lastName: string | null }) {
  if (lead.fullName?.trim()) {
    return lead.fullName;
  }
  const fallback = [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim();
  return fallback || 'Lead sem nome';
}

export async function GET() {
  try {
    const [leadStatusRows, totalLeads, mrrTotal, mrrByPlan, callAttempts, emailEvents] = await Promise.all([
      prisma.lead.groupBy({
        by: ['status'],
        orderBy: { status: 'asc' },
        _count: { _all: true }
      }),
      prisma.lead.count(),
      prisma.subscription.aggregate({
        where: { status: SubscriptionStatus.ACTIVE },
        _sum: { mrr: true }
      }),
      prisma.subscription.groupBy({
        by: ['plan'],
        where: { status: SubscriptionStatus.ACTIVE },
        orderBy: { plan: 'asc' },
        _sum: { mrr: true }
      }),
      prisma.callAttempt.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          leadId: true,
          result: true,
          createdAt: true,
          lead: {
            select: {
              fullName: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.emailEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          leadId: true,
          type: true,
          createdAt: true,
          lead: {
            select: {
              fullName: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    const statusCount = new Map<LeadStatus, number>();
    for (const row of leadStatusRows) {
      statusCount.set(row.status, row._count?._all ?? 0);
    }

    const funnel = {
      new: statusCount.get(LeadStatus.NEW) ?? 0,
      callScheduled: statusCount.get(LeadStatus.CALL_SCHEDULED) ?? 0,
      callAttempted: statusCount.get(LeadStatus.CALL_ATTEMPTED) ?? 0,
      qualified: statusCount.get(LeadStatus.QUALIFIED) ?? 0,
      proposalSent: statusCount.get(LeadStatus.PROPOSAL_SENT) ?? 0,
      followUp: statusCount.get(LeadStatus.FOLLOW_UP) ?? 0,
      closedWon: statusCount.get(LeadStatus.CLOSED_WON) ?? 0,
      closedLost: statusCount.get(LeadStatus.CLOSED_LOST) ?? 0,
      cold: statusCount.get(LeadStatus.COLD) ?? 0
    };

    const newToCallNumerator =
      funnel.closedWon +
      funnel.followUp +
      funnel.proposalSent +
      funnel.qualified +
      funnel.callAttempted +
      funnel.callScheduled;

    const callToQualifiedDenominator = funnel.callScheduled + funnel.callAttempted;
    const callToQualifiedNumerator = funnel.qualified + funnel.proposalSent + funnel.followUp + funnel.closedWon;

    const qualifiedToCloseDenominator = funnel.qualified + funnel.proposalSent + funnel.followUp + funnel.closedWon;

    const conversionRates = {
      newToCall: toPercent(newToCallNumerator, totalLeads),
      callToQualified: toPercent(callToQualifiedNumerator, callToQualifiedDenominator),
      qualifiedToClose: toPercent(funnel.closedWon, qualifiedToCloseDenominator),
      overall: toPercent(funnel.closedWon, totalLeads)
    };

    const recentActivity = [
      ...callAttempts.map((item) => ({
        leadId: item.leadId,
        lead: { name: getLeadName(item.lead) },
        result: item.result,
        createdAt: item.createdAt
      })),
      ...emailEvents.map((item) => ({
        leadId: item.leadId,
        lead: { name: getLeadName(item.lead) },
        type: item.type,
        createdAt: item.createdAt
      }))
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return NextResponse.json({
      funnel,
      conversionRates,
      mrr: {
        total: mrrTotal._sum.mrr ?? 0,
        byPlan: mrrByPlan
      },
      recentActivity
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
