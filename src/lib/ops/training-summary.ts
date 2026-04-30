import { subDays } from 'date-fns';
import { AgentName } from '@prisma/client';
import { prisma } from '@/lib/db';

const REVIEW_OUTCOMES = ['booked', 'replied', 'pending', 'lost'] as const;
const REVIEW_DIMENSIONS = [
  { key: 'clarityScore', label: 'Claridad' },
  { key: 'persuasionScore', label: 'Persuasion' },
  { key: 'complianceScore', label: 'Cumplimiento' }
] as const;

type ReviewOutcome = (typeof REVIEW_OUTCOMES)[number];
type ReviewDimension = (typeof REVIEW_DIMENSIONS)[number];
type ReviewDimensionKey = ReviewDimension['key'];

type ReviewDetails = {
  agent?: string | null;
  score?: number | null;
  clarityScore?: number | null;
  persuasionScore?: number | null;
  complianceScore?: number | null;
  outcome?: string | null;
};

type OutcomeCounts = Record<ReviewOutcome, number>;

export type TrainingDimensionSummary = {
  key: ReviewDimensionKey;
  label: string;
  average: number | null;
};

export type TrainingQaSummary = {
  reviewCount: number;
  averageScore: number;
  lowScoreCount: number;
  highScoreCount: number;
  outcomes: OutcomeCounts;
  dimensions: TrainingDimensionSummary[];
};

export type TrainingAgentSummary = {
  agent: AgentName;
  reviewCount: number;
  averageScore: number;
  outcomes: OutcomeCounts;
};

function emptyOutcomes(): OutcomeCounts {
  return {
    booked: 0,
    replied: 0,
    pending: 0,
    lost: 0
  };
}

function isReviewOutcome(value: string | null | undefined): value is ReviewOutcome {
  return Boolean(value) && REVIEW_OUTCOMES.includes(value as ReviewOutcome);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export async function summarizeWeeklyTraining(workspaceId: string, days = 7): Promise<{
  qaSummary: TrainingQaSummary;
  agentScoreboard: TrainingAgentSummary[];
}> {
  const since = subDays(new Date(), days);
  const validAgents = new Set<string>(Object.values(AgentName));

  const reviews = await prisma.activityLog.findMany({
    where: {
      workspaceId,
      type: 'QA_REVIEW',
      createdAt: { gte: since }
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: { details: true }
  });

  const dimensionTotals = new Map<ReviewDimensionKey, { total: number; count: number }>(
    REVIEW_DIMENSIONS.map((dimension) => [dimension.key, { total: 0, count: 0 }])
  );
  const outcomeTotals = emptyOutcomes();
  const agentMap = new Map<AgentName, { reviewCount: number; totalScore: number; outcomes: OutcomeCounts }>();

  let reviewCount = 0;
  let scoreTotal = 0;
  let lowScoreCount = 0;
  let highScoreCount = 0;

  for (const review of reviews) {
    const details = review.details as ReviewDetails | null;
    const score = details?.score;
    const rawAgent = details?.agent;

    if (typeof score !== 'number' || !rawAgent || !validAgents.has(rawAgent)) {
      continue;
    }

    const agent = rawAgent as AgentName;
    const outcome = isReviewOutcome(details?.outcome) ? details.outcome : 'pending';

    reviewCount += 1;
    scoreTotal += score;
    if (score < 70) lowScoreCount += 1;
    if (score >= 85) highScoreCount += 1;
    outcomeTotals[outcome] += 1;

    for (const dimension of REVIEW_DIMENSIONS) {
      const value = details?.[dimension.key];
      if (typeof value === 'number') {
        const current = dimensionTotals.get(dimension.key);
        if (current) {
          current.total += value;
          current.count += 1;
        }
      }
    }

    const agentSummary = agentMap.get(agent) ?? {
      reviewCount: 0,
      totalScore: 0,
      outcomes: emptyOutcomes()
    };
    agentSummary.reviewCount += 1;
    agentSummary.totalScore += score;
    agentSummary.outcomes[outcome] += 1;
    agentMap.set(agent, agentSummary);
  }

  const qaSummary: TrainingQaSummary = {
    reviewCount,
    averageScore: reviewCount ? round(scoreTotal / reviewCount) : 0,
    lowScoreCount,
    highScoreCount,
    outcomes: outcomeTotals,
    dimensions: REVIEW_DIMENSIONS.map((dimension) => {
      const totals = dimensionTotals.get(dimension.key);
      const average = totals && totals.count > 0 ? round(totals.total / totals.count) : null;
      return {
        key: dimension.key,
        label: dimension.label,
        average
      };
    })
  };

  const agentScoreboard: TrainingAgentSummary[] = Array.from(agentMap.entries())
    .map(([agent, summary]) => ({
      agent,
      reviewCount: summary.reviewCount,
      averageScore: round(summary.totalScore / summary.reviewCount),
      outcomes: summary.outcomes
    }))
    .sort((left, right) => left.averageScore - right.averageScore || right.reviewCount - left.reviewCount);

  return { qaSummary, agentScoreboard };
}
