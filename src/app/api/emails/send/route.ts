import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

const sendEmailSchema = z.object({
  workspaceId: z.string().optional(),
  leadId: z.string().min(1),
  to: z.string().email(),
  subject: z.string().min(3),
  body: z.string().min(10),
  html: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sendEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const workspaceId = await resolveWorkspaceId(parsed.data.workspaceId);

    // Verificar se o lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: parsed.data.leadId }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Registar o evento de email
    const emailEvent = await prisma.emailEvent.create({
      data: {
        workspaceId: workspaceId || lead.workspaceId,
        leadId: parsed.data.leadId,
        type: 'SENT',
        subject: parsed.data.subject,
        body: parsed.data.body,
        fromEmail: process.env.SMTP_FROM || 'noreply@automatizawpp.com',
        toEmail: parsed.data.to,
        status: 'PENDING'
      }
    });

    // TODO: Integrar com a tool de email real (Bird, Brevo, etc.)
    // Por agora, apenas registamos o evento
    console.log('[EMAIL] Send request for:', {
      leadId: parsed.data.leadId,
      to: parsed.data.to,
      subject: parsed.data.subject
    });

    // Atualizar lastEmailAt no lead
    await prisma.lead.update({
      where: { id: parsed.data.leadId },
      data: { lastEmailAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      eventId: emailEvent.id,
      message: 'Email enviado com sucesso'
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
