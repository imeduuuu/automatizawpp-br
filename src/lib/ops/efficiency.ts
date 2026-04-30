import { subDays } from 'date-fns';
import { prisma } from '@/lib/db';

export type EfficiencyBreakdown = {
  responseQuality: number;
  nextBestActionAccuracy: number;
  complianceScore: number;
  stageProgression: number;
  followUpEffectiveness: number;
  weightedEfficiency: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function weighted(b: Omit<EfficiencyBreakdown, 'weightedEfficiency'>) {
  return clamp(
    0.3 * b.responseQuality +
      0.2 * b.nextBestActionAccuracy +
      0.2 * b.complianceScore +
      0.15 * b.stageProgression +
      0.15 * b.followUpEffectiveness
  );
}

export async function computeEfficiency(workspaceId: string, days = 7): Promise<EfficiencyBreakdown> {
  const since = subDays(new Date(), days);

  const [qaRuns, totalRuns, complianceIssues, leadsProgressed, activeLeads, followUpsSent, followUpsQueued] = await Promise.all([
    prisma.agentTask.findMany({
      where: {
        agentRun: { workspaceId, createdAt: { gte: since } },
        agent: 'SALES_QA',
        status: 'COMPLETED'
      },
      select: { outputPayload: true }
    }),
    prisma.agentRun.count({
      where: {
        workspaceId,
        createdAt: { gte: since }
      }
    }),
    prisma.activityLog.count({
      where: {
        workspaceId,
        createdAt: { gte: since },
        type: 'QA_REVIEW',
        details: {
          path: ['severity'],
          equals: 'high'
        }
      }
    }),
    prisma.lead.count({
      where: {
        workspaceId,
        updatedAt: { gte: since },
        status: { in: ['QUALIFYING', 'NURTURING', 'SALES_READY', 'NEGOTIATION', 'BOOKED', 'WON'] }
      }
    }),
    prisma.lead.count({
      where: {
        workspaceId,
        status: { notIn: ['LOST', 'WON', 'PAUSED'] }
      }
    }),
    prisma.followUpTask.count({
      where: {
        lead: { workspaceId },
        sentAt: { gte: since },
        status: 'SENT'
      }
    }),
    prisma.followUpTask.count({
      where: {
        lead: { workspaceId },
        status: 'QUEUED'
      }
    })
  ]);

  const qaScores = qaRuns
    .map((item) => {
      const output = item.outputPayload as { qaScore?: number } | null;
      return output?.qaScore ?? null;
    })
    .filter((value): value is number => typeof value === 'number');

  const responseQuality = qaScores.length
    ? clamp(qaScores.reduce((acc, score) => acc + score, 0) / qaScores.length)
    : 70;

  const nextBestActionAccuracy = clamp(totalRuns === 0 ? 70 : 65 + Math.min(25, totalRuns / 4));
  const complianceScore = clamp(100 - complianceIssues * 10);
  const stageProgression = clamp(activeLeads === 0 ? 70 : (leadsProgressed / activeLeads) * 100);
  const followUpEffectiveness = clamp(followUpsSent === 0 ? 65 : (followUpsSent / (followUpsSent + followUpsQueued)) * 100 + 10);

  const breakdown = {
    responseQuality,
    nextBestActionAccuracy,
    complianceScore,
    stageProgression,
    followUpEffectiveness
  };

  return {
    ...breakdown,
    weightedEfficiency: weighted(breakdown)
  };
}
