import { ChannelType, MessageDirection } from '@prisma/client';
import { prisma } from '@/lib/db';

export type Channel = ChannelType;

// Sprint 1.7 V.L.A.E.G. — BUG A:
// `routeMessage` no persistía Message OUTBOUND en DB, perdíamos la trazabilidad
// del draft despachado. Ahora aceptamos un `persistContext` opcional. Si viene,
// creamos `Message` con `direction='OUTBOUND'` (sent OK o failed con metadata).
// Mantenemos el formato antiguo (sin context) para que `followup/runner.ts`
// siga funcionando sin cambios urgentes (deuda menor: cuando refactoricemos
// follow-ups, también lo cableamos).
export interface RoutePersistContext {
  workspaceId: string;
  leadId: string;
  conversationId?: string | null;
  language?: string | null;
  agentRunId?: string | null;
}

export interface SendOptions {
  to: string;
  subject?: string;
  body: string;
  channel: Channel;
  /** Si está presente, persistimos el OUTBOUND en DB (BUG A fix). */
  persistContext?: RoutePersistContext;
}

export interface OutboundDeliveryResult {
  sent: boolean;
  messageId?: string;
  /** ID del registro `Message` creado en DB (cuando se persiste). */
  persistedMessageId?: string;
  /** Provider real usado (resend, brevo, bird). Útil para Schema D. */
  provider?: string;
  /** queued | sent | delivered | bounced | failed. */
  deliveryStatus?: string;
  error?: string;
}

interface ProviderResult {
  sent: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
}

export async function routeMessage(options: SendOptions): Promise<OutboundDeliveryResult> {
  const { channel, to, body, subject, persistContext } = options;

  let providerResult: ProviderResult = { sent: false };
  try {
    if (channel === 'EMAIL') {
      providerResult = await sendEmail({ to, subject: subject || 'AutomatizaWPP', body });
    } else if (channel === 'WHATSAPP') {
      providerResult = await sendWhatsApp({ to, body });
    } else if (channel === 'SMS') {
      providerResult = await sendSMS({ to, body });
    } else {
      providerResult = { sent: false, error: `Canal no soportado: ${channel}` };
    }
  } catch (error) {
    console.error(`Failed to send via ${channel}:`, error);
    providerResult = {
      sent: false,
      error: error instanceof Error ? error.message : 'Unknown send error',
    };
  }

  const deliveryStatus = providerResult.sent ? 'sent' : 'failed';
  const result: OutboundDeliveryResult = {
    sent: providerResult.sent,
    messageId: providerResult.messageId,
    provider: providerResult.provider,
    deliveryStatus,
    error: providerResult.error,
  };

  // BUG A fix: persistimos el Message OUTBOUND tanto si se envió como si falló.
  // conversationId é obrigatório no modelo Message — só persiste se estiver disponível.
  if (persistContext && persistContext.conversationId) {
    try {
      const persisted = await prisma.message.create({
        data: {
          leadId: persistContext.leadId,
          conversationId: persistContext.conversationId,
          channel,
          direction: 'OUTBOUND' satisfies MessageDirection,
          body,
          metadata: {
            provider: providerResult.provider ?? null,
            deliveryStatus,
            providerMessageId: providerResult.messageId ?? null,
            deliveryError: providerResult.error ?? null,
            language: persistContext.language ?? null,
            agentRunId: persistContext.agentRunId ?? null,
            subject: subject ?? null,
            to,
          },
        },
      });
      result.persistedMessageId = persisted.id;
    } catch (err) {
      // No tumbamos el envío si falla la persistencia, solo logueamos.
      console.error('routeMessage persistence failed:', err);
    }
  }

  return result;
}

async function sendEmail(opts: { to: string; subject: string; body: string }): Promise<ProviderResult> {
  if (process.env.EMAIL_PROVIDER === 'bird') {
    return sendBirdEmail(opts);
  }

  // Resend (priority)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'AutomatizaWPP <hola@automatizawpp.com>',
        to: [opts.to],
        subject: opts.subject,
        html: `<p>${opts.body.replace(/\n/g, '<br>')}</p>`,
      }),
    });
    if (response.ok) {
      const data = await response.json() as { id?: string };
      return { sent: true, messageId: data.id, provider: 'resend' };
    }
    const errText = await response.text().catch(() => '');
    return { sent: false, provider: 'resend', error: `Resend ${response.status}: ${errText.slice(0, 200)}` };
  }

  // Brevo (fallback)
  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) {
    return { sent: false, error: 'No email provider configurado (RESEND_API_KEY/BREVO_API_KEY ausentes)' };
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: 'hola@automatizawpp.com', name: 'AutomatizaWPP' },
      to: [{ email: opts.to }],
      subject: opts.subject,
      htmlContent: `<p>${opts.body}</p>`,
    }),
  });

  if (response.ok) {
    const data = await response.json() as { messageId?: string };
    return { sent: true, messageId: data.messageId, provider: 'brevo' };
  }
  const errText = await response.text().catch(() => '');
  return { sent: false, provider: 'brevo', error: `Brevo ${response.status}: ${errText.slice(0, 200)}` };
}

async function sendBirdEmail(opts: { to: string; subject: string; body: string }): Promise<ProviderResult> {
  const apiKey = process.env.BIRD_API_KEY;
  const workspaceId = process.env.BIRD_WORKSPACE_ID;
  const channelId = process.env.BIRD_EMAIL_CHANNEL_ID;
  if (!apiKey || !workspaceId || !channelId) {
    return { sent: false, provider: 'bird', error: 'BIRD env vars ausentes' };
  }

  const response = await fetch(
    `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiver: { contacts: [{ identifierValue: opts.to }] },
        body: {
          type: 'email',
          email: {
            subject: opts.subject,
            html: `<p>${opts.body.replace(/\n/g, '<br>')}</p>`,
          },
        },
      }),
    }
  );

  if (response.ok) {
    const data = await response.json() as { id?: string };
    return { sent: true, messageId: data.id, provider: 'bird' };
  }
  const errText = await response.text().catch(() => '');
  return { sent: false, provider: 'bird', error: `Bird ${response.status}: ${errText.slice(0, 200)}` };
}

/**
 * Envio WhatsApp via Bird API.
 *
 * Bird endpoint: POST /workspaces/{workspaceId}/channels/{channelId}/messages
 * Docs: https://docs.bird.com/api/channels-api/supported-channels/programmable-whatsapp
 *
 * Modos suportados:
 * - **freeform** (texto livre): só funciona dentro de 24h da última msg do cliente.
 *   Fora da janela, Meta rejeita com erro `re_engagement` e o template HSM é obrigatório.
 * - **template HSM**: usa um template pré-aprovado pelo Meta. Necessário para
 *   iniciar conversas ou re-engajar leads frios. Configure o nome do template
 *   em `BIRD_WHATSAPP_DEFAULT_TEMPLATE` e os parâmetros via `opts.templateParams`.
 *
 * Env vars:
 * - `BIRD_API_KEY` (obrigatório)
 * - `BIRD_WORKSPACE_ID` (obrigatório)
 * - `BIRD_WHATSAPP_CHANNEL_ID` (preferido) ou `BIRD_CHANNEL_ID` (fallback compat)
 * - `BIRD_WHATSAPP_DEFAULT_TEMPLATE` (opcional, nome do template HSM padrão)
 */
interface SendWhatsAppOpts {
  to: string;
  body: string;
  /** Se passado, ignora `body` e envia template HSM. */
  template?: {
    projectId: string;
    version?: string;
    locale?: string;
    parameters?: Array<{ type: 'string' | 'number'; key: string; value: string }>;
  };
}

async function sendWhatsApp(opts: SendWhatsAppOpts): Promise<ProviderResult> {
  const apiKey = process.env.BIRD_API_KEY;
  const workspaceId = process.env.BIRD_WORKSPACE_ID;
  const channelId = process.env.BIRD_WHATSAPP_CHANNEL_ID || process.env.BIRD_CHANNEL_ID;

  if (!apiKey || !workspaceId || !channelId) {
    return {
      sent: false,
      provider: 'bird',
      error: 'BIRD vars ausentes (API_KEY/WORKSPACE_ID/WHATSAPP_CHANNEL_ID)',
    };
  }

  const url = `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`;

  let payload: Record<string, unknown>;
  if (opts.template) {
    payload = {
      receiver: { contacts: [{ identifierValue: opts.to }] },
      template: {
        projectId: opts.template.projectId,
        version: opts.template.version,
        locale: opts.template.locale || 'es',
        parameters: opts.template.parameters || [],
      },
    };
  } else {
    payload = {
      receiver: { contacts: [{ identifierValue: opts.to }] },
      body: { type: 'text', text: { text: opts.body } },
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `AccessKey ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const data = (await response.json().catch(() => ({}))) as { id?: string };
    return { sent: true, messageId: data.id, provider: 'bird' };
  }

  const errText = await response.text().catch(() => '');
  return {
    sent: false,
    provider: 'bird',
    error: `Bird WhatsApp ${response.status}: ${errText.slice(0, 200)}`,
  };
}

async function sendSMS(_opts: { to: string; body: string }): Promise<ProviderResult> {
  // Implement Twilio or Bird SMS
  return { sent: false, provider: 'stub', error: 'SMS no operativo (stub)' };
}

export async function sendOutboundMessage(options: SendOptions): Promise<OutboundDeliveryResult> {
  return routeMessage(options);
}
