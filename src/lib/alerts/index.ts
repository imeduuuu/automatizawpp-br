/**
 * Alert system para Phase 5D - Monitoring & Observability
 * Cria e gerencia alertas para falhas críticas do sistema
 */

import { prisma } from '@/lib/db';
import { EventSeverity, AlertStatus } from '@prisma/client';
import { logEvent } from '@/lib/logging';

export interface AlertPayload {
  title: string;
  description: string;
  alertType: string; // "service_down", "high_error_rate", "quota_exceeded"
  severity: EventSeverity;
  component?: string;
  workspaceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Criar um novo alerta
 */
export async function createAlert(payload: AlertPayload) {
  const alert = await prisma.systemAlert.create({
    data: {
      title: payload.title,
      description: payload.description,
      alertType: payload.alertType,
      severity: payload.severity,
      component: payload.component,
      workspaceId: payload.workspaceId,
      metadata: payload.metadata,
      status: 'ACTIVE'
    }
  });

  // Log do alerta criado
  await logEvent({
    eventType: 'alert.created',
    title: `Alerta: ${payload.title}`,
    description: payload.description,
    severity: payload.severity,
    source: 'SYSTEM',
    context: {
      workspaceId: payload.workspaceId,
      metadata: { alertId: alert.id, alertType: payload.alertType }
    }
  });

  return alert;
}

/**
 * Reconhecer um alerta (marcar como lido)
 */
export async function acknowledgeAlert(alertId: string, userId?: string) {
  const alert = await prisma.systemAlert.update({
    where: { id: alertId },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedBy: userId
    }
  });

  await logEvent({
    eventType: 'alert.acknowledged',
    title: `Alerta reconhecido: ${alert.title}`,
    source: 'SYSTEM',
    context: {
      workspaceId: alert.workspaceId ?? undefined,
      userId,
      metadata: { alertId }
    }
  });

  return alert;
}

/**
 * Resolver um alerta
 */
export async function resolveAlert(alertId: string, userId?: string) {
  const alert = await prisma.systemAlert.update({
    where: { id: alertId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolvedBy: userId
    }
  });

  await logEvent({
    eventType: 'alert.resolved',
    title: `Alerta resolvido: ${alert.title}`,
    source: 'SYSTEM',
    context: {
      workspaceId: alert.workspaceId ?? undefined,
      userId,
      metadata: { alertId }
    }
  });

  return alert;
}

/**
 * Obter alertas ativos para um workspace
 */
export async function getActiveAlerts(workspaceId?: string) {
  return prisma.systemAlert.findMany({
    where: {
      ...(workspaceId && { workspaceId }),
      status: 'ACTIVE'
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Obter histórico de alertas
 */
export async function getAlertHistory(workspaceId?: string, limit: number = 100) {
  return prisma.systemAlert.findMany({
    where: {
      ...(workspaceId && { workspaceId })
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Verificar e criar alertas baseado em eventos
 */
export async function checkAndCreateAlerts(workspaceId?: string) {
  // Obter últimos eventos críticos
  const recentErrors = await prisma.event.findMany({
    where: {
      ...(workspaceId && { workspaceId }),
      severity: { in: ['ERROR', 'CRITICAL'] },
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // últimos 5 minutos
      }
    }
  });

  // Se muitos erros em pouco tempo → alert
  if (recentErrors.length > 5) {
    const existingAlert = await prisma.systemAlert.findFirst({
      where: {
        ...(workspaceId && { workspaceId }),
        alertType: 'high_error_rate',
        status: 'ACTIVE'
      }
    });

    if (!existingAlert) {
      await createAlert({
        title: 'Taxa de erros elevada detectada',
        description: `${recentErrors.length} erros registrados nos últimos 5 minutos`,
        alertType: 'high_error_rate',
        severity: 'ERROR',
        workspaceId,
        metadata: { errorCount: recentErrors.length }
      });
    }
  }

  // Verificar falhas de webhook
  const webhookFailures = await prisma.toolCallLog.findMany({
    where: {
      ...(workspaceId && { workspaceId }),
      success: false,
      createdAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000) // últimos 10 minutos
      }
    }
  });

  if (webhookFailures.length > 3) {
    const existingAlert = await prisma.systemAlert.findFirst({
      where: {
        ...(workspaceId && { workspaceId }),
        alertType: 'webhook_failures',
        status: 'ACTIVE'
      }
    });

    if (!existingAlert) {
      await createAlert({
        title: 'Falhas de webhook detectadas',
        description: `${webhookFailures.length} webhook calls falharam nos últimos 10 minutos`,
        alertType: 'webhook_failures',
        severity: 'WARNING',
        component: 'n8n_webhook',
        workspaceId,
        metadata: { failureCount: webhookFailures.length }
      });
    }
  }
}

/**
 * Notificar admin sobre alertas críticos (placeholder para integração de email)
 */
export async function notifyAdminAboutAlert(alert: any) {
  // TODO: Integrar com sistema de notificação (email, slack, etc)
  console.log(`[ALERT NOTIFICATION] ${alert.title}: ${alert.description}`);

  // Quando implementar, fazer assim:
  // if (process.env.ADMIN_EMAIL && alert.severity === 'CRITICAL') {
  //   await sendEmail({
  //     to: process.env.ADMIN_EMAIL,
  //     subject: `⚠️ ALERTA CRÍTICO: ${alert.title}`,
  //     body: alert.description
  //   });
  // }
}
