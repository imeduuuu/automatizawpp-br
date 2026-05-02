/**
 * Metrics tracking system para Phase 5D - Monitoring & Observability
 * Rastreia: leads, emails, calls, conversão, MRR, response time
 */

import { prisma } from '@/lib/db';
import { LeadStatus, EmailEventType, CallOutcome } from '@prisma/client';

export interface MetricsData {
  leads: {
    total: number;
    qualified: number;
    unqualified: number;
    byStatus: Record<string, number>;
  };
  emails: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    openRate: number;
    clickRate: number;
  };
  calls: {
    logged: number;
    connected: number;
    totalDurationSec: number;
    avgDurationSec: number;
  };
  conversion: {
    leadToQualified: number;
    qualifiedToClose: number;
    overall: number;
  };
  mrr: {
    active: number;
    byPlan: Record<string, number>;
  };
  performance: {
    avgApiResponseMs: number;
    webhookErrors: number;
  };
}

/**
 * Obter todas as métricas para um workspace em um período
 */
export async function getMetrics(
  workspaceId: string,
  startDate?: Date,
  endDate?: Date
): Promise<MetricsData> {
  const now = new Date();
  const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 dias
  const end = endDate || now;

  const [
    leads,
    emailEvents,
    callRecords,
    subscriptions,
    toolCallLogs
  ] = await Promise.all([
    // Leads
    prisma.lead.groupBy({
      by: ['status'],
      where: { workspaceId },
      orderBy: { status: 'asc' },
      _count: { _all: true }
    }),
    // Emails
    prisma.emailEvent.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        lead: { workspaceId }
      },
      select: { type: true, id: true }
    }),
    // Calls
    prisma.callRecord.findMany({
      where: {
        workspaceId,
        createdAt: { gte: start, lte: end }
      },
      select: { status: true, durationSec: true }
    }),
    // Revenue
    prisma.subscription.findMany({
      where: { lead: { workspaceId } },
      select: { mrr: true, plan: true, status: true }
    }),
    // Performance
    prisma.toolCallLog.findMany({
      where: {
        workspaceId,
        createdAt: { gte: start, lte: end }
      },
      select: { latencyMs: true, success: true }
    })
  ]);

  // Processar leads
  const leadsByStatusMap = new Map<string, number>();
  let totalLeads = 0;
  let qualifiedLeads = 0;

  for (const row of leads) {
    leadsByStatusMap.set(row.status, row._count._all);
    totalLeads += row._count._all;
  }

  const qualifiedStatuses = [
    LeadStatus.QUALIFIED,
    LeadStatus.PROPOSAL_SENT,
    LeadStatus.FOLLOW_UP,
    LeadStatus.CLOSED_WON
  ];
  qualifiedLeads = Array.from(leadsByStatusMap.entries())
    .filter(([status]) => qualifiedStatuses.includes(status as LeadStatus))
    .reduce((sum, [_, count]) => sum + count, 0);

  // Processar emails
  const emailCounts = {
    sent: emailEvents.filter(e => e.type === EmailEventType.SENT).length,
    opened: emailEvents.filter(e => e.type === EmailEventType.OPENED).length,
    clicked: emailEvents.filter(e => e.type === EmailEventType.CLICKED).length,
    bounced: emailEvents.filter(e => e.type === EmailEventType.BOUNCED).length
  };

  // Processar calls
  const connectedCalls = callRecords.filter(c => c.status === CallOutcome.CONNECTED).length;
  const totalCallDuration = callRecords.reduce((sum, c) => sum + (c.durationSec || 0), 0);

  // Processar revenue
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const planRevenue = new Map<string, number>();
  for (const sub of subscriptions) {
    if (sub.plan && sub.mrr) {
      planRevenue.set(sub.plan, (planRevenue.get(sub.plan) || 0) + sub.mrr);
    }
  }

  // Processar performance
  const successLogs = toolCallLogs.filter(l => l.success).length;
  const avgLatency = toolCallLogs.length > 0
    ? toolCallLogs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / toolCallLogs.length
    : 0;

  return {
    leads: {
      total: totalLeads,
      qualified: qualifiedLeads,
      unqualified: totalLeads - qualifiedLeads,
      byStatus: Object.fromEntries(leadsByStatusMap)
    },
    emails: {
      sent: emailCounts.sent,
      opened: emailCounts.opened,
      clicked: emailCounts.clicked,
      bounced: emailCounts.bounced,
      openRate: emailCounts.sent > 0 ? emailCounts.opened / emailCounts.sent : 0,
      clickRate: emailCounts.sent > 0 ? emailCounts.clicked / emailCounts.sent : 0
    },
    calls: {
      logged: callRecords.length,
      connected: connectedCalls,
      totalDurationSec: totalCallDuration,
      avgDurationSec: connectedCalls > 0 ? totalCallDuration / connectedCalls : 0
    },
    conversion: {
      leadToQualified: totalLeads > 0 ? qualifiedLeads / totalLeads : 0,
      qualifiedToClose: 0, // Implementar lógica específica
      overall: 0 // Implementar lógica específica
    },
    mrr: {
      active: activeSubs,
      byPlan: Object.fromEntries(planRevenue)
    },
    performance: {
      avgApiResponseMs: avgLatency,
      webhookErrors: toolCallLogs.filter(l => !l.success).length
    }
  };
}

export async function createMetricsSnapshot(workspaceId: string) {
  const metrics = await getMetrics(workspaceId);
  
  // Store snapshot in database if needed
  // For now, just return the metrics
  return {
    workspaceId,
    timestamp: new Date(),
    metrics
  };
}
