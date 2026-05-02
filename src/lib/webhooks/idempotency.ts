// Idempotencia para webhooks - evitar procesar el mismo evento dos veces

interface IdempotencyKey {
  source: string;
  externalId: string;
}

// Almacenamiento temporal en memoria (TODO: integrar con Prisma cuando esté disponible)
const processedEvents = new Set<string>();

function getKey(source: string, externalId: string): string {
  return `${source}:${externalId}`;
}

/**
 * Reclamar un evento de webhook para asegurar que solo se procesa una vez
 * Retorna true si este es el primer procesamiento, false si ya fue procesado
 */
export async function claimWebhookEvent(
  source: 'bird' | 'brevo' | 'stripe' | 'vapi' | 'meta' | 'n8n' | 'resend',
  externalId: string
): Promise<boolean> {
  try {
    const key = getKey(source, externalId);
    
    if (processedEvents.has(key)) {
      console.log(`[idempotency] Event already processed: ${source}/${externalId}`);
      return false;
    }
    
    processedEvents.add(key);
    console.log(`[idempotency] Claimed new event: ${source}/${externalId}`);
    return true;
  } catch (error) {
    console.error('[idempotency] Error claiming event:', error);
    throw error;
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
  try {
    console.log(
      `[idempotency] Marked event as failed: ${source}/${externalId} - ${errorMessage}`
    );
    // TODO: Persistir en DB cuando esté disponible Prisma WebhookEvent
  } catch (error) {
    console.error('[idempotency] Failed to update event status:', error);
  }
}

/**
 * Obtener estado de un evento previamente procesado
 */
export async function getWebhookEventStatus(
  source: string,
  externalId: string
): Promise<'PROCESSED' | 'FAILED' | null> {
  try {
    const key = getKey(source, externalId);
    if (processedEvents.has(key)) {
      return 'PROCESSED';
    }
    return null;
  } catch (error) {
    console.error('[idempotency] Failed to get event status:', error);
    return null;
  }
}

/**
 * Limpiar eventos antiguos (más de 30 días)
 * Nota: Con almacenamiento en memoria, se limpian al reiniciar
 */
export async function cleanupOldWebhookEvents(
  daysOld: number = 30
): Promise<number> {
  try {
    const count = processedEvents.size;
    // Con memoria, se limpian automáticamente al reiniciar
    console.log(`[idempotency] Ready to clean ${count} events (cleanup on restart)`);
    return 0; // En memoria no hay persistencia de antigüedad
  } catch (error) {
    console.error('[idempotency] Cleanup failed:', error);
    throw error;
  }
}

/**
 * Resetear almacenamiento (solo para testing)
 */
export function resetIdempotencyStore(): void {
  processedEvents.clear();
  console.log('[idempotency] Store reset (testing only)');
}

export const markWebhookEventFailed = markWebhookEventAsFailed;
