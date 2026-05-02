// Canal Slack para notificações

import { NotificationPayload, NotificationResult } from '../types';
import { renderTemplate } from '../templates';

export async function sendSlackNotification(payload: NotificationPayload): Promise<NotificationResult> {
  try {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!slackWebhookUrl) {
      return {
        success: false,
        channel: 'SLACK',
        error: 'SLACK_WEBHOOK_URL not configured'
      };
    }

    const rendered = renderTemplate(payload.template, 'slack', {
      name: payload.metadata?.name as string || 'Usuário',
      leadName: payload.metadata?.leadName as string,
      company: payload.metadata?.company as string,
      reason: payload.metadata?.reason as string,
      score: payload.metadata?.score as number,
      timestamp: new Date().toISOString()
    });

    const priorityColor = {
      'LOW': '#36a64f',
      'MEDIUM': '#ffa500',
      'HIGH': '#ff6b00',
      'URGENT': '#ff0000'
    };

    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color: priorityColor[payload.priority || 'MEDIUM'],
          title: rendered.title,
          text: rendered.message,
          footer: 'AutomatizaWPP Notifications',
          ts: Math.floor(Date.now() / 1000)
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        channel: 'SLACK',
        error: `API error: ${error}`,
        retryable: response.status >= 500
      };
    }

    return {
      success: true,
      channel: 'SLACK'
    };
  } catch (error) {
    return {
      success: false,
      channel: 'SLACK',
      error: error instanceof Error ? error.message : 'Unknown error',
      retryable: true
    };
  }
}
