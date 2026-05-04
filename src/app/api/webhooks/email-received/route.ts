// POST /api/webhooks/email-received
// Recibir emails desde Bird API y procesar como evento

import { NextRequest, NextResponse } from 'next/server';
import { eventEmitter, EventType, EmailReceivedEvent } from '@/lib/events';
import { resolveLead } from '@/lib/orchestration/lead-resolution';
import { runSalesOrchestration } from '@/lib/orchestration/sales-engine';

const WORKSPACE_ID = process.env.BIRD_WORKSPACE_ID ?? 'demo_workspace';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    from,
    subject,
    body: emailBody,
    messageId,
    receivedAt,
    threadId,
    inReplyTo,
  } = body;

  if (!from || !emailBody) {
    return NextResponse.json({ error: 'Missing from or body' }, { status: 400 });
  }

  try {
    // Resolver lead usando email del remitente
    let lead;
    try {
      lead = await resolveLead({
        workspaceId: WORKSPACE_ID,
        lead: {
          email: from,
          source: 'email',
        },
      });
    } catch (error) {
      console.error('[email-received] Lead resolution failed:', error);
      return NextResponse.json(
        { error: 'Lead resolution failed' },
        { status: 500 }
      );
    }

    // Crear evento de email recibido
    const emailEvent: EmailReceivedEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: EventType.EMAIL_RECEIVED,
      workspaceId: WORKSPACE_ID,
      leadId: lead.id,
      timestamp: new Date(receivedAt || Date.now()),
      payload: {
        leadId: lead.id,
        messageId: messageId || `msg_${Date.now()}`,
        from,
        subject: subject || 'Sin asunto',
        body: emailBody,
      },
    };

    // Emitir evento (esto dispara handlers y n8n workflows)
    await eventEmitter.emit(emailEvent);

    // Ejecutar orquestación de ventas
    try {
      const result = await runSalesOrchestration({
        workspaceId: WORKSPACE_ID,
        leadId: lead.id,
        channel: 'EMAIL',
        message: emailBody,
        subject: subject,
        threadRef: threadId,
        messageId: messageId,
        receivedAt: receivedAt || Date.now(),
        metadata: {
          from,
          inReplyTo,
        },
      });

      return NextResponse.json({
        ok: true,
        leadId: lead.id,
        eventId: emailEvent.id,
        agent: result.agent,
        summary: result.summary,
        delivery: result.delivery,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[email-received] Orchestration failed:', errMsg);
      return NextResponse.json({
        ok: true,
        leadId: lead.id,
        eventId: emailEvent.id,
        agent: 'ORCHESTRATOR',
        summary: 'Email received — orchestration unavailable',
        delivery: null,
        warning: errMsg,
      });
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[email-received] Processing failed:', errMsg);
    return NextResponse.json(
      { error: 'Processing failed', details: errMsg },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'AutomatizaWPP Email Received Webhook',
    version: '1.0.0',
  });
}
