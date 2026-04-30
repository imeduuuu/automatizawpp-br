import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { sendSmtpMail } from '@/lib/mail';

const schema = z.object({
  userId: z.string().min(1),
  plan: z.enum(['STARTER', 'PRO', 'SCALE']),
  contactMethod: z.enum(['WHATSAPP', 'EMAIL', 'LLAMADA'])
});

function notificationHtml(params: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  plan: string;
  contactMethod: string;
}) {
  return `
    <h2>Nova solicitação de assinatura AutomatizaWPP</h2>
    <p><strong>Cliente:</strong> ${params.customerName}</p>
    <p><strong>E-mail:</strong> ${params.customerEmail}</p>
    <p><strong>Telefone:</strong> ${params.customerPhone}</p>
    <p><strong>Plano solicitado:</strong> ${params.plan}</p>
    <p><strong>Método de contato preferido:</strong> ${params.contactMethod}</p>
  `;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Solicitação inválida.' }, { status: 400 });
    }

    if (parsed.data.userId !== session.user.id) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subscriptionStatus: true
      }
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    await prisma.subscriptionRequest.create({
      data: {
        userId: user.id,
        plan: parsed.data.plan,
        contactMethod: parsed.data.contactMethod,
        status: 'PENDING'
      }
    });

    if ((user.subscriptionStatus || '').toUpperCase() === 'TRIAL') {
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: 'PENDING' }
      });
    }

    const adminEmail = 'hola@automatizawpp.com';
    const notification = await sendSmtpMail({
      to: adminEmail,
      subject: `Nova solicitação de plano ${parsed.data.plan} - ${user.name}`,
      html: notificationHtml({
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || 'Não informado',
        plan: parsed.data.plan,
        contactMethod: parsed.data.contactMethod
      })
    });

    if (!notification.ok) {
      console.warn('[subscription-request] notification email not delivered:', notification.error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
