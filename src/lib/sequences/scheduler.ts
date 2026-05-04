/**
 * Sequence Scheduler — Dispara follow-ups nos horários corretos via cron.
 *
 * Responsável por:
 * - Encontrar FollowUpTasks que estão "QUEUED" e vencidas
 * - Disparar emails/SMS via n8n
 * - Atualizar status em tempo real
 */

import { prisma } from '@/lib/db';
import { FollowUpStatus } from '@prisma/client';

interface DispatchResult {
  success: boolean;
  taskId: string;
  leadId: string;
  status: string;
  error?: string;
}

/**
 * Encontra follow-ups pendentes que estão vencidos
 */
export async function findPendingFollowUps(): Promise<any[]> {
  const now = new Date();

  return prisma.followUpTask.findMany({
    where: {
      status: 'QUEUED',
      scheduledFor: {
        lte: now // scheduled for <= now
      }
    },
    include: {
      lead: true,
      sequenceStep: true
    },
    orderBy: { scheduledFor: 'asc' },
    take: 100 // Process em batch de 100
  });
}

/**
 * Dispara um follow-up individual via n8n
 */
export async function dispatchFollowUp(followUpTask: any): Promise<DispatchResult> {
  const { id, leadId, channel, payload, sequenceStep, lead } = followUpTask;

  try {
    // Build n8n webhook payload
    const n8nPayload = {
      followUpTaskId: id,
      leadId,
      channel,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      leadName: lead.fullName,
      template: sequenceStep?.template || payload?.template,
      objective: sequenceStep?.objective,
      reason: followUpTask.reason
    };

    // Dispara via n8n webhook
    const n8nWebhookUrl = process.env.N8N_FOLLOWUP_WEBHOOK;
    if (!n8nWebhookUrl) {
      throw new Error('N8N_FOLLOWUP_WEBHOOK não configurada');
    }

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_KEY}`
      },
      body: JSON.stringify(n8nPayload)
    });

    if (!response.ok) {
      throw new Error(`N8n retornou ${response.status}: ${response.statusText}`);
    }

    // Marca como enviado
    await prisma.followUpTask.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });

    // Log de atividade
    await prisma.activityLog.create({
      data: {
        workspaceId: lead.workspaceId,
        leadId,
        type: 'FOLLOW_UP_SENT',
        details: {
          followUpTaskId: id,
          channel,
          reason: followUpTask.reason,
          template: sequenceStep?.template
        }
      }
    });

    return {
      success: true,
      taskId: id,
      leadId,
      status: 'SENT'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Marca como cancelado (FAILED não existe em FollowUpStatus — usa CANCELLED)
    await prisma.followUpTask.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    return {
      success: false,
      taskId: id,
      leadId,
      status: 'FAILED',
      error: errorMessage
    };
  }
}

/**
 * Processa todos os follow-ups pendentes
 */
export async function processScheduledFollowUps(): Promise<DispatchResult[]> {
  const pendingFollowUps = await findPendingFollowUps();

  if (pendingFollowUps.length === 0) {
    console.log('[Scheduler] Nenhum follow-up pendente');
    return [];
  }

  console.log(`[Scheduler] Processando ${pendingFollowUps.length} follow-ups`);

  const results: DispatchResult[] = [];

  for (const followUp of pendingFollowUps) {
    const result = await dispatchFollowUp(followUp);
    results.push(result);

    // Small delay para evitar throttling
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`[Scheduler] Completo: ${successful} enviados, ${failed} falhados`);

  return results;
}

/**
 * Cria follow-up tasks para uma sequência (chamado quando lead é criado ou scored)
 */
export async function scheduleSequenceFollowUps(
  leadId: string,
  sequenceId: string,
  workspaceId: string
): Promise<string[]> {
  const sequence = await prisma.sequence.findUnique({
    where: { id: sequenceId },
    include: {
      steps: {
        where: { active: true },
        orderBy: { stepOrder: 'asc' }
      }
    }
  });

  if (!sequence || sequence.steps.length === 0) {
    return [];
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) {
    return [];
  }

  const createdAt = lead.createdAt;
  const followUpTaskIds: string[] = [];

  for (const step of sequence.steps) {
    // Calcula tempo de agendamento
    const scheduledFor = new Date(createdAt.getTime() + step.delayHours * 60 * 60 * 1000);

    // Não cria follow-up no passado
    if (scheduledFor < new Date()) {
      continue;
    }

    const followUpTask = await prisma.followUpTask.create({
      data: {
        leadId,
        sequenceStepId: step.id,
        channel: step.channel,
        status: 'QUEUED',
        reason: `Automação: ${sequence.name} - ${step.objective}`,
        scheduledFor,
        payload: {
          template: step.template,
          tone: step.tone,
          objective: step.objective
        }
      }
    });

    followUpTaskIds.push(followUpTask.id);
  }

  return followUpTaskIds;
}

/**
 * Cancela todos os follow-ups de uma sequência para um lead
 */
export async function cancelSequenceFollowUps(leadId: string): Promise<number> {
  const result = await prisma.followUpTask.updateMany({
    where: {
      leadId,
      status: { in: ['QUEUED', 'SENT'] }
    },
    data: {
      status: 'CANCELLED'
    }
  });

  return result.count;
}

/**
 * Get próximo follow-up agendado para um lead
 */
export async function getNextFollowUp(leadId: string): Promise<any | null> {
  return prisma.followUpTask.findFirst({
    where: {
      leadId,
      status: 'QUEUED'
    },
    orderBy: { scheduledFor: 'asc' },
    include: {
      sequenceStep: true
    }
  });
}
