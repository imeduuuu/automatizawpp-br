import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { transitionLead } from '@/lib/lead-state-machine';
import { claimWebhookEvent, markWebhookEventFailed } from '@/lib/webhooks/idempotency';
import { CallResult, CallOutcome } from '@prisma/client';

async function sendWhatsAppEmailRequest(customerPhone: string): Promise<string> {
  const token = process.env.META_WA_TOKEN;
  const phoneId = process.env.META_WA_PHONE_ID;

  if (!token || !phoneId) return 'WhatsApp no configurado';

  const to = customerPhone.replace(/\s/g, '');

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: 'Hola 👋 Soy Alex de AutomatizaWPP. Para no perder ninguna letra, ¿me escribes aquí tu correo electrónico? ¡Gracias!' },
      }),
    }
  );

  if (res.ok) return 'WhatsApp enviado correctamente';
  const err = await res.text();
  return `Error enviando WhatsApp: ${err}`;
}

type VapiBody = Record<string, unknown>;

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

function mapEndedReason(reason: string | undefined): { callResult: CallResult; callOutcome: CallOutcome } {
  if (!reason) return { callResult: CallResult.NO_ANSWER, callOutcome: CallOutcome.NO_ANSWER };
  if (reason.includes('voicemail')) return { callResult: CallResult.VOICEMAIL, callOutcome: CallOutcome.NO_ANSWER };
  if (reason.includes('no-answer') || reason.includes('customer-did-not-answer')) {
    return { callResult: CallResult.NO_ANSWER, callOutcome: CallOutcome.NO_ANSWER };
  }
  if (reason.includes('customer-ended') || reason.includes('assistant-ended')) {
    return { callResult: CallResult.QUALIFIED, callOutcome: CallOutcome.CONNECTED };
  }
  return { callResult: CallResult.NO_ANSWER, callOutcome: CallOutcome.NO_ANSWER };
}

export async function POST(request: Request) {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  const incoming = request.headers.get('x-vapi-secret');

  if (secret && incoming !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let externalId: string | undefined;
  try {
    const body = (await request.json()) as VapiBody;
    const msg = (body.message ?? body) as VapiBody;
    const messageType = asString(msg.type);
    const call = (msg.call ?? {}) as VapiBody;
    const callId = asString(call.id) ?? asString(body.call_id);

    if (!messageType) {
      return NextResponse.json({ ignored: true });
    }

    // Handle tool calls inline — VAPI expects immediate response with results
    if (messageType === 'tool-calls') {
      const toolCallList = Array.isArray(msg.toolCallList) ? msg.toolCallList as VapiBody[] : [];
      const results: { toolCallId: string; result: string }[] = [];

      for (const toolCall of toolCallList) {
        const fn = (toolCall.function ?? {}) as VapiBody;
        const name = asString(fn.name);
        const args = (fn.arguments ?? {}) as Record<string, string>;
        const toolCallId = asString(toolCall.id) ?? '';

        if (name === 'solicitar_email_por_whatsapp') {
          const customerPhone = args.customer_phone
            ?? asString((call.customer as VapiBody | undefined)?.number)
            ?? asString((call.customer as VapiBody | undefined)?.phoneNumber);

          const result = customerPhone
            ? await sendWhatsAppEmailRequest(customerPhone)
            : 'Número de teléfono no disponible';

          results.push({ toolCallId, result });
        }
      }

      return NextResponse.json({ results });
    }

    if (!callId) {
      return NextResponse.json({ ignored: true });
    }

    const handled = ['end-of-call-report', 'call.ended'];
    if (!handled.includes(messageType)) {
      return NextResponse.json({ ignored: true });
    }

    externalId = `${messageType}:${callId}`;
    const claim = await claimWebhookEvent('vapi', externalId, messageType, body);
    if (claim.status === 'duplicate') {
      return NextResponse.json({ ok: true, skipped: 'duplicate', firstSeenAt: claim.previouslyProcessedAt });
    }
    if (claim.status === 'error') {
      return NextResponse.json({ ok: false, error: claim.error }, { status: 500 });
    }

    const customerPhone = asString((call.customer as VapiBody | undefined)?.phoneNumber);
    const endedReason = asString(call.endedReason) ?? asString(msg.endedReason);
    const durationSeconds = asNumber(call.duration) ?? asNumber(msg.duration);
    const summary = asString(msg.summary);
    const { callResult, callOutcome } = mapEndedReason(endedReason);

    if (customerPhone) {
      const lead = await prisma.lead.findFirst({ where: { phone: customerPhone } });

      if (lead) {
        await transitionLead(lead.id, {
          type: 'CALL_RESULT',
          result: callResult,
          duration: durationSeconds,
          notes: summary
        });

        // Check if CallRecord already exists for this vapiCallId
        const existing = await prisma.callRecord.findFirst({ where: { callExternalId: callId } });

        if (existing) {
          await prisma.callRecord.update({
            where: { id: existing.id },
            data: {
              status: callOutcome,
              durationSec: durationSeconds ? Math.round(durationSeconds) : undefined,
              summary,
              endedAt: new Date()
            }
          });
        } else {
          await prisma.callRecord.create({
            data: {
              workspaceId: lead.workspaceId ?? '',
              leadId: lead.id,
              callExternalId: callId,
              provider: 'vapi',
              direction: 'OUTBOUND',
              status: callOutcome,
              durationSec: durationSeconds ? Math.round(durationSeconds) : 0,
              summary,
              endedAt: new Date()
            }
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (externalId) {
      await markWebhookEventFailed('vapi', externalId, message).catch(() => {});
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
