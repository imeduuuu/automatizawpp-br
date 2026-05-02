import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

const submitLeadSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  company: z.string().optional(),
  source: z.string().optional(),
  productInterest: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitLeadSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validação falhou', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Resolve workspace (default for public submissions)
    const workspaceId = await resolveWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 400 }
      );
    }

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        workspaceId,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company: parsed.data.company,
        source: parsed.data.source || 'public-form',
        productInterest: parsed.data.productInterest,
        status: 'NEW'
      }
    });

    // Send welcome email asynchronously
    if (lead.email) {
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

      const appUrl = process.env.APP_URL ?? 'https://automatizawpp.com';

      import('@/lib/mail').then(({ sendSmtpMail }) =>
        import('@/lib/email-templates').then(({ renderEmailTemplate }) => {
          const { subject, html, text } = renderEmailTemplate('welcome', {
            name: lead.fullName ?? 'Cliente',
            businessName: lead.company ?? lead.fullName ?? 'seu negócio',
            trialEndsAt,
            password: '',
            appUrl,
          });
          return sendSmtpMail({ to: lead.email!, subject, html, text });
        })
      ).catch(console.error);
    }

    return NextResponse.json(
      {
        success: true,
        leadId: lead.id,
        message: 'Lead criado com sucesso. Um email de confirmação foi enviado.'
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
