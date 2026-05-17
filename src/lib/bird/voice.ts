// lib/bird/voice.ts — iniciar llamadas vía Bird/MessageBird Voice API
import { prisma } from '@/lib/db';

const BIRD_API = 'https://api.bird.com';

export interface InitiateCallParams {
  to: string;             // número destino E.164 (+552120181097)
  from?: string;          // override del número saliente (default: número del canal)
  leadId?: string;        // si hay lead, vincular CallRecord
  conversationId?: string;
  workspaceId?: string;   // workspaceId interno (para CallRecord)
}

export interface InitiateCallResult {
  ok: boolean;
  callId?: string;            // Bird call id
  callRecordId?: string;      // CallRecord local
  status?: string;            // initial status
  error?: string;
  raw?: unknown;
}

function birdConfig() {
  return {
    apiKey: process.env.BIRD_API_KEY?.trim() || '',
    workspaceId: process.env.BIRD_WORKSPACE_ID?.trim() || '',
    voiceChannelId: process.env.BIRD_VOICE_CHANNEL_ID?.trim() || ''
  };
}

/**
 * Iniciar una llamada saliente vía Bird API.
 * Endpoint: POST /workspaces/{ws}/channels/{voiceCh}/calls
 * Body: { to: '+...', from?: '+...' }
 *
 * Sin audio/flow especificado, Bird abrirá la llamada pero sin contenido.
 * Para IA conversacional hay que configurar un Voice Flow en Bird Dashboard
 * y enlazarlo desde aquí (TODO próxima fase).
 */
export async function initiateBirdCall(params: InitiateCallParams): Promise<InitiateCallResult> {
  const { apiKey, workspaceId, voiceChannelId } = birdConfig();
  if (!apiKey || !workspaceId || !voiceChannelId) {
    return { ok: false, error: 'Configuración Bird incompleta (BIRD_API_KEY/BIRD_WORKSPACE_ID/BIRD_VOICE_CHANNEL_ID)' };
  }

  const body: Record<string, unknown> = { to: params.to };
  if (params.from) body.from = params.from;

  let callId: string | undefined;
  let raw: unknown;
  try {
    const res = await fetch(`${BIRD_API}/workspaces/${workspaceId}/channels/${voiceChannelId}/calls`, {
      method: 'POST',
      headers: {
        Authorization: `AccessKey ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000)
    });
    const text = await res.text();
    try { raw = JSON.parse(text); } catch { raw = text; }
    if (!res.ok) {
      return { ok: false, error: `Bird ${res.status}: ${text.slice(0, 400)}`, raw };
    }
    callId = (raw as { id?: string }).id;
  } catch (e) {
    return { ok: false, error: `Bird fetch error: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Registrar CallRecord local
  let callRecordId: string | undefined;
  if (params.leadId && params.workspaceId) {
    try {
      const rec = await prisma.callRecord.create({
        data: {
          workspaceId: params.workspaceId,
          leadId: params.leadId,
          conversationId: params.conversationId || null,
          provider: 'bird-messagebird',
          callExternalId: callId || `bird-${Date.now()}`,
          direction: 'OUTBOUND',
          status: 'NO_ANSWER',
          startedAt: new Date()
        }
      });
      callRecordId = rec.id;
    } catch (e) {
      // No bloqueamos el éxito de la llamada por error de BD
    }
  }

  return { ok: true, callId, callRecordId, status: (raw as { status?: string }).status, raw };
}

/**
 * Consultar estado actual de una llamada Bird.
 */
export async function getBirdCallStatus(callId: string): Promise<InitiateCallResult> {
  const { apiKey, workspaceId, voiceChannelId } = birdConfig();
  if (!apiKey || !workspaceId || !voiceChannelId) {
    return { ok: false, error: 'Bird config incompleta' };
  }
  try {
    const res = await fetch(`${BIRD_API}/workspaces/${workspaceId}/channels/${voiceChannelId}/calls/${callId}`, {
      headers: { Authorization: `AccessKey ${apiKey}` },
      signal: AbortSignal.timeout(10_000)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: `Bird ${res.status}`, raw: data };
    return { ok: true, callId, status: (data as { status?: string }).status, raw: data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
