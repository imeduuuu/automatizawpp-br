// lib/email/send.ts — envío real vía Bird API + persistencia en BD
// Resuelve Lead+Conversation automáticamente si no se proveen explícitamente.
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

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
  workspaceId?: string;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  birdMessageId?: string;
  leadId?: string;
  conversationId?: string;
  error?: string;
}

function birdConfig() {
  return {
    apiKey: process.env.BIRD_API_KEY?.trim() || '',
    workspaceId: process.env.BIRD_WORKSPACE_ID?.trim() || '',
    channelId: process.env.BIRD_EMAIL_CHANNEL_ID?.trim() || ''
  };
}

async function resolveLeadAndConversation(params: SendEmailParams): Promise<{ leadId: string; conversationId: string } | null> {
  if (params.leadId && params.conversationId) {
    return { leadId: params.leadId, conversationId: params.conversationId };
  }
  if (params.leadId) {
    let conv = await prisma.conversation.findFirst({
      where: { leadId: params.leadId, channel: 'EMAIL' },
      orderBy: { lastMessageAt: 'desc' }
    });
    if (!conv) {
      const lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
      if (!lead) return null;
      conv = await prisma.conversation.create({
        data: { workspaceId: lead.workspaceId, leadId: params.leadId, channel: 'EMAIL', subject: params.subject }
      });
    }
    return { leadId: params.leadId, conversationId: conv.id };
  }

  // Sin leadId: buscar por email o crear lead nuevo
  const workspaceId = await resolveWorkspaceId(params.workspaceId);
  let lead = await prisma.lead.findFirst({ where: { workspaceId, email: params.to } });
  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        workspaceId,
        email: params.to,
        fullName: params.to.split('@')[0],
        source: 'manual_compose',
        consentToContact: true
      }
    });
  }
  let conv = await prisma.conversation.findFirst({
    where: { leadId: lead.id, channel: 'EMAIL' },
    orderBy: { lastMessageAt: 'desc' }
  });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { workspaceId, leadId: lead.id, channel: 'EMAIL', subject: params.subject }
    });
  }
  return { leadId: lead.id, conversationId: conv.id };
}

export async function sendEmailViaBird(params: SendEmailParams): Promise<SendEmailResult> {
  const { apiKey, workspaceId, channelId } = birdConfig();
  if (!apiKey || !workspaceId || !channelId) {
    return { ok: false, error: 'Configuración Bird incompleta (BIRD_API_KEY/BIRD_WORKSPACE_ID/BIRD_EMAIL_CHANNEL_ID)' };
  }

  const fromEmail = 'inbox@automatizawpp.com';
  const innerHtml = params.html || `<p>${escapeHtml(params.body).replace(/\n/g, '<br>')}</p>`;
  // Bird API actual no acepta subject en el payload — SparkPost extrae el subject
  // del <title> en el HTML. Embebemos siempre subject como <title>.
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(params.subject)}</title></head><body>${innerHtml}</body></html>`;

  const payload = {
    receiver: { contacts: [{ identifierValue: params.to }] },
    body: {
      type: 'html',
      html: { html: fullHtml }
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
    } catch { /* ignore */ }
  } catch (e) {
    return { ok: false, error: `Bird fetch error: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Persistir Message
  const ids = await resolveLeadAndConversation(params).catch(() => null);
  if (!ids) {
    return { ok: true, birdMessageId, error: 'Email enviado, pero no se pudo persistir en BD (sin lead/conversation)' };
  }

  try {
    const created = await prisma.message.create({
      data: {
        leadId: ids.leadId,
        conversationId: ids.conversationId,
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
    // Actualizar lastMessageAt de la conversation y lastEmailAt del lead
    await Promise.all([
      prisma.conversation.update({ where: { id: ids.conversationId }, data: { lastMessageAt: new Date() } }),
      prisma.lead.update({ where: { id: ids.leadId }, data: { lastEmailAt: new Date() } })
    ]).catch(() => {});
    return { ok: true, messageId: created.id, birdMessageId, leadId: ids.leadId, conversationId: ids.conversationId };
  } catch (e) {
    return { ok: true, birdMessageId, leadId: ids.leadId, conversationId: ids.conversationId, error: `Email enviado pero error guardando en BD: ${e instanceof Error ? e.message : String(e)}` };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
