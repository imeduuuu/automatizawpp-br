import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { plainTextToHtml, sendSmtpMail } from '@/lib/mail';

const schema = z.object({
  to: z.string().min(3),
  subject: z.string().min(1),
  body: z.string().min(1),
  htmlBody: z.string().optional(),
  cc: z.string().optional(),
  replyTo: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Dados inválidos' }, { status: 400 });

  const result = await sendSmtpMail({
    to: parsed.data.to,
    subject: parsed.data.subject,
    html: parsed.data.htmlBody || plainTextToHtml(parsed.data.body),
    text: parsed.data.body,
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, provider: result.provider });
}
