// Serviço de notificações Phase 5B

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NotificationPayload, NotificationResult, NotificationChannel, SendNotificationInput } from './types';
import { sendEmailNotification } from './channels/email';
import { sendWhatsappNotification } from './channels/whatsapp';
import { sendInAppNotification } from './channels/in-app';
import { sendSlackNotification } from './channels/slack';
import { renderTemplate } from './templates';

interface NotificationLogs {
  sent: NotificationResult[];
  failed: NotificationResult[];
}

/**
 * Verifica se um canal está configurado via env vars.
 * Sprint pós-V.L.A.E.G. — fecha deuda #3: evita criar Notification records FAILED
 * quando o webhook/API key do canal externo não existe (caso típico de SLACK
 * em ambientes que não usam Slack).
 *
 * IN_APP: sempre habilitado (puramente DB-driven, renderiza no NotificationBell).
 * EMAIL: pelo menos um dos providers (Resend/Brevo/Bird).
 * WHATSAPP: API Bird configurada.
 * SLACK: webhook configurado.
 */
export function isChannelEnabled(channel: NotificationChannel): boolean {
  switch (channel) {
    case 'IN_APP':
      return true;
    case 'EMAIL':
      return Boolean(process.env.RESEND_API_KEY || process.env.BREVO_API_KEY || process.env.BIRD_EMAIL_CHANNEL_ID);
    case 'WHATSAPP':
      return Boolean(process.env.BIRD_API_KEY && process.env.BIRD_WORKSPACE_ID && process.env.BIRD_WHATSAPP_CHANNEL_ID);
    case 'SLACK':
      return Boolean(process.env.SLACK_WEBHOOK_URL);
    default:
      return false;
  }
}

/**
 * Filtra a lista de canais de uma regra para incluir só os habilitados.
 * Usado em `triggers.ts` antes de iterar `rule.channels`.
 */
export function filterEnabledChannels(channels: NotificationChannel[]): NotificationChannel[] {
  return channels.filter(isChannelEnabled);
}

export async function sendNotification(
  input: SendNotificationInput
): Promise<{ results: NotificationResult[]; notificationId?: string }> {
  const { payload, dryRun } = input;
  const results: NotificationResult[] = [];

  if (dryRun) {
    console.log('[NOTIFICATION DRY RUN]', JSON.stringify(payload, null, 2));
    return { results: [{ success: true, channel: payload.channel }] };
  }

  // Skip silencioso para canais externos não configurados (ex: SLACK sem webhook).
  // Evita poluir a tabela `Notification` com records FAILED por config ausente.
  // IN_APP nunca cai aqui — sempre está habilitado.
  if (!isChannelEnabled(payload.channel)) {
    console.log(`[NOTIFICATION SKIPPED] Channel ${payload.channel} not configured (env var ausente)`);
    return {
      results: [{ success: true, channel: payload.channel, error: `Channel ${payload.channel} disabled (no config)` }],
    };
  }

  // Limpieza V.L.A.E.G. — fecha deuda #1.
  // O modelo `Notification` agora está declarado em `prisma/schema.prisma` e
  // sincronizado com a DB via migration `lead_lang_optional_and_notifications_sync`.
  // Removido o guard defensivo `notificationDelegate` — agora confiamos no client.
  let notificationId: string | undefined;
  try {
    const notification = await prisma.notification.create({
      data: {
        workspaceId: payload.workspaceId,
        userId: payload.userId,
        leadId: payload.leadId,
        title: payload.title,
        message: payload.message,
        channel: payload.channel,
        priority: payload.priority || 'MEDIUM',
        template: payload.template as unknown as import('@prisma/client').NotificationTemplate,
        recipientEmail: payload.recipientEmail,
        recipientPhone: payload.recipientPhone,
        recipientSlackId: payload.recipientSlackId,
        metadata: payload.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    notificationId = notification.id;
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Failed to create notification record:', error);
    return {
      results: [
        {
          success: false,
          channel: payload.channel,
          error: 'Database error',
          retryable: true,
        },
      ],
    };
  }

  // Envio pelo canal especificado. Se o registro foi criado, sincronizamos status.
  try {
    const result = await sendViaChannel(payload);
    if (result.success) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } else {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          failureReason: result.error,
          retryCount: 1,
        },
      });
    }
    results.push(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'FAILED',
        failureReason: errorMsg,
        retryCount: 1,
      },
    });
    results.push({
      success: false,
      channel: payload.channel,
      error: errorMsg,
      retryable: true,
    });
  }

  return { results, notificationId };
}

async function sendViaChannel(payload: NotificationPayload): Promise<NotificationResult> {
  switch (payload.channel) {
    case 'EMAIL':
      return sendEmailNotification(payload);
    case 'WHATSAPP':
      return sendWhatsappNotification(payload);
    case 'IN_APP':
      return sendInAppNotification(payload);
    case 'SLACK':
      return sendSlackNotification(payload);
    default:
      return {
        success: false,
        channel: payload.channel,
        error: 'Unknown channel'
      };
  }
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date(), status: 'READ' }
    });
    return true;
  } catch {
    return false;
  }
}

export async function getUserNotifications(
  workspaceId: string,
  userId: string,
  limit = 50,
  offset = 0
) {
  return prisma.notification.findMany({
    where: {
      workspaceId,
      userId
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });
}

export async function getUnreadCount(workspaceId: string, userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      workspaceId,
      userId,
      status: { not: 'READ' }
    }
  });
}

export async function clearAllNotifications(workspaceId: string, userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      workspaceId,
      userId
    },
    data: { status: 'ARCHIVED' }
  });
  return result.count;
}

export async function retryFailedNotifications(limit = 10): Promise<NotificationLogs> {
  const logs: NotificationLogs = { sent: [], failed: [] };
  const failedNotifs = await prisma.notification.findMany({
    where: {
      status: 'FAILED',
      retryCount: { lt: 3 }
    },
    take: limit,
    orderBy: { createdAt: 'asc' }
  });

  for (const notif of failedNotifs) {
    const payload: NotificationPayload = {
      workspaceId: notif.workspaceId,
      userId: notif.userId || undefined,
      leadId: notif.leadId || undefined,
      title: notif.title,
      message: notif.message,
      channel: notif.channel as NotificationChannel,
      priority: notif.priority as any,
      template: notif.template as any,
      recipientEmail: notif.recipientEmail || undefined,
      recipientPhone: notif.recipientPhone || undefined,
      recipientSlackId: notif.recipientSlackId || undefined,
      metadata: notif.metadata as any
    };

    try {
      const result = await sendViaChannel(payload);
      if (result.success) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: { status: 'SENT', sentAt: new Date() }
        });
        logs.sent.push(result);
      } else {
        await prisma.notification.update({
          where: { id: notif.id },
          data: { retryCount: notif.retryCount + 1 }
        });
        logs.failed.push(result);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
      await prisma.notification.update({
        where: { id: notif.id },
        data: { retryCount: notif.retryCount + 1 }
      });
      logs.failed.push({
        success: false,
        channel: notif.channel as NotificationChannel,
        error: errorMsg
      });
    }
  }

  return logs;
}
