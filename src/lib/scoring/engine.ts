/**
 * Lead Scoring Engine — Calcula scores baseado em:
 * - Dados do formulário (orçamento, timeline, tamanho da empresa)
 * - Engagement (emails abertos, links clicados)
 * - Histórico de contato (chamadas, respostas, interações)
 * - Sinais de compra (intent, urgência, estágio de compra)
 *
 * Score final: 0-100 (qualificado >= 60)
 */

import { prisma } from '@/lib/db';
import { IntentLevel, UrgencyLevel, BuyingStage } from '@prisma/client';

export interface LeadScoringInput {
  leadId: string;
  workspaceId: string;
}

export interface ScoringBreakdown {
  formScore: number;
  engagementScore: number;
  contactScore: number;
  signalScore: number;
  totalScore: number;
  reason: string;
  isQualified: boolean; // score >= 60
}

// ===== Scoring Rules =====

const FORM_SCORING = {
  BUDGET_CONFIRMED: 20, // orçamento definido
  BUDGET_RANGE: 15,     // orçamento em range
  BUDGET_NOT_STATED: 5,  // sem informação de orçamento

  TIMELINE_URGENT: 20,  // até 30 dias
  TIMELINE_NEAR: 15,    // 30-60 dias
  TIMELINE_FUTURE: 5,   // mais de 60 dias

  COMPANY_ENTERPRISE: 10, // +500 funcionários
  COMPANY_MID_MARKET: 8,  // 100-500
  COMPANY_SMB: 5,         // 10-100
  COMPANY_UNKNOWN: 2      // não informado
};

const ENGAGEMENT_SCORING = {
  EMAIL_OPENED: 2,
  EMAIL_CLICKED: 5,
  EMAIL_OPENED_MULTIPLE: 10, // 3+ opens
  EMAIL_CLICKED_MULTIPLE: 15, // 3+ clicks
  CASE_STUDY_VIEWED: 5,
  PRICING_PAGE_VISITED: 8
};

const CONTACT_SCORING = {
  CALL_CONNECTED: 10,
  CALL_INTERESTED: 15,
  CALL_DEMO_BOOKED: 20,
  CALL_FEEDBACK_POSITIVE: 12,
  EMAIL_RESPONSE: 8,
  SECOND_CONTACT: 5    // segunda interação
};

const SIGNAL_SCORING = {
  INTENT_HIGH: 15,
  INTENT_MEDIUM: 8,
  INTENT_LOW: 0,

  URGENCY_HIGH: 15,
  URGENCY_MEDIUM: 8,
  URGENCY_LOW: 0,

  BUYING_STAGE_DECISION: 20,
  BUYING_STAGE_EVALUATION: 15,
  BUYING_STAGE_CONSIDERATION: 10,
  BUYING_STAGE_DISCOVERY: 5,
  BUYING_STAGE_AWARENESS: 0,
  BUYING_STAGE_COMMITMENT: 25 // final stage
};

/**
 * Calcula score baseado em dados do formulário
 */
async function calculateFormScore(lead: any): Promise<number> {
  let score = 0;

  // Budget
  if (lead.productInterest?.includes('budget_confirmed')) {
    score += FORM_SCORING.BUDGET_CONFIRMED;
  } else if (lead.productInterest?.includes('budget_range')) {
    score += FORM_SCORING.BUDGET_RANGE;
  } else {
    score += FORM_SCORING.BUDGET_NOT_STATED;
  }

  // Timeline (extraído de metadata ou conteúdo)
  if (lead.productInterest?.includes('urgent') || lead.productInterest?.includes('30days')) {
    score += FORM_SCORING.TIMELINE_URGENT;
  } else if (lead.productInterest?.includes('60days')) {
    score += FORM_SCORING.TIMELINE_NEAR;
  } else {
    score += FORM_SCORING.TIMELINE_FUTURE;
  }

  // Company size (se houver informação)
  const companySize = estimateCompanySize(lead.company);
  if (companySize === 'enterprise') {
    score += FORM_SCORING.COMPANY_ENTERPRISE;
  } else if (companySize === 'mid') {
    score += FORM_SCORING.COMPANY_MID_MARKET;
  } else if (companySize === 'smb') {
    score += FORM_SCORING.COMPANY_SMB;
  } else {
    score += FORM_SCORING.COMPANY_UNKNOWN;
  }

  return score;
}

/**
 * Calcula score baseado em engagement (emails abertos/clicados)
 */
async function calculateEngagementScore(leadId: string): Promise<number> {
  let score = 0;

  const emailEvents = await prisma.emailEvent.findMany({
    where: { leadId }
  });

  const opens = emailEvents.filter(e => e.type === 'OPENED').length;
  const clicks = emailEvents.filter(e => e.type === 'CLICKED').length;

  // Multiple opens → engagement forte
  if (opens >= 3) {
    score += ENGAGEMENT_SCORING.EMAIL_OPENED_MULTIPLE;
  } else if (opens > 0) {
    score += ENGAGEMENT_SCORING.EMAIL_OPENED;
  }

  // Multiple clicks → engagement muito forte
  if (clicks >= 3) {
    score += ENGAGEMENT_SCORING.EMAIL_CLICKED_MULTIPLE;
  } else if (clicks > 0) {
    score += ENGAGEMENT_SCORING.EMAIL_CLICKED;
  }

  return score;
}

/**
 * Calcula score baseado em histórico de contato
 */
async function calculateContactScore(leadId: string): Promise<number> {
  let score = 0;

  const callRecords = await prisma.callRecord.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' }
  });

  const conversations = await prisma.conversation.findMany({
    where: { leadId },
    include: { messages: true },
    orderBy: { createdAt: 'desc' }
  });

  // Call scoring
  if (callRecords.length > 0) {
    const lastCall = callRecords[0];
    if (lastCall.status === 'CONNECTED') {
      score += CONTACT_SCORING.CALL_CONNECTED;
    }
    if (lastCall.status === 'INTERESTED') {
      score += CONTACT_SCORING.CALL_INTERESTED;
    }
    if (lastCall.status === 'BOOKED') {
      score += CONTACT_SCORING.CALL_DEMO_BOOKED;
    }

    // Bonus por múltiplas chamadas
    if (callRecords.length >= 2) {
      score += CONTACT_SCORING.SECOND_CONTACT;
    }
  }

  // Email response scoring
  const inboundMessages = conversations
    .flatMap(c => c.messages || [])
    .filter(m => m.direction === 'INBOUND');

  if (inboundMessages.length > 0) {
    score += CONTACT_SCORING.EMAIL_RESPONSE;
  }

  return score;
}

/**
 * Calcula score baseado em sinais de compra
 */
async function calculateSignalScore(lead: any): Promise<number> {
  let score = 0;

  // Intent level
  if (lead.intentLevel === 'HIGH') {
    score += SIGNAL_SCORING.INTENT_HIGH;
  } else if (lead.intentLevel === 'MEDIUM') {
    score += SIGNAL_SCORING.INTENT_MEDIUM;
  }

  // Urgency level
  if (lead.urgencyLevel === 'HIGH') {
    score += SIGNAL_SCORING.URGENCY_HIGH;
  } else if (lead.urgencyLevel === 'MEDIUM') {
    score += SIGNAL_SCORING.URGENCY_MEDIUM;
  }

  // Buying stage
  if (lead.buyingStage === 'COMMITMENT') {
    score += SIGNAL_SCORING.BUYING_STAGE_COMMITMENT;
  } else if (lead.buyingStage === 'DECISION') {
    score += SIGNAL_SCORING.BUYING_STAGE_DECISION;
  } else if (lead.buyingStage === 'EVALUATION') {
    score += SIGNAL_SCORING.BUYING_STAGE_EVALUATION;
  } else if (lead.buyingStage === 'CONSIDERATION') {
    score += SIGNAL_SCORING.BUYING_STAGE_CONSIDERATION;
  } else if (lead.buyingStage === 'DISCOVERY') {
    score += SIGNAL_SCORING.BUYING_STAGE_DISCOVERY;
  }

  return score;
}

/**
 * Estima tamanho da empresa baseado no nome
 */
function estimateCompanySize(company?: string): string {
  if (!company) return 'unknown';

  const enterprise = /enterprise|corporation|corp|inc\.|ltd|group|holding|multinational/i;
  const mid = /media|agency|consulting|tech|startup|consulting|software/i;

  if (enterprise.test(company)) return 'enterprise';
  if (mid.test(company)) return 'mid';

  return 'smb';
}

/**
 * Calcula o score final completo do lead
 */
export async function scoreLeadComplete(input: LeadScoringInput): Promise<ScoringBreakdown> {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    include: {
      callRecords: { orderBy: { createdAt: 'desc' }, take: 10 },
      emailEvents: true,
      conversations: {
        include: {
          messages: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!lead) {
    throw new Error(`Lead não encontrado: ${input.leadId}`);
  }

  const formScore = await calculateFormScore(lead);
  const engagementScore = await calculateEngagementScore(input.leadId);
  const contactScore = await calculateContactScore(input.leadId);
  const signalScore = await calculateSignalScore(lead);

  const totalScore = Math.min(100, formScore + engagementScore + contactScore + signalScore);
  const isQualified = totalScore >= 60;

  // Gera descrição resumida
  const reasons: string[] = [];
  if (formScore > 0) reasons.push(`Formulário: ${formScore}pts`);
  if (engagementScore > 0) reasons.push(`Engagement: ${engagementScore}pts`);
  if (contactScore > 0) reasons.push(`Contatos: ${contactScore}pts`);
  if (signalScore > 0) reasons.push(`Sinais: ${signalScore}pts`);

  const reason = reasons.join(' | ') || 'Sem dados de scoring';

  // Salva score no histórico
  await prisma.leadScore.create({
    data: {
      leadId: input.leadId,
      score: totalScore,
      reason,
      modelVersion: 'v1'
    }
  });

  // Atualiza lead com score
  await prisma.lead.update({
    where: { id: input.leadId },
    data: {
      leadScoreValue: totalScore,
      qualificationScore: totalScore
    }
  });

  return {
    formScore,
    engagementScore,
    contactScore,
    signalScore,
    totalScore,
    reason,
    isQualified
  };
}

/**
 * Calcula score rápido (sem histórico completo) para webhooks
 */
export async function quickScoreLead(leadId: string): Promise<number> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) return 0;

  let score = lead.intentLevel === 'HIGH' ? 20 : lead.intentLevel === 'MEDIUM' ? 10 : 0;
  score += lead.urgencyLevel === 'HIGH' ? 20 : lead.urgencyLevel === 'MEDIUM' ? 10 : 0;
  score += lead.buyingStage === 'DECISION' ? 15 : lead.buyingStage === 'EVALUATION' ? 10 : 0;

  return Math.min(100, score);
}

/**
 * Retorna status de qualificação
 */
export function getQualificationStatus(score: number): 'COLD' | 'WARM' | 'HOT' {
  if (score >= 80) return 'HOT';
  if (score >= 60) return 'WARM';
  return 'COLD';
}
