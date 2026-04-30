import { callAIStructured } from '@/lib/ai/anthropic-client';
import { QUALIFICATION_PROMPT } from './prompts';
import { prisma } from '@/lib/db';

export interface QualificationScore {
  score: number;
  intent: 'HIGH' | 'MEDIUM' | 'LOW';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  buyingStage: 'AWARENESS' | 'DISCOVERY' | 'CONSIDERATION' | 'EVALUATION' | 'DECISION';
  fitRating: 'perfect' | 'good' | 'possible' | 'poor';
  reasoning: string;
}

export async function runQualificationAgent(leadId: string, conversationText: string): Promise<QualificationScore> {
  const result = await callAIStructured<QualificationScore>(
    QUALIFICATION_PROMPT,
    conversationText
  );

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      leadScoreValue: result.score,
      intentLevel: result.intent,
      urgencyLevel: result.urgency,
      buyingStage: result.buyingStage,
    },
  });

  return result;
}
