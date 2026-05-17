// /api/emails/reply/route.ts — POST: responder a un email existente
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { sendEmailViaBird } from '@/lib/email/send';

const replySchema = z.object({
  messageId: z.string().min(1),
  body: z.string().min(1),
  html: z.string().optional(),
  subject: z.string().optional() // por defecto "Re: <subject original>"
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado' }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parsed = replySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const original = await prisma.message.findUnique({
    where: { id: parsed.data.messageId },
    include: { lead: { select: { id: true, email: true, fullName: true } } }
  });
  if (!original) {
    return NextResponse.json({ ok: false, error: 'Mensagem original não encontrada' }, { status: 404 });
  }

  const meta = (original.metadata && typeof original.metadata === 'object' ? original.metadata : {}) as Record<string, unknown>;
  const toEmail = (typeof meta.fromEmail === 'string' && meta.fromEmail) || original.lead?.email;
  if (!toEmail) {
    return NextResponse.json({ ok: false, error: 'Sem email de destino (mensagem sem fromEmail nem lead com email)' }, { status: 400 });
  }

  const originalSubject = (typeof meta.subject === 'string' && meta.subject) || '(Sem assunto)';
  const subject = parsed.data.subject || (originalSubject.toLowerCase().startsWith('re:') ? originalSubject : `Re: ${originalSubject}`);

  const result = await sendEmailViaBird({
    to: toEmail,
    subject,
    body: parsed.data.body,
    html: parsed.data.html,
    leadId: original.leadId,
    conversationId: original.conversationId,
    replyToMessageId: original.id
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, messageId: result.messageId, birdMessageId: result.birdMessageId });
}
