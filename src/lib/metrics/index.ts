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
    leadsByStatus,
    emailEvents,
    callAttempts,
    callRecords,
    subscriptions,
    toolCallLogs
  ] = await Promise.all([
    // Leads
    prisma.lead.groupBy({
      by: ['status'],
      where: { workspaceId },
      _count: true
    }),
    prisma.lead.findMany({
      where: { workspaceId },
      select: { status: true, id: true }
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
    prisma.callAttempt.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        lead: { workspaceId }
      },
      select: { result: true, duration: true }
    }),
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
    leadsByStatusMap.set(row.status, row._count);
    totalLeads += row._count;
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

  // Processar conversão
  const newLeads = leadsByStatusMap.get(LeadStatus.NEW) || 0;
  const closedWon = leadsByStatusMap.get(LeadStatus.CLOSED_WON) || 0;

  // Processar MRR
  const activeMRR = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + (s.mrr || 0), 0);

  const mrrByPlan = new Map<string, number>();
  for (const sub of subscriptions) {
    if (sub.status === 'ACTIVE') {
      const current = mrrByPlan.get(sub.plan) || 0;
      mrrByPlan.set(sub.plan, current + (sub.mrr || 0));
    }
  }

  // Processar performance
  const successfulTools = toolCallLogs.filter(t => t.success).length;
  const avgLatency = successfulTools > 0
    ? toolCallLogs
        .filter(t => t.success && t.latencyMs)
        .reduce((sum, t) => sum + (t.latencyMs || 0), 0) / successfulTools
    : 0;
  const webhookErrors = toolCallLogs.filter(t => !t.success).length;

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
      openRate: emailCounts.sent > 0 ? (emailCounts.opened / emailCounts.sent) * 100 : 0,
      clickRate: emailCounts.sent > 0 ? (emailCounts.clicked / emailCounts.sent) * 100 : 0
    },
    calls: {
      logged: callRecords.length,
      connected: connectedCalls,
      totalDurationSec: totalCallDuration,
      avgDurationSec: callRecords.length > 0 ? totalCallDuration / callRecords.length : 0
    },
    conversion: {
      leadToQualified: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
      qualifiedToClose: qualifiedLeads > 0 ? (closedWon / qualifiedLeads) * 100 : 0,
      overall: totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0
    },
    mrr: {
      active: activeMRR,
      byPlan: Object.fromEntries(mrrByPlan)
    },
    performance: {
      avgApiResponseMs: Math.round(avgLatency),
      webhookErrors
    }
  };
}

/**
 * Criar ou atualizar snapshot diário de métricas
 */
export async function createMetricsSnapshot(workspaceId: string, date?: Date) {
  const snapshotDate = date || new Date();
  const startOfDay = new Date(snapshotDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(snapshotDate);
  endOfDay.setHours(23, 59, 59, 999);

  const metrics = await getMetrics(workspaceId, startOfDay, endOfDay);

  // Obter dados adicionais para o snapshot
  const [leadsDayCreated, emailsDayMetrics, callsDayMetrics] = await Promise.all([
    prisma.lead.count({
      where: {
        workspaceId,
        createdAt: { gte: startOfDay, lte: endOfDay }
      }
    }),
    // Emails do dia por tipo
    prisma.emailEvent.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        lead: { workspaceId }
      },
      _count: true
    }),
    // Calls do dia
    prisma.callRecord.findMany({
      where: {
        workspaceId,
        createdAt: { gte: startOfDay, lte: endOfDay }
      },
      select: { durationSec: true, status: true }
    })
  ]);

  const emailCounts = new Map<string, number>();
  for (const row of emailsDayMetrics) {
    emailCounts.set(row.type, row._count);
  }

  const callConnected = callsDayMetrics.filter(c => c.status === CallOutcome.CONNECTED).length;
  const callTotalDuration = callsDayMetrics.reduce((sum, c) => sum + (c.durationSec || 0), 0);

  // Inserir ou atualizar snapshot
  const snapshot = await prisma.metricsSnapshot.upsert({
    where: {
      workspaceId_date: {
        workspaceId,
        date: snapshotDate
      }
    },
    create: {
      workspaceId,
      date: snapshotDate,
      leadsCreated: leadsDayCreated,
      leadsQualified: metrics.leads.qualified,
      leadsUnqualified: metrics.leads.unqualified,
      emailsSent: emailCounts.get('SENT') || 0,
      emailsOpened: emailCounts.get('OPENED') || 0,
      emailsClicked: emailCounts.get('CLICKED') || 0,
      emailsBounced: emailCounts.get('BOUNCED') || 0,
      callsLogged: callsDayMetrics.length,
      callsConnected: callConnected,
      callsDuration: callTotalDuration,
      conversionRate: metrics.conversion.overall,
      mrrActive: metrics.mrr.active,
      avgApiResponseMs: metrics.performance.avgApiResponseMs,
      webhookErrors: metrics.performance.webhookErrors
    },
    update: {
      leadsCreated: leadsDayCreated,
      leadsQualified: metrics.leads.qualified,
      leadsUnqualified: metrics.leads.unqualified,
      emailsSent: emailCounts.get('SENT') || 0,
      emailsOpened: emailCounts.get('OPENED') || 0,
      emailsClicked: emailCounts.get('CLICKED') || 0,
      emailsBounced: emailCounts.get('BOUNCED') || 0,
      callsLogged: callsDayMetrics.length,
      callsConnected: callConnected,
      callsDuration: callTotalDuration,
      conversionRate: metrics.conversion.overall,
      mrrActive: metrics.mrr.active,
      avgApiResponseMs: metrics.performance.avgApiResponseMs,
      webhookErrors: metrics.performance.webhookErrors
    }
  });

  return snapshot;
}

/**
 * Obter histórico de métricas (últimos N dias)
 */
export async function getMetricsHistory(workspaceId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return prisma.metricsSnapshot.findMany({
    where: {
      workspaceId,
      date: { gte: startDate }
    },
    orderBy: { date: 'asc' }
  });
}
