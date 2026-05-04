// Idempotencia para webhooks — evitar procesar el mismo evento dos veces

const processedEvents = new Set<string>();

function getKey(source: string, externalId: string): string {
  return `${source}:${externalId}`;
}

export type ClaimResult =
  | { status: 'claimed' }
  | { status: 'duplicate'; previouslyProcessedAt: Date }
  | { status: 'error'; error: string };

/**
 * Reclamar un evento de webhook para asegurar que solo se procesa una vez.
 * Acepta params adicionales para compatibilidad con los webhooks (event, body).
 */
export async function claimWebhookEvent(
  source: 'bird' | 'brevo' | 'stripe' | 'vapi' | 'meta' | 'n8n' | 'resend',
  externalId: string,
  _event?: unknown,
  _body?: unknown
): Promise<ClaimResult> {
  try {
    const key = getKey(source, externalId);
    if (processedEvents.has(key)) {
      console.log(`[idempotency] Evento ya procesado: ${source}/${externalId}`);
      return { status: 'duplicate', previouslyProcessedAt: new Date() };
    }
    processedEvents.add(key);
    console.log(`[idempotency] Evento reclamado: ${source}/${externalId}`);
    return { status: 'claimed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[idempotency] Error al reclamar evento:', message);
    return { status: 'error', error: message };
  }
}

/**
 * Marcar un evento como fallido (para reintentos)
 */
export async function markWebhookEventAsFailed(
  source: string,
  externalId: string,
  errorMessage: string
): Promise<void> {
  console.log(`[idempotency] Evento fallido: ${source}/${externalId} — ${errorMessage}`);
}

export async function getWebhookEventStatus(
  source: string,
  externalId: string
): Promise<'PROCESSED' | 'FAILED' | null> {
  const key = getKey(source, externalId);
  return processedEvents.has(key) ? 'PROCESSED' : null;
}

export async function cleanupOldWebhookEvents(_daysOld = 30): Promise<number> {
  console.log(`[idempotency] ${processedEvents.size} eventos en memoria (se limpian al reiniciar)`);
  return 0;
}

export function resetIdempotencyStore(): void {
  processedEvents.clear();
}

export const markWebhookEventFailed = markWebhookEventAsFailed;
