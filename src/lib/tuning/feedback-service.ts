import { AgentName } from '@prisma/client';

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
  _workspaceId: string,
  _agentName: AgentName,
  _limit: number,
  _minScore: number
): Promise<FewShotExample[]> {
  // TODO: Query approved examples from database
  // For now, return empty array (agents will use fallback policy)
  return [];
}

export async function recordMessageReview(review: MessageReviewInput): Promise<MessageReviewResult> {
  // TODO: Store review in database for agent training
  console.log(`Review recorded: scored ${review.score} for agent ${review.agent}`);
  return { id: `review-${Date.now()}` };
}
