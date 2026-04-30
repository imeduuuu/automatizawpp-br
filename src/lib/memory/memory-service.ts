import { prisma } from '@/lib/db';

export type MemoryUpdateInput = {
  leadId: string;
  painPoints?: string[];
  goals?: string[];
  budgetClues?: string[];
  objections?: string[];
  emotionalTone?: string;
  channelPreferences?: string[];
  longTermSummary?: string;
  lastTouchpointSummary?: string;
  leadVolumePeriod?: number;
  missedFollowupPct?: number;
  avgDealValue?: number;
  estimatedMissedRevenue?: number;
  estimatedRecoveryLow?: number;
  estimatedRecoveryHigh?: number;
  roiSummary?: string;
};

export async function updateLeadMemory(input: MemoryUpdateInput) {
  return prisma.leadMemory.upsert({
    where: { leadId: input.leadId },
    create: {
      leadId: input.leadId,
      painPoints: input.painPoints ?? [],
      goals: input.goals ?? [],
      budgetClues: input.budgetClues ?? [],
      objections: input.objections ?? [],
      emotionalTone: input.emotionalTone,
      leadVolumePeriod: input.leadVolumePeriod,
      missedFollowupPct: input.missedFollowupPct,
      avgDealValue: input.avgDealValue,
      estimatedMissedRevenue: input.estimatedMissedRevenue,
      estimatedRecoveryLow: input.estimatedRecoveryLow,
      estimatedRecoveryHigh: input.estimatedRecoveryHigh,
      roiSummary: input.roiSummary,
      channelPreferences: input.channelPreferences ?? [],
      longTermSummary: input.longTermSummary,
      lastTouchpointSummary: input.lastTouchpointSummary,
      tags: []
    },
    update: {
      painPoints: input.painPoints,
      goals: input.goals,
      budgetClues: input.budgetClues,
      objections: input.objections,
      emotionalTone: input.emotionalTone,
      leadVolumePeriod: input.leadVolumePeriod,
      missedFollowupPct: input.missedFollowupPct,
      avgDealValue: input.avgDealValue,
      estimatedMissedRevenue: input.estimatedMissedRevenue,
      estimatedRecoveryLow: input.estimatedRecoveryLow,
      estimatedRecoveryHigh: input.estimatedRecoveryHigh,
      roiSummary: input.roiSummary,
      channelPreferences: input.channelPreferences,
      longTermSummary: input.longTermSummary,
      lastTouchpointSummary: input.lastTouchpointSummary
    }
  });
}

export async function getLeadMemorySummary(leadId: string) {
  const memory = await prisma.leadMemory.findUnique({ where: { leadId } });
  if (!memory) return null;

  return [
    `Tone: ${memory.emotionalTone ?? 'unknown'}`,
    `Pain points: ${memory.painPoints.join(', ') || 'none'}`,
    `Goals: ${memory.goals.join(', ') || 'none'}`,
    `Objections: ${memory.objections.join(', ') || 'none'}`,
    `Estimated missed revenue: ${memory.estimatedMissedRevenue ?? 0}`,
    `Last summary: ${memory.lastTouchpointSummary ?? 'n/a'}`
  ].join('\n');
}
