// POST /api/webhooks/events
// Internal event bus - recibir eventos internos y dispararlos

import { NextRequest, NextResponse } from 'next/server';
import { eventEmitter, EventType, AnyEvent } from '@/lib/events';

/**
 * Crear un evento con validación básica
 */
function validateEvent(data: any): AnyEvent | null {
  const { type, workspaceId, leadId, timestamp, payload } = data;

  if (!type || !Object.values(EventType).includes(type)) {
    console.warn('[events-api] Invalid event type:', type);
    return null;
  }

  if (!workspaceId) {
    console.warn('[events-api] Missing workspaceId');
    return null;
  }

  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    workspaceId,
    leadId,
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    payload,
  } as AnyEvent;
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const event = validateEvent(body);
  if (!event) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  try {
    console.log(`[events-api] Emitting event: ${event.type} (${event.id})`);
    await eventEmitter.emit(event);

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      type: event.type,
      message: 'Event emitted successfully',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[events-api] Failed to emit event:', errMsg);
    return NextResponse.json(
      { error: 'Failed to emit event', details: errMsg },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'AutomatizaWPP Event Bus',
    version: '1.0.0',
    supportedEvents: Object.values(EventType),
  });
}
