// Serviço de notificações Phase 5B

import { prisma } from '@/lib/db';
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

export async function sendNotification(
  input: SendNotificationInput
): Promise<{ results: NotificationResult[]; notificationId?: string }> {
  const { payload, dryRun } = input;
  const results: NotificationResult[] = [];

  if (dryRun) {
    console.log('[NOTIFICATION DRY RUN]', JSON.stringify(payload, null, 2));
    return { results: [{ success: true, channel: payload.channel }] };
  }

  // Criar registro de notificação no banco
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
        template: payload.template,
        recipientEmail: payload.recipientEmail,
        recipientPhone: payload.recipientPhone,
        recipientSlackId: payload.recipientSlackId,
        metadata: payload.metadata
      }
    });
    notificationId = notification.id;
  } catch (error) {
    console.error('[NOTIFICATION ERROR] Failed to create notification record:', error);
    return {
      results: [{
        success: false,
        channel: payload.channel,
        error: 'Database error',
        retryable: true
      }]
    };
  }

  // Enviar via canal especificado
  try {
    const result = await sendViaChannel(payload);
    if (result.success) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'SENT', sentAt: new Date() }
      });
    } else {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          failureReason: result.error,
          retryCount: 1
        }
      });
    }
    results.push(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'FAILED',
        failureReason: errorMsg,
        retryCount: 1
      }
    });
    results.push({
      success: false,
      channel: payload.channel,
      error: errorMsg,
      retryable: true
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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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
