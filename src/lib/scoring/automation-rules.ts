/**
 * Automation Rules Engine — Gatilhos e regras para automação completa.
 *
 * Regras:
 * 1. IF score > 80 → lead para time de vendas (status SALES_READY)
 * 2. IF email_opened AND clicked_link → enviar demo
 * 3. IF sem resposta em 7 dias → enviar win-back
 * 4. IF orçamento confirmado → criar no CRM
 * 5. IF múltiplas objeções → escalar manualmente
 */

import { prisma } from '@/lib/db';
import { LeadStatus } from '@prisma/client';
import { scoreLeadComplete } from './engine';
import { scheduleSequenceFollowUps, getApplicableSequence } from '@/lib/sequences/builder';

interface AutomationContext {
  leadId: string;
  workspaceId: string;
  triggerEvent: 'SCORE_UPDATED' | 'EMAIL_OPENED' | 'EMAIL_CLICKED' | 'CALL_COMPLETED' | 'NO_RESPONSE_TIMEOUT';
}

/**
 * Regra 1: Lead score > 80 → enviar para time de vendas imediatamente
 */
export async function ruleHighQualificationScore(leadId: string, score: number): Promise<void> {
  if (score > 80) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'SALES_READY',
        nextAction: 'Enviar para time de vendas',
        nextActionAt: new Date()
      }
    });

    console.log(`[Automation] Lead ${leadId} é HOT (score ${score}) → SALES_READY`);
  }
}

/**
 * Regra 2: Email aberto + link clicado → enviar demo
 */
export async function ruleEngagementDemoOffer(leadId: string): Promise<void> {
  const emailEvents = await prisma.emailEvent.findMany({
    where: { leadId }
  });

  const hasOpened = emailEvents.some(e => e.type === 'OPENED');
  const hasClicked = emailEvents.some(e => e.type === 'CLICKED');

  if (hasOpened && hasClicked) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (lead && lead.status !== 'CALL_SCHEDULED' && lead.status !== 'BOOKED') {
      // Cria booking para demo automáticamente
      const demoDate = new Date();
      demoDate.setHours(demoDate.getHours() + 48); // 2 dias depois

      await prisma.booking.create({
        data: {
          leadId,
          channel: 'VOICE',
          scheduledFor: demoDate,
          timezone: 'America/Sao_Paulo',
          status: 'PENDING',
          notes: 'Demo automática - lead abriu e clicou em email'
        }
      });

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'CALL_SCHEDULED',
          nextAction: 'Demo agendada automaticamente',
          nextActionAt: demoDate
        }
      });

      console.log(`[Automation] Lead ${leadId} apresentou engagement → Demo agendada`);
    }
  }
}

/**
 * Regra 3: Sem resposta em 7 dias → enviar win-back
 */
export async function ruleNoResponseWinBack(leadId: string, workspaceId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      conversations: {
        orderBy: { lastMessageAt: 'desc' },
        take: 1
      }
    }
  });

  if (!lead) return;

  // Verifica última interação
  const lastContact = lead.lastContactAt;
  const now = new Date();
  const daysSinceContact = lastContact ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)) : 999;

  if (daysSinceContact >= 7 && lead.status !== 'CLOSED_WON' && lead.status !== 'CLOSED_LOST') {
    // Atualiza para COLD
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'COLD',
        nextAction: 'Win-back agendado',
        nextActionAt: now
      }
    });

    console.log(`[Automation] Lead ${leadId} sem resposta 7 dias → COLD status`);
  }
}

/**
 * Regra 4: Orçamento confirmado → atualizar lead para qualified
 */
export async function ruleBudgetConfirmed(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) return;

  const isBudgetConfirmed = lead.productInterest?.includes('budget_confirmed');

  if (isBudgetConfirmed && lead.status !== 'QUALIFIED' && lead.status !== 'PROPOSAL_SENT') {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'QUALIFIED',
        buyingStage: 'DECISION',
        nextAction: 'Enviar proposta'
      }
    });

    console.log(`[Automation] Lead ${leadId} com orçamento confirmado → QUALIFIED`);
  }
}

/**
 * Regra 5: Múltiplas objeções → escalar manualmente
 */
export async function ruleMultipleObjectionsEscalation(leadId: string): Promise<void> {
  const objections = await prisma.objectionRecord.findMany({
    where: { leadId }
  });

  const unhandledObjections = objections.filter(o => !o.handled);

  if (unhandledObjections.length >= 3) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'FOLLOW_UP',
        nextAction: 'Escalar manualmente - múltiplas objeções',
        nextActionAt: new Date()
      }
    });

    console.log(`[Automation] Lead ${leadId} com ${unhandledObjections.length} objeções → Escalado`);
  }
}

/**
 * Executa todas as regras de automação para um lead
 */
export async function executeAutomationRules(context: AutomationContext): Promise<void> {
  const { leadId, workspaceId, triggerEvent } = context;

  try {
    // Rescore o lead
    const scoring = await scoreLeadComplete({
      leadId,
      workspaceId
    });

    // Aplica cada regra
    await ruleHighQualificationScore(leadId, scoring.totalScore);
    await ruleEngagementDemoOffer(leadId);
    await ruleNoResponseWinBack(leadId, workspaceId);
    await ruleBudgetConfirmed(leadId);
    await ruleMultipleObjectionsEscalation(leadId);

    // Se qualificado → assign sequência
    if (scoring.isQualified) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (lead && !lead.assignedSequenceId) {
        const sequenceId = await getApplicableSequence(workspaceId, scoring.totalScore, leadId);
        if (sequenceId) {
          await scheduleSequenceFollowUps(leadId, sequenceId, workspaceId);
        }
      }
    }

    console.log(`[Automation] Regras executadas para lead ${leadId}`);
  } catch (error) {
    console.error(`[Automation] Erro ao executar regras para ${leadId}:`, error);
  }
}

/**
 * Triggers que disparam automação
 */
export async function triggerAutomation(event: AutomationContext): Promise<void> {
  await executeAutomationRules(event);
}
