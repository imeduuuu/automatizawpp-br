import { randomUUID } from 'crypto';
import { CreateCallInput, VoiceProvider } from '@/lib/calls/providers/base';

export class TwilioVoiceProvider implements VoiceProvider {
  name = 'twilio';

  async createOutboundCall(input: CreateCallInput) {
    const hasCreds = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    if (!hasCreds) {
      return {
        provider: this.name,
        callExternalId: `mock-${randomUUID()}`,
        status: 'queued' as const,
        metadata: {
          note: 'Twilio credentials missing. Returned mock call for dry-run.',
          to: input.to
        }
      };
    }

    return {
      provider: this.name,
      callExternalId: `twilio-${randomUUID()}`,
      status: 'initiated' as const,
      metadata: {
        to: input.to,
        from: input.from ?? 'default'
      }
    };
  }
}
