import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { renderEmailTemplate } from '@/lib/email-templates';
import { sendSmtpMail } from '@/lib/mail';

const schema = z.object({
  templateKey: z.string().min(1),
  to: z.string().email(),
  vars: z.record(z.string()),
  leadId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { templateKey, to, vars, leadId } = parsed.data;

    const { subject, html, text } = renderEmailTemplate(
      templateKey as Parameters<typeof renderEmailTemplate>[0],
      vars as Parameters<typeof renderEmailTemplate>[1]
    );

    const result = await sendSmtpMail({ to, subject, html, text });

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Falha ao enviar email', provider: result.provider },
        { status: 500 }
      );
    }

    if (leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { lastEmailAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true, provider: result.provider, template: templateKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
