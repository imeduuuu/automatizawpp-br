import type { CreateCallInput, CallProviderResult, VoiceProvider } from './base';

export class VapiProvider implements VoiceProvider {
  name = 'vapi';
  private apiKey: string;
  private assistantId: string;
  private phoneNumber: string;
  private model: string;
  private maxTokens: number;

  constructor() {
    this.apiKey = process.env.VAPI_API_KEY || '';
    this.assistantId = process.env.VAPI_ASSISTANT_ID || 'alex';
    this.phoneNumber = process.env.VAPI_PHONE_NUMBER || '';
    this.model = process.env.VAPI_MODEL || 'claude-haiku-4-5-20251001';
    this.maxTokens = parseInt(process.env.VAPI_MAX_TOKENS || '250', 10);

    if (!this.apiKey) {
      throw new Error('VAPI_API_KEY not configured');
    }
  }

  async createOutboundCall(input: CreateCallInput): Promise<CallProviderResult> {
    try {
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          phoneNumberId: this.phoneNumber,
          assistantId: this.assistantId,
          customerPhoneNumber: input.to,
          modelConfig: {
            model: this.model,
            maxTokens: this.maxTokens,
            responseDelay: 0.3,
            llmDelay: 0.0,
          },
          metadata: {
            leadId: input.leadId,
            script: input.script,
            timestamp: new Date().toISOString(),
            language: 'pt-BR',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[VAPI] Call creation failed:', error);
        return {
          provider: 'vapi',
          callExternalId: `vapi-failed-${Date.now()}`,
          status: 'failed',
          metadata: { error },
        };
      }

      const data = await response.json();
      console.log('[VAPI] Call created:', data.id);

      return {
        provider: 'vapi',
        callExternalId: data.id,
        status: 'queued',
        metadata: {
          phoneNumber: input.to,
          assistantId: this.assistantId,
          vapiId: data.id,
        },
      };
    } catch (error) {
      console.error('[VAPI] Exception creating call:', error);
      return {
        provider: 'vapi',
        callExternalId: `vapi-error-${Date.now()}`,
        status: 'failed',
        metadata: { error: String(error) },
      };
    }
  }
}

export const createVapiProvider = (): VoiceProvider => {
  return new VapiProvider();
};
