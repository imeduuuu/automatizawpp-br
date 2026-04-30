import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LeadStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

const createLeadSchema = z.object({
  workspaceId: z.string().min(1).optional(),
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  productInterest: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));

    const rawStatus = searchParams.get('status')?.trim().toUpperCase();
    if (rawStatus && !Object.values(LeadStatus).includes(rawStatus as LeadStatus)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    const status = rawStatus as LeadStatus | undefined;
    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '50', 10) || 50));
    const skip = (page - 1) * limit;

    const where = {
      ...(workspaceId ? { workspaceId } : {}),
      ...(status ? { status } : {})
    };

    const [total, rows] = await prisma.$transaction([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          company: true,
          phone: true,
          email: true,
          status: true,
          nextAction: true,
          nextActionAt: true,
          lastContactAt: true,
          lastCallAt: true,
          lastEmailAt: true,
          createdAt: true,
          updatedAt: true
        }
      })
    ]);

    const leads = rows.map((lead) => {
      const name = lead.fullName?.trim() || [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() || 'Lead sem nome';
      const actionCandidates = [lead.lastContactAt, lead.lastCallAt, lead.lastEmailAt, lead.updatedAt]
        .filter((value): value is Date => value instanceof Date)
        .sort((a, b) => b.getTime() - a.getTime());
      const lastActionAt = actionCandidates[0] ?? null;

      return {
        id: lead.id,
        name,
        fullName: name,
        company: lead.company,
        phone: lead.phone,
        email: lead.email,
        status: lead.status,
        lastActionAt: lastActionAt?.toISOString() ?? null,
        lastContactAt: lead.lastContactAt?.toISOString() ?? lastActionAt?.toISOString() ?? null,
        nextAction: lead.nextAction,
        nextActionAt: lead.nextActionAt?.toISOString() ?? null,
        createdAt: lead.createdAt.toISOString()
      };
    });

    return NextResponse.json({ leads, total });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const workspaceId = await resolveWorkspaceId(parsed.data.workspaceId);
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        workspaceId,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company: parsed.data.company,
        source: parsed.data.source,
        productInterest: parsed.data.productInterest,
        status: 'NEW'
      }
    });

    if (lead.email) {
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

      const appUrl = process.env.APP_URL ?? 'https://automatizawpp.com';

      // disparo assíncrono, não bloqueia a resposta
      import('@/lib/mail').then(({ sendSmtpMail }) =>
        import('@/lib/email-templates').then(({ renderEmailTemplate }) => {
          const { subject, html, text } = renderEmailTemplate('welcome', {
            name: lead.fullName ?? 'Cliente',
            businessName: lead.company ?? lead.fullName ?? 'seu negócio',
            trialEndsAt,
            password: '',   // senha já foi definida pelo usuário
            appUrl,
          });
          return sendSmtpMail({ to: lead.email!, subject, html, text });
        })
      ).catch(console.error);
    }

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
