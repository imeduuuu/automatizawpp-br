export type CreateCallInput = {
  to: string;
  from?: string;
  script: string;
  leadId: string;
};

export type CallProviderResult = {
  provider: string;
  callExternalId: string;
  status: 'queued' | 'initiated' | 'failed';
  metadata?: Record<string, unknown>;
};

export interface VoiceProvider {
  name: string;
  createOutboundCall(input: CreateCallInput): Promise<CallProviderResult>;
}
