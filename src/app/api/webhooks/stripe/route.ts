import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { transitionLead } from '@/lib/lead-state-machine';
import { claimWebhookEvent, markWebhookEventFailed } from '@/lib/webhooks/idempotency';
import { SubscriptionPlan } from '@prisma/client';

type StripeObject = Record<string, unknown>;

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

function planFromPrice(priceId: string | undefined): SubscriptionPlan {
  if (!priceId) return SubscriptionPlan.SCALE;
  const lower = priceId.toLowerCase();
  if (lower.includes('pro')) return SubscriptionPlan.PRO;
  if (lower.includes('starter')) return SubscriptionPlan.STARTER;
  return SubscriptionPlan.SCALE;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get('stripe-signature');

  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing stripe-signature or secret' }, { status: 400 });
  }

  let externalId: string | undefined;
  try {
    const raw = await request.text();

    // Signature verification using Web Crypto (no stripe-node required)
    const [, tsPart, v1Part] = sig.match(/t=(\d+).*v1=([a-f0-9]+)/) ?? [];
    if (!tsPart || !v1Part) {
      return NextResponse.json({ error: 'Invalid stripe-signature format' }, { status: 400 });
    }
    const payload = `${tsPart}.${raw}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const computed = Buffer.from(sigBytes).toString('hex');
    if (computed !== v1Part) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(raw) as { id?: unknown; type?: unknown; data?: { object?: unknown } };
    const eventId = asString(event.id);
    const eventType = asString(event.type);

    if (!eventId || !eventType) {
      return NextResponse.json({ ignored: true });
    }

    const handled = ['checkout.session.completed', 'customer.subscription.updated', 'invoice.payment_succeeded', 'invoice.payment_failed'];
    if (!handled.includes(eventType)) {
      return NextResponse.json({ ignored: true });
    }

    externalId = eventId;
    const claim = await claimWebhookEvent('stripe', externalId, eventType, event);
    if (claim.status === 'duplicate') {
      return NextResponse.json({ ok: true, skipped: 'duplicate', firstSeenAt: claim.previouslyProcessedAt });
    }
    if (claim.status === 'error') {
      return NextResponse.json({ ok: false, error: claim.error }, { status: 500 });
    }

    const obj = (event.data?.object ?? {}) as StripeObject;

    if (eventType === 'checkout.session.completed' || eventType === 'invoice.payment_succeeded') {
      const customerEmail = asString(obj.customer_email) ?? asString((obj as Record<string, unknown>)['customer_details'] && ((obj as Record<string, unknown>)['customer_details'] as Record<string, unknown>)['email']);
      const stripeId = asString(obj.subscription) ?? asString(obj.id) ?? eventId;
      const amountTotal = asNumber(obj.amount_total) ?? asNumber(obj.amount_paid) ?? 0;
      const mrr = Math.round(amountTotal / 100);
      const itemsData = ((obj as Record<string, unknown>)['items'] as { data?: unknown[] } | undefined)?.data;
      const firstItem = Array.isArray(itemsData) ? (itemsData[0] as Record<string, unknown>) : undefined;
      const priceId = asString((firstItem?.['price'] as Record<string, unknown> | undefined)?.['id']);
      const plan = planFromPrice(priceId);

      const periodEnd = asNumber((obj as Record<string, unknown>)['current_period_end']);
      const renewsAt = periodEnd ? new Date(periodEnd * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (customerEmail) {
        const lead = await prisma.lead.findFirst({ where: { email: customerEmail } });
        if (lead) {
          await transitionLead(lead.id, { type: 'PAYMENT_CONFIRMED', stripeId, plan, mrr, renewsAt });
        }

        await prisma.user.updateMany({
          where: { email: customerEmail.toLowerCase() },
          data: { subscriptionStatus: 'ACTIVE' }
        });
      }
    }

    if (eventType === 'invoice.payment_failed') {
      const customerEmail = asString((obj as Record<string, unknown>)['customer_email']);
      if (customerEmail) {
        await prisma.user.updateMany({
          where: { email: customerEmail.toLowerCase() },
          data: { subscriptionStatus: 'PAST_DUE' }
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (externalId) {
      await markWebhookEventFailed('stripe', externalId, message).catch(() => {});
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
