import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { claimWebhookEvent, markWebhookEventFailed } from '@/lib/webhooks/idempotency';

type MetaValue = Record<string, unknown>;

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

// GET — Meta verification challenge
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST — inbound WhatsApp messages and status updates
export async function POST(request: Request) {
  let externalId: string | undefined;
  try {
    const body = (await request.json()) as { object?: unknown; entry?: unknown[] };

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ ignored: true });
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray((entry as MetaValue).changes) ? (entry as MetaValue).changes as MetaValue[] : [];

      for (const change of changes) {
        const value = (change.value ?? {}) as MetaValue;
        const messages = Array.isArray(value.messages) ? value.messages as MetaValue[] : [];
        const statuses = Array.isArray(value.statuses) ? value.statuses as MetaValue[] : [];

        for (const msg of messages) {
          const msgId = asString(msg.id);
          if (!msgId) continue;

          externalId = `message:${msgId}`;
          const claim = await claimWebhookEvent('meta', externalId, 'whatsapp.message', body);
          if (claim.status === 'duplicate') continue;
          if (claim.status === 'error') continue;

          const from = asString(msg.from);
          const text = asString((msg.text as MetaValue | undefined)?.body);
          const timestamp = asString(msg.timestamp);
          const receivedAt = timestamp ? new Date(Number(timestamp) * 1000) : new Date();

          if (!from) continue;

          const lead = await prisma.lead.findFirst({ where: { phone: from } });

          if (lead) {
            // Find or create an open WhatsApp conversation
            let conversation = await prisma.conversation.findFirst({
              where: { leadId: lead.id, channel: 'WHATSAPP', isClosed: false }
            });

            if (!conversation) {
              conversation = await prisma.conversation.create({
                data: { leadId: lead.id, workspaceId: lead.workspaceId, channel: 'WHATSAPP' }
              });
            }

            await prisma.message.create({
              data: {
                leadId: lead.id,
                conversationId: conversation.id,
                direction: 'INBOUND',
                channel: 'WHATSAPP',
                body: text ?? '[media]',
                receivedAt
              }
            });
          } else if (from) {
            // New inbound lead from WhatsApp — create in first workspace
            const workspace = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
            if (workspace) {
              const newLead = await prisma.lead.create({
                data: {
                  workspaceId: workspace.id,
                  phone: from,
                  source: 'WHATSAPP_INBOUND',
                  status: 'NEW'
                }
              });

              const conversation = await prisma.conversation.create({
                data: { leadId: newLead.id, workspaceId: workspace.id, channel: 'WHATSAPP' }
              });

              if (text) {
                await prisma.message.create({
                  data: {
                    leadId: newLead.id,
                    conversationId: conversation.id,
                    direction: 'INBOUND',
                    channel: 'WHATSAPP',
                    body: text,
                    receivedAt
                  }
                });
              }
            }
          }
        }

        for (const status of statuses) {
          const msgId = asString(status.id);
          const statusValue = asString(status.status);
          if (!msgId || !statusValue) continue;

          externalId = `status:${msgId}:${statusValue}`;
          // Claim for idempotency — no further action needed for delivery receipts
          await claimWebhookEvent('meta', externalId, `whatsapp.${statusValue}`, status);
        }
      }
    }

    // Meta requires 200 always
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (externalId) {
      await markWebhookEventFailed('meta', externalId, message).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }
}
