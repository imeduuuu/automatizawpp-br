// Canal WhatsApp para notificações (Bird API)

import { NotificationPayload, NotificationResult } from '../types';
import { renderTemplate } from '../templates';

export async function sendWhatsappNotification(payload: NotificationPayload): Promise<NotificationResult> {
  if (!payload.recipientPhone) {
    return {
      success: false,
      channel: 'WHATSAPP',
      error: 'Recipient phone not provided'
    };
  }

  try {
    const rendered = renderTemplate(payload.template, 'whatsapp', {
      name: payload.metadata?.name as string || 'Usuário',
      leadName: payload.metadata?.leadName as string,
      company: payload.metadata?.company as string,
      reason: payload.metadata?.reason as string,
      score: payload.metadata?.score as number,
      channel: payload.metadata?.channel as string
    });

    // Bird API para WhatsApp
    const birdApiKey = process.env.BIRD_API_KEY;
    if (!birdApiKey) {
      return {
        success: false,
        channel: 'WHATSAPP',
        error: 'BIRD_API_KEY not configured'
      };
    }

    const phoneNumber = formatPhoneNumber(payload.recipientPhone);
    const message = `${rendered.title}\n\n${rendered.message}`;

    const response = await fetch('https://api.bird.com/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${birdApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: phoneNumber,
        body: message,
        channel: 'whatsapp'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        channel: 'WHATSAPP',
        error: `API error: ${error}`,
        retryable: response.status >= 500
      };
    }

    return {
      success: true,
      channel: 'WHATSAPP'
    };
  } catch (error) {
    return {
      success: false,
      channel: 'WHATSAPP',
      error: error instanceof Error ? error.message : 'Unknown error',
      retryable: true
    };
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove caracteres especiais e adiciona código de país se necessário
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('+') && cleaned.length === 11) {
    return '+55' + cleaned; // Brasil
  }
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  return phone;
}
