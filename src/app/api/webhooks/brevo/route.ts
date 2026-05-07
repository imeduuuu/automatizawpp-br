import { NextResponse } from 'next/server';
import { transitionLead, type LeadEvent } from '@/lib/lead-state-machine';
import { prisma } from '@/lib/db';
import { claimWebhookEvent, markWebhookEventFailed } from '@/lib/webhooks/idempotency';

type BrevoWebhookBody = {
  event?: unknown;
  email?: unknown;
  messageId?: unknown;
  template?: unknown;
  'message-id'?: unknown;
};

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export async function POST(request: Request) {
  let externalId: string | undefined;
  try {
    const body = (await request.json()) as BrevoWebhookBody;
    const event = asString(body.event);
    const email = asString(body.email);
    const messageId = asString(body.messageId) ?? asString(body['message-id']);
    const template = asString(body.template);

    if (!event || !['opened', 'clicked', 'delivered', 'bounce'].includes(event)) {
      return NextResponse.json({ ignored: true });
    }

    // Idempotency: skip if we have already processed this exact (event, messageId)
    externalId = `${event}:${messageId ?? email ?? 'unknown'}`;
    const claim = await claimWebhookEvent('brevo', externalId, event, body);
    if (claim.status === 'duplicate') {
      return NextResponse.json({ ok: true, skipped: 'duplicate', firstSeenAt: claim.previouslyProcessedAt });
    }
    if (claim.status === 'error') {
      return NextResponse.json({ ok: false, error: claim.error }, { status: 500 });
    }

    const lead = await prisma.lead.findFirst({
      where: { email: email ?? '' }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (event === 'bounce') {
      console.warn('Brevo bounce event', {
        leadId: lead.id,
        email,
        messageId,
        template: template ?? 'unknown'
      });
      return NextResponse.json({ ok: true });
    }

    let mappedEvent: LeadEvent;

    if (event === 'opened' || event === 'clicked') {
      mappedEvent = { type: 'EMAIL_OPENED', template: template ?? 'unknown' };
    } else {
      mappedEvent = { type: 'EMAIL_SENT', template: template ?? 'unknown' };
    }

    await transitionLead(lead.id, mappedEvent);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    if (externalId) {
      await markWebhookEventFailed('brevo', externalId, message).catch(() => {});
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
