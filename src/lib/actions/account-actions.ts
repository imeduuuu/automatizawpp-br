'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { logAuditEvent } from '@/lib/audit';
import { initialActionState, type ActionState } from '@/lib/actions/types';

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Introduce un email valido')
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, 'La contrasena actual es obligatoria'),
    nextPassword: z.string().min(8, 'La nueva contrasena debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirma la nueva contrasena')
  })
  .refine((values) => values.nextPassword === values.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword']
  });

const deleteSchema = z.object({
  confirmation: z.literal('ELIMINAR')
});

function validationError(error: z.ZodError): ActionState {
  return {
    status: 'error',
    message: 'Revisa los campos marcados.',
    fieldErrors: error.flatten().fieldErrors
  };
}

async function requireSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function updateProfileAction(_previousState: ActionState = initialActionState, formData: FormData): Promise<ActionState> {
  void _previousState;
  const user = await requireSessionUser();

  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email')
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  const duplicate = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      id: { not: user.id }
    },
    select: { id: true }
  });

  if (duplicate) {
    return {
      status: 'error',
      message: 'Este email ya esta en uso por otra cuenta.'
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      email: normalizedEmail
    }
  });

  await logAuditEvent({
    event: 'ACCOUNT_PROFILE_UPDATED',
    userId: user.id,
    workspaceId: user.workspaceId,
    email: normalizedEmail
  });

  return {
    status: 'success',
    message: 'Perfil actualizado correctamente.'
  };
}

export async function changePasswordAction(_previousState: ActionState = initialActionState, formData: FormData): Promise<ActionState> {
  void _previousState;
  const user = await requireSessionUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    nextPassword: formData.get('nextPassword'),
    confirmPassword: formData.get('confirmPassword')
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (!user.passwordHash) {
    return {
      status: 'error',
      message: 'No se puede validar la contrasena actual. Contacta soporte.'
    };
  }

  const isCurrentPasswordValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    return {
      status: 'error',
      message: 'La contrasena actual no es correcta.'
    };
  }

  const nextPasswordHash = await hashPassword(parsed.data.nextPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: nextPasswordHash
    }
  });

  await logAuditEvent({
    event: 'ACCOUNT_PASSWORD_UPDATED',
    userId: user.id,
    workspaceId: user.workspaceId,
    email: user.email
  });

  return {
    status: 'success',
    message: 'Contrasena actualizada correctamente.'
  };
}

export async function deleteAccountAction(_previousState: ActionState = initialActionState, formData: FormData): Promise<ActionState> {
  void _previousState;
  const user = await requireSessionUser();

  const parsed = deleteSchema.safeParse({
    confirmation: formData.get('confirmation')
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Escribe ELIMINAR para confirmar la baja de cuenta.'
    };
  }

  await logAuditEvent({
    event: 'ACCOUNT_DELETED',
    userId: user.id,
    workspaceId: user.workspaceId,
    email: user.email
  });

  await prisma.user.delete({ where: { id: user.id } });

  await signOut({ redirectTo: '/signup?accountDeleted=1' });

  return {
    status: 'success',
    message: 'Cuenta eliminada.'
  };
}
