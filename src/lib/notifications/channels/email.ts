// Canal de email para notificações

import { NotificationPayload, NotificationResult } from '../types';
import { renderTemplate } from '../templates';
import { sendSmtpMail } from '@/lib/mail';

export async function sendEmailNotification(payload: NotificationPayload): Promise<NotificationResult> {
  if (!payload.recipientEmail) {
    return {
      success: false,
      channel: 'EMAIL',
      error: 'Recipient email not provided'
    };
  }

  try {
    const rendered = renderTemplate(payload.template, 'email', {
      name: payload.metadata?.name as string || 'Usuário',
      email: payload.recipientEmail,
      company: payload.metadata?.company as string,
      leadId: payload.leadId,
      leadName: payload.metadata?.leadName as string,
      reason: payload.metadata?.reason as string,
      score: payload.metadata?.score as number,
      channel: payload.metadata?.channel as string,
      timestamp: new Date().toISOString(),
      error: payload.metadata?.error as string
    });

    const result = await sendSmtpMail({
      to: payload.recipientEmail,
      subject: rendered.subject || 'Notificação AutomatizaWPP',
      html: rendered.html || `<p>${rendered.message}</p>`,
      text: rendered.message
    });

    return {
      success: result.ok,
      channel: 'EMAIL',
      error: result.ok ? undefined : result.error
    };
  } catch (error) {
    return {
      success: false,
      channel: 'EMAIL',
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      retryable: true
    };
  }
}
