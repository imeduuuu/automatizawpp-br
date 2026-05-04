// Canal WhatsApp para notificações (Bird API v2)

import { NotificationPayload, NotificationResult } from '../types';
import { renderTemplate } from '../templates';

export async function sendWhatsappNotification(payload: NotificationPayload): Promise<NotificationResult> {
  if (!payload.recipientPhone) {
    return {
      success: false,
      channel: 'WHATSAPP',
      error: 'Telefone do destinatário não informado'
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

    // Bird API v2 — verificar credenciais obrigatórias antes de tentar enviar
    const birdApiKey = process.env.BIRD_API_KEY;
    const birdWorkspaceId = process.env.BIRD_WORKSPACE_ID;
    const birdWaChannelId = process.env.BIRD_WHATSAPP_CHANNEL_ID;

    if (!birdApiKey) {
      return { success: false, channel: 'WHATSAPP', error: 'BIRD_API_KEY não configurada' };
    }

    if (!birdWorkspaceId) {
      return { success: false, channel: 'WHATSAPP', error: 'BIRD_WORKSPACE_ID não configurado' };
    }

    if (!birdWaChannelId) {
      // Canal WhatsApp Business ainda não ativado no workspace Bird.
      // Ativar em: app.bird.com → Channels → WhatsApp → Settings
      return {
        success: false,
        channel: 'WHATSAPP',
        error: 'BIRD_WHATSAPP_CHANNEL_ID não configurado — canal WhatsApp Business não ativo no workspace Bird'
      };
    }

    const phoneNumber = formatPhoneNumber(payload.recipientPhone);
    const messageText = `${rendered.title}\n\n${rendered.message}`;

    // POST /workspaces/{workspaceId}/messages — Bird API v2
    // Auth: AccessKey (não Bearer — padrão Bird API v2)
    const endpoint = `https://api.bird.com/workspaces/${birdWorkspaceId}/messages`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${birdApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channelId: birdWaChannelId,
        receiver: {
          contacts: [{ identifierValue: phoneNumber }]
        },
        message: {
          body: {
            type: 'text',
            text: { text: messageText }
          }
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        channel: 'WHATSAPP',
        error: `Bird API erro ${response.status}: ${errorBody}`,
        retryable: response.status >= 500
      };
    }

    return { success: true, channel: 'WHATSAPP' };
  } catch (error) {
    return {
      success: false,
      channel: 'WHATSAPP',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      retryable: true
    };
  }
}

/**
 * Normaliza o número de telefone para formato E.164 (+CCXXXXXXXXX).
 * - Remove qualquer caractere não-numérico antes de verificar prefixo/tamanho.
 * - Brasil: 11 dígitos sem 0 inicial → adiciona +55
 * - Não adiciona +55 se começa com 0 (evita +550XXXXXXXXXX inválido)
 */
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // Número original já tinha '+' → estava em E.164, devolver com '+'
  if (phone.trim().startsWith('+')) {
    return '+' + cleaned;
  }

  // Brasil: 11 dígitos sem zero inicial (ex: 11912345678)
  if (cleaned.length === 11 && !cleaned.startsWith('0')) {
    return '+55' + cleaned;
  }

  // Brasil: 13 dígitos começando com 55 (DDI já incluso, ex: 5511912345678)
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return '+' + cleaned;
  }

  return '+' + cleaned;
}
