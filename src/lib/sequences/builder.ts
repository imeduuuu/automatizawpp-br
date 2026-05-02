/**
 * Follow-up Sequences Builder — Cria e gerencia sequências de follow-up automáticas.
 *
 * Sequências padrão:
 * - Day 1: Email de boas-vindas + apresentação
 * - Day 3: Case study + prova social
 * - Day 7: Oferta final com desconto
 * - Day 14: Win-back para leads frios (sem resposta)
 */

import { prisma } from '@/lib/db';
import { ChannelType } from '@prisma/client';

export interface SequenceConfig {
  name: string;
  description: string;
  triggerType: 'LEAD_CREATED' | 'LEAD_SCORED' | 'MANUAL' | 'ENGAGEMENT';
  steps: SequenceStepConfig[];
}

export interface SequenceStepConfig {
  stepOrder: number;
  channel: ChannelType;
  delayHours: number; // horas após trigger
  objective: string;
  template: string; // email template key ou SMS template
  tone?: string; // 'friendly' | 'professional' | 'urgent'
}

/**
 * Templates de sequências padrão
 */
export const DEFAULT_SEQUENCES: Record<string, SequenceConfig> = {
  QUALIFIED_LEAD: {
    name: 'Sequência de Lead Qualificado',
    description: 'Para leads com score >= 60 que precisam de follow-up imediato',
    triggerType: 'LEAD_SCORED',
    steps: [
      {
        stepOrder: 1,
        channel: 'EMAIL',
        delayHours: 1,
        objective: 'Apresentação pessoal + demonstração de valor',
        template: 'first_contact',
        tone: 'professional'
      },
      {
        stepOrder: 2,
        channel: 'EMAIL',
        delayHours: 72, // 3 dias depois
        objective: 'Case study + prova social',
        template: 'case_study_proof',
        tone: 'professional'
      },
      {
        stepOrder: 3,
        channel: 'EMAIL',
        delayHours: 168, // 7 dias depois
        objective: 'Oferta final com incentivo',
        template: 'closing_special_offer',
        tone: 'urgent'
      }
    ]
  },

  DEMO_BOOKED: {
    name: 'Sequência Pós-Demo',
    description: 'Automação para leads que marcaram demo',
    triggerType: 'ENGAGEMENT',
    steps: [
      {
        stepOrder: 1,
        channel: 'EMAIL',
        delayHours: 1,
        objective: 'Confirmação da demo',
        template: 'demo_confirmation',
        tone: 'professional'
      },
      {
        stepOrder: 2,
        channel: 'EMAIL',
        delayHours: 20, // 24h antes
        objective: 'Lembrete de demo',
        template: 'demo_reminder_24h',
        tone: 'friendly'
      }
    ]
  },

  COLD_LEAD: {
    name: 'Sequência de Reaquecimento',
    description: 'Para leads que não responderam em 7 dias (score < 60)',
    triggerType: 'LEAD_SCORED',
    steps: [
      {
        stepOrder: 1,
        channel: 'EMAIL',
        delayHours: 168, // 7 dias após criação
        objective: 'Win-back com nova perspectiva',
        template: 'reengagement_cold',
        tone: 'friendly'
      },
      {
        stepOrder: 2,
        channel: 'EMAIL',
        delayHours: 336, // 14 dias após criação
        objective: 'Última tentativa com oferta',
        template: 'closing_special_offer',
        tone: 'urgent'
      }
    ]
  },

  OBJECTION_PRICE: {
    name: 'Sequência Objeção de Preço',
    description: 'Automação para leads que levantam objeção de preço',
    triggerType: 'ENGAGEMENT',
    steps: [
      {
        stepOrder: 1,
        channel: 'EMAIL',
        delayHours: 2,
        objective: 'Responder objeção com ROI',
        template: 'objection_too_expensive',
        tone: 'professional'
      }
    ]
  }
};

/**
 * Cria uma sequência no banco de dados
 */
export async function createSequence(
  workspaceId: string,
  config: SequenceConfig
): Promise<string> {
  const sequence = await prisma.sequence.create({
    data: {
      workspaceId,
      name: config.name,
      description: config.description,
      triggerType: config.triggerType,
      active: true,
      steps: {
        create: config.steps.map(step => ({
          stepOrder: step.stepOrder,
          channel: step.channel,
          delayHours: step.delayHours,
          objective: step.objective,
          template: step.template,
          tone: step.tone || 'professional',
          active: true
        }))
      }
    }
  });

  return sequence.id;
}

/**
 * Cria todas as sequências padrão para um workspace
 */
export async function initializeDefaultSequences(workspaceId: string): Promise<string[]> {
  const sequenceIds: string[] = [];

  for (const [key, config] of Object.entries(DEFAULT_SEQUENCES)) {
    try {
      const id = await createSequence(workspaceId, config);
      sequenceIds.push(id);
      console.log(`[Sequências] ${key} criada: ${id}`);
    } catch (error) {
      console.error(`[Sequências] Erro ao criar ${key}:`, error);
    }
  }

  return sequenceIds;
}

/**
 * Assign uma sequência a um lead
 */
export async function assignSequenceToLead(
  leadId: string,
  sequenceId: string
): Promise<void> {
  await prisma.lead.update({
    where: { id: leadId },
    data: { assignedSequenceId: sequenceId }
  });
}

/**
 * Get sequência mais apropriada para um lead baseado no score
 */
export async function getApplicableSequence(
  workspaceId: string,
  leadScore: number,
  leadId: string
): Promise<string | null> {
  // Se score alto → lead qualificado
  if (leadScore >= 60) {
    const sequence = await prisma.sequence.findFirst({
      where: {
        workspaceId,
        name: { contains: 'Qualificado' }
      }
    });
    return sequence?.id || null;
  }

  // Se score baixo → reaquecimento
  const coldSequence = await prisma.sequence.findFirst({
    where: {
      workspaceId,
      name: { contains: 'Reaquecimento' }
    }
  });

  return coldSequence?.id || null;
}

/**
 * Get todas as sequências ativas de um workspace
 */
export async function getWorkspaceSequences(workspaceId: string): Promise<any[]> {
  return prisma.sequence.findMany({
    where: {
      workspaceId,
      active: true
    },
    include: {
      steps: {
        where: { active: true },
        orderBy: { stepOrder: 'asc' }
      }
    }
  });
}

// Re-export from scheduler for backward compatibility
export { scheduleSequenceFollowUps } from './scheduler';
