import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Nome inválido'),
  email: z.string().trim().email('E-mail inválido'),
  businessName: z.string().trim().max(160).optional().or(z.literal('')),
  phone: z.string().trim().max(60).optional().or(z.literal(''))
});

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        phone: true,
        subscriptionStatus: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        ...user,
        createdAt: user.createdAt.toISOString()
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados de perfil inválidos.' }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const duplicate = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: session.user.id }
      },
      select: { id: true }
    });

    if (duplicate) {
      return NextResponse.json({ error: 'Este email já está em uso.' }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        email: normalizedEmail,
        businessName: normalizeOptionalString(parsed.data.businessName),
        phone: normalizeOptionalString(parsed.data.phone)
      },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        phone: true,
        subscriptionStatus: true,
        createdAt: true,
        workspaceId: true
      }
    });

    await logAuditEvent({
      event: 'ACCOUNT_PROFILE_UPDATED',
      userId: updated.id,
      workspaceId: updated.workspaceId,
      email: updated.email,
      metadata: {
        businessName: updated.businessName,
        phone: updated.phone
      }
    });

    return NextResponse.json({
      ok: true,
      profile: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        businessName: updated.businessName,
        phone: updated.phone,
        subscriptionStatus: updated.subscriptionStatus,
        createdAt: updated.createdAt.toISOString()
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
