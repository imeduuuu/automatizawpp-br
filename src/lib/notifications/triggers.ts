// Gatilhos de notificação integrados com leads e eventos

import { sendNotification } from './service';
import { getAlertRule } from './alert-rules';
import { NotificationPayload } from './types';

interface LeadCreatedEvent {
  leadId: string;
  workspaceId: string;
  ownerUserId?: string;
  fullName?: string;
  company?: string;
  email?: string;
  leadScoreValue?: number;
}

interface LeadQualifiedEvent {
  leadId: string;
  workspaceId: string;
  ownerUserId?: string;
  fullName?: string;
  company?: string;
  email?: string;
  qualificationScore?: number;
}

interface EmailFailedEvent {
  leadId: string;
  workspaceId: string;
  ownerUserId?: string;
  recipientEmail: string;
  reason: string;
}

interface SystemErrorEvent {
  workspaceId: string;
  source: string;
  error: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export async function triggerLeadCreated(event: LeadCreatedEvent) {
  const rule = getAlertRule('lead-created');
  if (!rule) return;

  const payload: NotificationPayload = {
    workspaceId: event.workspaceId,
    userId: event.ownerUserId,
    leadId: event.leadId,
    title: `Novo Lead: ${event.fullName || 'Sem nome'}`,
    message: `${event.fullName || 'Novo prospect'} de ${event.company || 'Empresa desconhecida'} foi registrado no sistema`,
    channel: 'IN_APP',
    priority: rule.priority,
    template: rule.template,
    recipientEmail: event.email,
    metadata: {
      leadName: event.fullName,
      company: event.company,
      source: 'lead-created-trigger'
    }
  };

  // Enviar para cada canal da regra
  for (const channel of rule.channels) {
    payload.channel = channel;
    if (channel === 'EMAIL' && event.email) {
      payload.recipientEmail = event.email;
    }
    await sendNotification({ payload });
  }
}

export async function triggerLeadQualified(event: LeadQualifiedEvent) {
  const rule = getAlertRule('lead-qualified');
  if (!rule) return;

  const payload: NotificationPayload = {
    workspaceId: event.workspaceId,
    userId: event.ownerUserId,
    leadId: event.leadId,
    title: `Lead Qualificado: ${event.fullName || 'Prospect'}`,
    message: `${event.fullName || 'Prospect'} foi qualificado como prospect de alta qualidade (Score: ${event.qualificationScore || 0})`,
    channel: 'IN_APP',
    priority: rule.priority,
    template: rule.template,
    recipientEmail: event.email,
    metadata: {
      leadName: event.fullName,
      company: event.company,
      score: event.qualificationScore,
      source: 'lead-qualified-trigger'
    }
  };

  for (const channel of rule.channels) {
    payload.channel = channel;
    if (channel === 'EMAIL' && event.email) {
      payload.recipientEmail = event.email;
    }
    await sendNotification({ payload });
  }
}

export async function triggerHighIntentLead(
  leadId: string,
  workspaceId: string,
  ownerUserId: string | undefined,
  fullName: string | undefined,
  company: string | undefined,
  email: string | undefined
) {
  const rule = getAlertRule('lead-high-intent');
  if (!rule) return;

  const payload: NotificationPayload = {
    workspaceId,
    userId: ownerUserId,
    leadId,
    title: `ALTA INTENÇÃO: ${fullName || 'Prospect'}`,
    message: `${fullName || 'Prospect'} de ${company || 'Empresa'} mostrou sinais de alta intenção de compra!`,
    channel: 'IN_APP',
    priority: rule.priority,
    template: rule.template,
    recipientEmail: email,
    metadata: {
      leadName: fullName,
      company,
      source: 'high-intent-trigger'
    }
  };

  for (const channel of rule.channels) {
    payload.channel = channel;
    if (channel === 'EMAIL' && email) {
      payload.recipientEmail = email;
    }
    if (channel === 'WHATSAPP' && email) {
      // Extract phone from email or use default
      payload.recipientPhone = extractPhoneFromLead(email);
    }
    await sendNotification({ payload });
  }
}

export async function triggerVipLead(
  leadId: string,
  workspaceId: string,
  ownerUserId: string | undefined,
  fullName: string | undefined,
  company: string | undefined,
  email: string | undefined
) {
  const rule = getAlertRule('lead-vip');
  if (!rule) return;

  const payload: NotificationPayload = {
    workspaceId,
    userId: ownerUserId,
    leadId,
    title: `VIP LEAD: ${fullName || 'Prospect'}`,
    message: `${fullName || 'Prospect'} de ${company || 'Empresa'} foi classificado como lead VIP - Requer atenção prioritária!`,
    channel: 'IN_APP',
    priority: rule.priority,
    template: rule.template,
    recipientEmail: email,
    metadata: {
      leadName: fullName,
      company,
      source: 'vip-trigger'
    }
  };

  for (const channel of rule.channels) {
    payload.channel = channel;
    if (channel === 'EMAIL' && email) {
      payload.recipientEmail = email;
    }
    await sendNotification({ payload });
  }
}

export async function triggerEmailFailed(event: EmailFailedEvent) {
  const rule = getAlertRule('email-failed');
  if (!rule) return;

  const payload: NotificationPayload = {
    workspaceId: event.workspaceId,
    userId: event.ownerUserId,
    leadId: event.leadId,
    title: 'Email Falhou',
    message: `Falha ao enviar email para ${event.recipientEmail}: ${event.reason}`,
    channel: 'IN_APP',
    priority: rule.priority,
    template: rule.template,
    metadata: {
      reason: event.reason,
      email: event.recipientEmail,
      source: 'email-failed-trigger'
    }
  };

  for (const channel of rule.channels) {
    payload.channel = channel;
    await sendNotification({ payload });
  }
}

export async function triggerSystemError(event: SystemErrorEvent) {
  const rule = getAlertRule('system-error');
  if (!rule) return;

  // Para erros críticos, enviar para admins/team owners
  const priority = event.severity === 'CRITICAL' ? 'URGENT' : rule.priority;

  const payload: NotificationPayload = {
    workspaceId: event.workspaceId,
    title: `ERRO DO SISTEMA: ${event.source}`,
    message: `Erro crítico detectado em ${event.source}: ${event.error}`,
    channel: 'IN_APP',
    priority,
    template: rule.template,
    metadata: {
      reason: event.error,
      source: event.source,
      severity: event.severity,
      timestamp: new Date().toISOString()
    }
  };

  for (const channel of rule.channels) {
    payload.channel = channel;
    await sendNotification({ payload });
  }
}

export async function triggerOpportunityHighValue(
  leadId: string,
  workspaceId: string,
  ownerUserId: string | undefined,
  fullName: string | undefined,
  company: string | undefined,
  email: string | undefined,
  estimatedValue: number
) {
  const rule = getAlertRule('opportunity-high-value');
  if (!rule) return;

  const payload: NotificationPayload = {
    workspaceId,
    userId: ownerUserId,
    leadId,
    title: `OPORTUNIDADE ALTO VALOR: ${fullName || 'Prospect'}`,
    message: `${fullName || 'Prospect'} de ${company || 'Empresa'} representa uma oportunidade de ~$${estimatedValue.toLocaleString()}`,
    channel: 'IN_APP',
    priority: rule.priority,
    template: rule.template,
    recipientEmail: email,
    metadata: {
      leadName: fullName,
      company,
      estimatedValue,
      source: 'high-value-trigger'
    }
  };

  for (const channel of rule.channels) {
    payload.channel = channel;
    if (channel === 'EMAIL' && email) {
      payload.recipientEmail = email;
    }
    await sendNotification({ payload });
  }
}

function extractPhoneFromLead(email: string): string | undefined {
  // Este é um placeholder - em produção, buscar o telefone do lead no BD
  return undefined;
}
