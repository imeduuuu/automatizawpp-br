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
  const raw = await callAIStructured<QualificationScore>(
    QUALIFICATION_PROMPT,
    conversationText
  );

  // Sprint 1.6 V.L.A.E.G.: callAIStructured agora pode retornar null. Fallback seguro.
  const result: QualificationScore = raw && typeof raw.score === 'number'
    ? raw
    : {
        score: 50,
        intent: 'MEDIUM',
        urgency: 'MEDIUM',
        buyingStage: 'AWARENESS',
        fitRating: 'possible',
        reasoning: 'Fallback: respuesta del modelo inválida o vacía',
      };

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
