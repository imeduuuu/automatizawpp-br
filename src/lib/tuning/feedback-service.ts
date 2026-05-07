import { AgentName } from '@prisma/client';
import { prisma } from '@/lib/db';

export interface FewShotExample {
  score?: number;
  messageText?: string;
  outcome?: string;
}

export interface MessageReviewInput {
  workspaceId: string;
  leadId?: string;
  messageId?: string;
  agent: AgentName;
  score: number;
  clarityScore?: number;
  persuasionScore?: number;
  complianceScore?: number;
  outcome?: string;
  notes?: string;
  messageText?: string;
}

export interface MessageReviewResult {
  id: string;
}

export async function getAgentFewShotExamples(
  workspaceId: string,
  agentName: AgentName,
  limit: number,
  minScore: number
): Promise<FewShotExample[]> {
  const logs = await prisma.activityLog.findMany({
    where: {
      workspaceId,
      type: 'QA_REVIEW',
      details: {
        path: ['agent'],
        equals: agentName,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 3,
    select: { details: true },
  });

  const examples: FewShotExample[] = [];
  for (const log of logs) {
    const d = log.details as Record<string, unknown>;
    const score = typeof d.score === 'number' ? d.score : 0;
    if (score < minScore) continue;
    examples.push({
      score,
      messageText: typeof d.messageText === 'string' ? d.messageText : undefined,
      outcome: typeof d.outcome === 'string' ? d.outcome : undefined,
    });
    if (examples.length >= limit) break;
  }
  return examples;
}

export async function recordMessageReview(review: MessageReviewInput): Promise<MessageReviewResult> {
  if (!review.workspaceId) {
    return { id: `review-${Date.now()}` };
  }

  const log = await prisma.activityLog.create({
    data: {
      workspaceId: review.workspaceId,
      leadId: review.leadId ?? null,
      type: 'QA_REVIEW',
      details: {
        agent: review.agent,
        score: review.score,
        clarityScore: review.clarityScore,
        persuasionScore: review.persuasionScore,
        complianceScore: review.complianceScore,
        outcome: review.outcome,
        notes: review.notes,
        messageText: review.messageText,
        messageId: review.messageId,
      },
    },
    select: { id: true },
  });

  return { id: log.id };
}
