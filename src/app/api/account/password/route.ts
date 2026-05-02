import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword, isValidBcryptHash } from '@/lib/auth/password';
import { logAuditEvent } from '@/lib/audit';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, 'A senha atual é obrigatória'),
    nextPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirme a nova senha')
  })
  .refine((values) => values.nextPassword === values.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados de senha inválidos.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        workspaceId: true,
        passwordHash: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.passwordHash) {
      console.error('[Password.POST] Usuario sin hash:', user.id);
      return NextResponse.json({ error: 'Não foi possível validar a senha atual.' }, { status: 400 });
    }

    // Validar que el hash en BD sea válido
    if (!isValidBcryptHash(user.passwordHash)) {
      console.error('[Password.POST] Hash corrupto en BD para usuario:', user.id);
      return NextResponse.json({ error: 'Não foi possível validar a senha atual.' }, { status: 400 });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      console.warn('[Password.POST] Contraseña incorrecta para usuario:', user.id);
      return NextResponse.json({ error: 'A senha atual não está correta.' }, { status: 400 });
    }

    // Hash la nueva contraseña
    let nextPasswordHash: string;
    try {
      nextPasswordHash = await hashPassword(parsed.data.nextPassword);
    } catch (hashError) {
      const message = hashError instanceof Error ? hashError.message : 'Error al hashear';
      console.error('[Password.POST] Error al hashear nueva contraseña:', message);
      return NextResponse.json({ error: 'Erro ao processar nova senha.' }, { status: 500 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: nextPasswordHash }
    });

    await logAuditEvent({
      event: 'ACCOUNT_PASSWORD_UPDATED',
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Password.POST] Error crítico:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
