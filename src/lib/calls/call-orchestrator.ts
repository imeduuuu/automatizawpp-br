import { prisma } from '@/lib/db';
import { VoiceProvider } from '@/lib/calls/providers/base';
import { TwilioVoiceProvider } from '@/lib/calls/providers/twilio-provider';
import { BirdVoiceProvider } from '@/lib/calls/providers/bird-provider';
import { createVapiProvider } from '@/lib/calls/providers/vapi-provider';

class InternalAiVoiceProvider implements VoiceProvider {
  name = 'internal-ai-voice';

  async createOutboundCall(input: { to: string; from?: string; script: string; leadId: string }) {
    return {
      provider: this.name,
      callExternalId: `internal-${Date.now()}`,
      status: 'queued' as const,
      metadata: {
        mode: 'ai-assisted',
        note: 'Prepared for internal AI voice runtime / future SIP bridge.',
        to: input.to
      }
    };
  }
}

export function getVoiceProvider() {
  const provider = process.env.VOICE_PROVIDER ?? 'internal-ai-voice';
  if (provider === 'vapi') {
    return createVapiProvider();
  }
  if (provider === 'twilio') {
    return new TwilioVoiceProvider();
  }
  if (provider === 'bird') {
    return new BirdVoiceProvider();
  }
  return new InternalAiVoiceProvider();
}

export async function createSalesCall(workspaceId: string, leadId: string, to: string, script: string) {
  const provider = getVoiceProvider();
  const call = await provider.createOutboundCall({
    leadId,
    to,
    script
  });

  return prisma.callRecord.create({
    data: {
      workspaceId,
      leadId,
      provider: call.provider,
      callExternalId: call.callExternalId,
      direction: 'OUTBOUND',
      status: call.status === 'initiated' ? 'CONNECTED' : 'NO_ANSWER',
      summary: script
    }
  });
}

export async function analyzeTranscript(callRecordId: string, transcript: string) {
  const lower = transcript.toLowerCase();
  const objections: string[] = [];
  if (lower.includes('expensive') || lower.includes('caro')) objections.push('PRICE');
  if (lower.includes('not now') || lower.includes('later')) objections.push('TIMING');

  const urgencySignals: string[] = [];
  if (lower.includes('asap') || lower.includes('this week') || lower.includes('urgente')) urgencySignals.push('HIGH_URGENCY');

  return prisma.callRecord.update({
    where: { id: callRecordId },
    data: {
      objectionsDetected: objections,
      urgencySignals,
      summary: `Auto summary: ${transcript.slice(0, 400)}`,
      nextAction: urgencySignals.length ? 'Schedule close call within 24h' : 'Send recap + follow-up'
    }
  });
}
