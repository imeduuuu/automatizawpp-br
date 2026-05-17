// /api/alex/test-call/route.ts — disparar una llamada de prueba via Bird
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { initiateBirdCall, getBirdCallStatus } from '@/lib/bird/voice';

const callSchema = z.object({
  phone: z.string().min(5),
  sector: z.string().optional(),
  company: z.string().optional()
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = callSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const phone = parsed.data.phone.trim();
  // Normalizar a E.164 mínimo (debe empezar con +)
  if (!phone.startsWith('+')) {
    return NextResponse.json({ error: 'O telefone deve estar em formato E.164 (ex: +34680365779)' }, { status: 400 });
  }

  const result = await initiateBirdCall({
    to: phone,
    workspaceId: session.workspaceId
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, raw: result.raw }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    callId: result.callId,
    callRecordId: result.callRecordId,
    status: result.status,
    message: `Chamada iniciada via Bird para ${phone}. ID: ${result.callId}`
  });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const callId = new URL(request.url).searchParams.get('callId');
  if (!callId) {
    return NextResponse.json({ error: 'callId is required' }, { status: 400 });
  }

  const result = await getBirdCallStatus(callId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, status: result.status, call: result.raw });
}
