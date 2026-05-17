// /api/emails/compose/route.ts — POST: compor um email novo (com/sin lead existente)
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { sendEmailViaBird } from '@/lib/email/send';

const composeSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  html: z.string().optional(),
  leadId: z.string().optional() // opcional — se omitido, busca/cria pelo email
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado' }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parsed = composeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await sendEmailViaBird({
    to: parsed.data.to,
    subject: parsed.data.subject,
    body: parsed.data.body,
    html: parsed.data.html,
    leadId: parsed.data.leadId,
    workspaceId: session.workspaceId
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    messageId: result.messageId,
    leadId: result.leadId,
    conversationId: result.conversationId,
    birdMessageId: result.birdMessageId
  });
}
