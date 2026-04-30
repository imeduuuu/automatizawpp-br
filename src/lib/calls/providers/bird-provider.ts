import { randomUUID } from 'crypto';
import { CreateCallInput, VoiceProvider } from '@/lib/calls/providers/base';

export class BirdVoiceProvider implements VoiceProvider {
  name = 'bird';
  private apiKey = process.env.BIRD_API_KEY;
  private workspaceId = process.env.BIRD_WORKSPACE_ID;
  private channelId = process.env.BIRD_CHANNEL_ID;
  private phoneNumber = process.env.BIRD_PHONE_NUMBER;

  async createOutboundCall(input: CreateCallInput) {
    const hasCreds = Boolean(this.apiKey && this.workspaceId && this.channelId && this.phoneNumber);
    if (!hasCreds) {
      return {
        provider: this.name,
        callExternalId: `mock-${randomUUID()}`,
        status: 'queued' as const,
        metadata: {
          note: 'Bird credentials missing. Returned mock call for dry-run.',
          to: input.to,
          missing: [
            !this.apiKey && 'BIRD_API_KEY',
            !this.workspaceId && 'BIRD_WORKSPACE_ID',
            !this.channelId && 'BIRD_CHANNEL_ID',
            !this.phoneNumber && 'BIRD_PHONE_NUMBER'
          ].filter(Boolean)
        }
      };
    }

    try {
      const response = await fetch(
        `https://api.bird.com/workspaces/${this.workspaceId}/channels/${this.channelId}/calls`,
        {
          method: 'POST',
          headers: {
            'Authorization': `AccessKey ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: input.to,
            from: this.phoneNumber,
            ringTimeout: 30,
            maxDuration: 3600,
            record: true
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Bird API error: ${response.status} ${JSON.stringify(error)}`);
      }

      const data = await response.json();

      return {
        provider: this.name,
        callExternalId: data.id || `bird-${randomUUID()}`,
        status: 'initiated' as const,
        metadata: {
          to: input.to,
          from: this.phoneNumber,
          birdId: data.id,
          script: input.script
        }
      };
    } catch (error) {
      console.error('Bird API call failed:', error);
      return {
        provider: this.name,
        callExternalId: `bird-error-${randomUUID()}`,
        status: 'failed' as const,
        metadata: {
          to: input.to,
          error: error instanceof Error ? error.message : 'Unknown error',
          script: input.script
        }
      };
    }
  }
}
