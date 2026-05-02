/**
 * AI Lead Qualification — Usa Claude para análise inteligente de leads.
 *
 * Extrai:
 * - Budget (se mencionado)
 * - Timeline (urgência)
 * - Pain points
 * - Objections
 * - Auto-gera mensagens personalizadas de follow-up
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export interface AIQualificationResult {
  budget: string | null;
  timeline: string | null;
  painPoints: string[];
  objections: string[];
  score: number; // 0-100
  recommendation: string;
  followUpMessage: string;
}

/**
 * Qualifica um lead usando Claude
 */
export async function qualifyLeadWithAI(leadId: string): Promise<AIQualificationResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      conversations: {
        include: { messages: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      memory: true
    }
  });

  if (!lead) {
    throw new Error(`Lead não encontrado: ${leadId}`);
  }

  // Compila contexto da conversa
  const conversationHistory = lead.conversations
    .flatMap(c => c.messages)
    .map(m => `${m.direction === 'INBOUND' ? 'Lead' : 'Team'}: ${m.body}`)
    .join('\n');

  const leadContext = `
Lead: ${lead.fullName}
Email: ${lead.email}
Phone: ${lead.phone}
Company: ${lead.company}
Source: ${lead.source}
Product Interest: ${lead.productInterest}

Histórico de conversa:
${conversationHistory}

Informações salvas:
${lead.memory?.painPoints?.join(', ') || 'N/A'}
  `;

  // Prompt para Claude analisar
  const prompt = `Você é um especialista em vendas B2B. Analise este lead e extraia informações estruturadas:

${leadContext}

Retorne JSON com:
{
  "budget": "valor estimado ou null",
  "timeline": "urgência (URGENT/SOON/FUTURE)",
  "painPoints": ["problema 1", "problema 2", ...],
  "objections": ["objeção 1", ...],
  "score": número 0-100,
  "recommendation": "próxima ação recomendada",
  "followUpMessage": "mensagem de follow-up personalizada"
}`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  // Parse resposta
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  let result: AIQualificationResult;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON não encontrado na resposta');
    }
    result = JSON.parse(jsonMatch[0]);
  } catch (error) {
    // Fallback se parsing falhar
    result = {
      budget: null,
      timeline: null,
      painPoints: [],
      objections: [],
      score: 50,
      recommendation: 'Revisar manualmente',
      followUpMessage: 'Obrigado por seu interesse. Como posso ajudar?'
    };
  }

  // Salva insights no LeadMemory
  if (lead.memory) {
    await prisma.leadMemory.update({
      where: { leadId },
      data: {
        painPoints: result.painPoints,
        objections: result.objections,
        budgetClues: result.budget ? [result.budget] : undefined
      }
    });
  } else {
    await prisma.leadMemory.create({
      data: {
        leadId,
        painPoints: result.painPoints,
        objections: result.objections,
        budgetClues: result.budget ? [result.budget] : []
      }
    });
  }

  return result;
}

/**
 * Gera mensagem de follow-up personalizada via Claude
 */
export async function generatePersonalizedFollowUp(leadId: string, context: string): Promise<string> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { memory: true }
  });

  if (!lead) {
    throw new Error(`Lead não encontrado: ${leadId}`);
  }

  const prompt = `Gere uma mensagem de follow-up profissional e personalizada em português:

Lead: ${lead.fullName}
Company: ${lead.company}
Pain Points: ${lead.memory?.painPoints?.join(', ') || 'Não mencionados'}
Budget: ${lead.memory?.budgetClues?.join(', ') || 'Não mencionado'}
Context: ${context}

Mensagem deve ser:
- Breve (2-3 sentenças)
- Personalizada (mencionar dados do lead)
- Orientada para ação (call-to-action claro)
- Tom profissional mas amigável`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return message.content[0].type === 'text' ? message.content[0].text : 'Segue nosso acompanhamento...';
}

/**
 * Analisa objeções e gera resposta
 */
export async function generateObjectionResponse(
  leadId: string,
  objectionText: string
): Promise<string> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) {
    throw new Error(`Lead não encontrado: ${leadId}`);
  }

  const prompt = `Você é um closer experiente. Responda esta objeção de vendas de forma persuasiva:

Lead: ${lead.fullName}
Objeção: "${objectionText}"

Retorne uma resposta:
- Empática (validar a preocupação)
- Evidência-baseada (dados, ROI, case studies)
- Orientada para ação
- Em português, tom profissional`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
