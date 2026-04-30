import { prisma } from '@/lib/db';

export type WebhookSource = 'brevo' | 'stripe' | 'vapi' | 'meta' | 'resend';

export type ClaimResult =
  | { status: 'claimed'; id: string }
  | { status: 'duplicate'; previouslyProcessedAt: Date }
  | { status: 'error'; error: string };

/**
 * Idempotency claim for a webhook event.
 *
 * Atomically inserts a (source, externalId) row. If it already exists,
 * the event has already been processed and should be skipped.
 *
 * Usage in a webhook route:
 *
 *   const claim = await claimWebhookEvent('brevo', payload.event_id, 'email.delivered', payload);
 *   if (claim.status === 'duplicate') {
 *     return NextResponse.json({ ok: true, skipped: 'duplicate' });
 *   }
 *   if (claim.status === 'error') {
 *     return NextResponse.json({ ok: false, error: claim.error }, { status: 500 });
 *   }
 *   // ... process the event ...
 *
 * Postgres `@@unique([source, externalId])` is the source of truth — Redis
 * locks are best-effort, this is correctness.
 */
export async function claimWebhookEvent(
  source: WebhookSource,
  externalId: string,
  eventType?: string,
  payload?: unknown,
): Promise<ClaimResult> {
  if (!externalId || externalId.trim().length === 0) {
    return { status: 'error', error: 'externalId required' };
  }

  try {
    const created = await prisma.webhookEvent.create({
      data: {
        source,
        externalId,
        eventType,
        payload: payload as never,
        status: 'PROCESSED',
      },
    });
    return { status: 'claimed', id: created.id };
  } catch (error) {
    // Prisma P2002 = unique constraint violation -> already processed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (error && (error as any).code === 'P2002') {
      const existing = await prisma.webhookEvent.findUnique({
        where: { source_externalId: { source, externalId } },
        select: { processedAt: true },
      });
      return {
        status: 'duplicate',
        previouslyProcessedAt: existing?.processedAt ?? new Date(),
      };
    }
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Mark a previously claimed event as failed (so it can be retried by the provider).
 * The provider's retry mechanism will hit our endpoint again with the same externalId;
 * deleting allows reprocessing.
 */
export async function markWebhookEventFailed(
  source: WebhookSource,
  externalId: string,
  errorMessage: string,
): Promise<void> {
  await prisma.webhookEvent.updateMany({
    where: { source, externalId },
    data: { status: 'FAILED', errorMessage },
  });
}
