import { DetectedError } from '@/lib/sentinel/types';

export async function scanStripe(): Promise<DetectedError[]> {
  const errors: DetectedError[] = [];
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return errors;

  try {
    const res = await fetch('https://api.stripe.com/v1/events?limit=20&type=payment_intent.payment_failed', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      errors.push({
        source: 'stripe',
        severity: 'warning',
        title: 'Stripe API error',
        rawError: `HTTP ${res.status}`
      });
      return errors;
    }

    const payload = await res.json();
    const events = payload.data || [];
    const thirtyMinutesAgo = Date.now() / 1000 - 30 * 60;

    for (const event of events) {
      if (event.created < thirtyMinutesAgo) continue;
      const paymentIntent = event.data?.object;
      errors.push({
        source: 'stripe',
        severity: 'warning',
        title: `Pago fallido: ${((paymentIntent?.amount || 0) / 100).toFixed(2)}€`,
        rawError: JSON.stringify(
          {
            eventId: event.id,
            amount: paymentIntent?.amount,
            currency: paymentIntent?.currency,
            error: paymentIntent?.last_payment_error?.message
          },
          null,
          2
        ),
        sourceId: String(event.id ?? ''),
        metadata: {
          amount: paymentIntent?.amount,
          currency: paymentIntent?.currency
        }
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push({
      source: 'stripe',
      severity: 'warning',
      title: 'Error escaneando Stripe',
      rawError: message
    });
  }

  return errors;
}
