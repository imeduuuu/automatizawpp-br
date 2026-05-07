// Canal In-App para notificações (apenas BD, tempo real via WebSocket)

import { NotificationPayload, NotificationResult } from '../types';
import { renderTemplate } from '../templates';

export async function sendInAppNotification(payload: NotificationPayload): Promise<NotificationResult> {
  try {
    // In-app notifications já são criadas no banco via service.ts
    // Este função apenas valida a estrutura
    const rendered = renderTemplate(payload.template, 'inApp', {
      name: payload.metadata?.name as string || 'Usuário',
      leadName: payload.metadata?.leadName as string,
      company: payload.metadata?.company as string,
      leadId: payload.leadId,
      score: payload.metadata?.score as number
    });

    // Validar que temos dados necessários
    if (!payload.workspaceId || !payload.userId) {
      return {
        success: false,
        channel: 'IN_APP',
        error: 'workspaceId and userId required for in-app notifications'
      };
    }

    return {
      success: true,
      channel: 'IN_APP'
    };
  } catch (error) {
    return {
      success: false,
      channel: 'IN_APP',
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    };
  }
}
