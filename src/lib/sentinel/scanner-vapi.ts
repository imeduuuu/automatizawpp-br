import { DetectedError } from '@/lib/sentinel/types';

export async function scanVapi(): Promise<DetectedError[]> {
  const errors: DetectedError[] = [];
  const key = process.env.VAPI_API_KEY?.trim();
  if (!key) return errors;

  try {
    const res = await fetch('https://api.vapi.ai/call?limit=30', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      errors.push({
        source: 'vapi',
        severity: 'critical',
        title: 'Vapi API no responde',
        rawError: `HTTP ${res.status}`
      });
      return errors;
    }

    const payload = await res.json();
    const calls = Array.isArray(payload) ? payload : payload.results || payload.data || [];
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

    for (const call of calls) {
      const timestamp = new Date(call.startedAt || call.createdAt || 0).getTime();
      if (Number.isNaN(timestamp) || timestamp < thirtyMinutesAgo) continue;
      if (call.status !== 'failed') continue;

      errors.push({
        source: 'vapi',
        severity: 'warning',
        title: `Llamada fallida a ${call.customer?.number || 'desconocido'}`,
        rawError: JSON.stringify(
          {
            callId: call.id,
            status: call.status,
            customer: call.customer,
            startedAt: call.startedAt,
            endedReason: call.endedReason
          },
          null,
          2
        ),
        sourceId: String(call.id ?? ''),
        metadata: {
          callId: call.id,
          number: call.customer?.number
        }
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push({
      source: 'vapi',
      severity: 'critical',
      title: 'Error conectando a Vapi',
      rawError: message
    });
  }

  return errors;
}
