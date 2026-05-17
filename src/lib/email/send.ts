// lib/email/send.ts — envío real vía Bird API + persistencia en BD
import { prisma } from '@/lib/db';

const BIRD_API = 'https://api.bird.com';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;       // texto plano
  html?: string;      // HTML opcional
  fromName?: string;  // nombre del remitente
  leadId?: string;    // si hay lead asociado, vincular
  conversationId?: string;
  replyToMessageId?: string; // si es respuesta, ID del mensaje original
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;   // ID en nuestra BD
  birdMessageId?: string;
  error?: string;
}

function birdConfig() {
  return {
    apiKey: process.env.BIRD_API_KEY?.trim() || '',
    workspaceId: process.env.BIRD_WORKSPACE_ID?.trim() || '',
    channelId: process.env.BIRD_EMAIL_CHANNEL_ID?.trim() || ''
  };
}

export async function sendEmailViaBird(params: SendEmailParams): Promise<SendEmailResult> {
  const { apiKey, workspaceId, channelId } = birdConfig();
  if (!apiKey || !workspaceId || !channelId) {
    return { ok: false, error: 'Configuración Bird incompleta (BIRD_API_KEY/BIRD_WORKSPACE_ID/BIRD_EMAIL_CHANNEL_ID)' };
  }

  const fromEmail = 'inbox@automatizawpp.com';
  const htmlBody = params.html || `<p>${escapeHtml(params.body).replace(/\n/g, '<br>')}</p>`;

  const payload = {
    receiver: { contacts: [{ identifierValue: params.to }] },
    body: {
      type: 'email',
      email: {
        subject: params.subject,
        from: { email: fromEmail, name: params.fromName || 'AutomatizaWPP' },
        to: [{ email: params.to }],
        html: { html: htmlBody },
        text: { text: params.body }
      }
    }
  };

  let birdMessageId: string | undefined;
  try {
    const res = await fetch(`${BIRD_API}/workspaces/${workspaceId}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `AccessKey ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000)
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `Bird ${res.status}: ${text.slice(0, 300)}` };
    }
    try {
      const json = JSON.parse(text);
      birdMessageId = json.id || json.messageId;
    } catch {
      // continúa sin id
    }
  } catch (e) {
    return { ok: false, error: `Bird fetch error: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Persistir en BD si tenemos leadId+conversationId
  if (params.leadId && params.conversationId) {
    try {
      const created = await prisma.message.create({
        data: {
          leadId: params.leadId,
          conversationId: params.conversationId,
          channel: 'EMAIL',
          direction: 'OUTBOUND',
          body: params.body,
          sentAt: new Date(),
          metadata: {
            subject: params.subject,
            html: params.html || null,
            fromEmail,
            toEmail: params.to,
            birdMessageId,
            replyToMessageId: params.replyToMessageId || null
          }
        }
      });
      return { ok: true, messageId: created.id, birdMessageId };
    } catch (e) {
      // El email se envió, solo falló persistencia
      return { ok: true, birdMessageId, error: `Email enviado pero error guardando en BD: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  return { ok: true, birdMessageId };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
