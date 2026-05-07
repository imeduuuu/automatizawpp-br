// POST /api/webhooks/n8n
// Receive events from n8n workflows

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'your-secret-key';

/**
 * Validar firma de webhook de n8n
 * Verificar que el payload fue enviado por n8n
 */
function validateN8nSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature) {
    console.warn('[n8n-webhook] No signature provided');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', N8N_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Validar firma
  const signature = request.headers.get('x-n8n-signature');
  if (!validateN8nSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    console.log('[n8n-webhook] Received event:', payload.eventType);

    // Aquí procesar el evento según su tipo
    // Por ejemplo, actualizar lead si viene de un workflow de CRM
    // o desencadenar siguiente paso en automación

    return NextResponse.json({
      ok: true,
      message: 'Event received and processed',
      eventType: payload.eventType,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[n8n-webhook] Processing failed:', errMsg);
    return NextResponse.json(
      { error: 'Processing failed', details: errMsg },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'AutomatizaWPP n8n Webhook Handler',
    version: '1.0.0',
  });
}
