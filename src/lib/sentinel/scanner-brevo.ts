import { DetectedError } from '@/lib/sentinel/types';

export async function scanBrevo(): Promise<DetectedError[]> {
  const errors: DetectedError[] = [];
  const key = process.env.BREVO_API_KEY?.trim();
  if (!key || key.startsWith("your-") || key === "changeme" || key.includes("placeholder") || key.startsWith("key_test_") || key.startsWith("key_dummy_") || key.startsWith("sk_test_") || key.startsWith("test_")) return errors;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/statistics/events?limit=50&event=hardBounces', {
      headers: { 'api-key': key },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      errors.push({
        source: 'brevo',
        severity: 'warning',
        title: 'Brevo API error',
        rawError: `HTTP ${res.status}`
      });
      return errors;
    }

    const payload = await res.json();
    const events = payload.events || [];
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

    for (const event of events) {
      const eventTime = new Date(event.date || 0).getTime();
      if (Number.isNaN(eventTime) || eventTime < thirtyMinutesAgo) continue;

      errors.push({
        source: 'brevo',
        severity: 'warning',
        title: `Email rebotado: ${event.email || 'desconocido'}`,
        rawError: JSON.stringify(event, null, 2),
        sourceId: String(event.messageId || event.id || ''),
        metadata: {
          email: event.email,
          event: event.event
        }
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push({
      source: 'brevo',
      severity: 'warning',
      title: 'Error escaneando Brevo',
      rawError: message
    });
  }

  return errors;
}
