// Gerenciador de preferências de notificações

import { prisma } from '@/lib/db';
import { NotificationTemplate } from '@prisma/client';
import { NotificationChannel, NotificationTemplateType } from './types';

export async function getUserPreferences(
  workspaceId: string,
  userId: string,
  channel: NotificationChannel
) {
  let preferences = await prisma.notificationPreference.findFirst({
    where: {
      userId,
      channel
    }
  });

  // Se não existe, criar com padrões
  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        workspaceId,
        userId,
        channel,
        leadCreated: true,
        leadQualified: true,
        leadHighIntent: true,
        leadVip: true,
        emailFailed: true,
        callCompleted: false,
        followUpSent: false,
        systemError: true,
        systemHealth: false,
        opportunityHighValue: true
      }
    });
  }

  return preferences;
}

export async function updateUserPreferences(
  userId: string,
  channel: NotificationChannel,
  updates: Partial<{
    leadCreated: boolean;
    leadQualified: boolean;
    leadHighIntent: boolean;
    leadVip: boolean;
    emailFailed: boolean;
    callCompleted: boolean;
    followUpSent: boolean;
    systemError: boolean;
    systemHealth: boolean;
    opportunityHighValue: boolean;
  }>
) {
  const existing = await prisma.notificationPreference.findFirst({
    where: { userId, channel }
  });
  if (!existing) {
    throw new Error(`NotificationPreference não encontrada para userId=${userId} channel=${channel}`);
  }
  return prisma.notificationPreference.update({
    where: { id: existing.id },
    data: updates
  });
}

export async function isNotificationEnabled(
  userId: string,
  channel: NotificationChannel,
  template: NotificationTemplateType
): Promise<boolean> {
  const prefs = await prisma.notificationPreference.findFirst({
    where: {
      userId,
      channel
    }
  });

  if (!prefs) return true; // Default habilitado se não encontrar prefs

  const templateMap: Record<NotificationTemplateType, keyof typeof prefs> = {
    'LEAD_CREATED': 'leadCreated',
    'LEAD_QUALIFIED': 'leadQualified',
    'LEAD_HIGH_INTENT': 'leadHighIntent',
    'LEAD_VIP': 'leadVip',
    'LEAD_ESCALATED': 'leadVip', // escalonamento: reutiliza preferência VIP como fallback
    'EMAIL_FAILED': 'emailFailed',
    'CALL_COMPLETED': 'callCompleted',
    'FOLLOW_UP_SENT': 'followUpSent',
    'SYSTEM_ERROR': 'systemError',
    'SYSTEM_HEALTH': 'systemHealth',
    'OPPORTUNITY_HIGH_VALUE': 'opportunityHighValue'
  };

  const prefKey = templateMap[template];
  return (prefs as any)[prefKey] ?? true;
}

export async function saveNotificationTemplate(
  workspaceId: string,
  templateType: NotificationTemplateType,
  channel: NotificationChannel,
  config: {
    subject?: string;
    titleTemplate: string;
    messageTemplate: string;
    htmlTemplate?: string;
    variables?: string[];
  }
) {
  const prismaTemplateType = templateType as unknown as NotificationTemplate;
  const existing = await prisma.notificationTemplateConfig.findFirst({
    where: { workspaceId, templateType: prismaTemplateType, channel }
  });
  if (existing) {
    return prisma.notificationTemplateConfig.update({
      where: { id: existing.id },
      data: config
    });
  }
  return prisma.notificationTemplateConfig.create({
    data: {
      workspaceId,
      templateType: prismaTemplateType,
      channel,
      ...config
    }
  });
}

export async function getNotificationTemplate(
  workspaceId: string,
  templateType: NotificationTemplateType,
  channel: NotificationChannel
) {
  return prisma.notificationTemplateConfig.findFirst({
    where: {
      workspaceId,
      templateType: templateType as unknown as NotificationTemplate,
      channel
    }
  });
}
