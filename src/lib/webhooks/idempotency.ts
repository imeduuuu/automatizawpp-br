// Idempotencia para webhooks — evitar procesar el mismo evento dos veces
// Persistido en WebhookEvent (DB) para sobrevivir reinicios de PM2.

import { prisma } from '@/lib/db';

export type ClaimResult =
  | { status: 'claimed' }
  | { status: 'duplicate'; previouslyProcessedAt: Date }
  | { status: 'error'; error: string };

export async function claimWebhookEvent(
  source: 'bird' | 'brevo' | 'stripe' | 'vapi' | 'meta' | 'n8n' | 'resend',
  externalId: string,
  _event?: unknown,
  _body?: unknown
): Promise<ClaimResult> {
  try {
    const existing = await prisma.webhookEvent.findUnique({
      where: { source_externalId: { source, externalId } },
      select: { processedAt: true },
    });

    if (existing) {
      console.log(`[idempotency] Evento já processado: ${source}/${externalId}`);
      return { status: 'duplicate', previouslyProcessedAt: existing.processedAt };
    }

    await prisma.webhookEvent.create({
      data: { source, externalId, status: 'PROCESSED' },
    });

    console.log(`[idempotency] Evento registrado: ${source}/${externalId}`);
    return { status: 'claimed' };
  } catch (error) {
    // Unique constraint violation = race condition duplicate
    if (
      error instanceof Error &&
      (error.message.includes('Unique constraint') || error.message.includes('unique'))
    ) {
      console.log(`[idempotency] Duplicado detectado por race condition: ${source}/${externalId}`);
      return { status: 'duplicate', previouslyProcessedAt: new Date() };
    }
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('[idempotency] Erro ao registrar evento:', message);
    return { status: 'error', error: message };
  }
}

export async function markWebhookEventAsFailed(
  source: string,
  externalId: string,
  errorMessage: string
): Promise<void> {
  try {
    await prisma.webhookEvent.upsert({
      where: { source_externalId: { source, externalId } },
      update: { status: 'FAILED', errorMessage },
      create: { source, externalId, status: 'FAILED', errorMessage },
    });
  } catch (err) {
    console.error('[idempotency] Erro ao marcar evento como falho:', err);
  }
}

export async function getWebhookEventStatus(
  source: string,
  externalId: string
): Promise<'PROCESSED' | 'FAILED' | null> {
  const event = await prisma.webhookEvent.findUnique({
    where: { source_externalId: { source, externalId } },
    select: { status: true },
  });
  if (!event) return null;
  return event.status as 'PROCESSED' | 'FAILED';
}

export async function cleanupOldWebhookEvents(daysOld = 30): Promise<number> {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const result = await prisma.webhookEvent.deleteMany({
    where: { processedAt: { lt: cutoff } },
  });
  return result.count;
}

export function resetIdempotencyStore(): void {
  // No-op: store é persistido no BD, não em memória
}

export const markWebhookEventFailed = markWebhookEventAsFailed;
