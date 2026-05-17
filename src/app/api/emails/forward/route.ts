// /api/emails/forward/route.ts — POST: reenviar (forward) un email existente
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { sendEmailViaBird } from '@/lib/email/send';

const forwardSchema = z.object({
  messageId: z.string().min(1),
  to: z.string().email(),
  subject: z.string().optional(),
  body: z.string().min(1),
  html: z.string().optional()
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado' }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parsed = forwardSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const original = await prisma.message.findUnique({ where: { id: parsed.data.messageId } });
  if (!original) {
    return NextResponse.json({ ok: false, error: 'Mensagem original não encontrada' }, { status: 404 });
  }

  const meta = (original.metadata && typeof original.metadata === 'object' ? original.metadata : {}) as Record<string, unknown>;
  const originalSubject = (typeof meta.subject === 'string' && meta.subject) || '(Sem assunto)';
  const subject = parsed.data.subject || (originalSubject.toLowerCase().startsWith('fwd:') ? originalSubject : `Fwd: ${originalSubject}`);

  const result = await sendEmailViaBird({
    to: parsed.data.to,
    subject,
    body: parsed.data.body,
    html: parsed.data.html,
    workspaceId: session.workspaceId,
    replyToMessageId: original.id
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, messageId: result.messageId, birdMessageId: result.birdMessageId });
}
