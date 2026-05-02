'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createPasswordResetToken, getValidPasswordResetToken, invalidateUserResetTokens, markPasswordResetTokenAsUsed } from '@/lib/auth/password-reset';
import { sendPasswordResetEmail } from '@/lib/auth/email';
import { logAuditEvent } from '@/lib/audit';
import { assignServicesToUser } from '@/lib/services/catalog';
import { initialActionState, type ActionState } from '@/lib/actions/types';

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  callbackUrl: z.string().optional()
});

const signupSchema = z
  .object({
    name: z.string().min(2, 'Seu nome é obrigatório'),
    email: z.string().email('Informe um e-mail válido'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirme sua senha')
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  });

const forgotPasswordSchema = z.object({
  email: z.string().email('Informe um e-mail válido')
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(20),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8)
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  });

function validationError(error: z.ZodError): ActionState {
  return {
    status: 'error',
    message: 'Verifique os campos indicados.',
    fieldErrors: error.flatten().fieldErrors
  };
}

export async function loginAction(_previousState: ActionState = initialActionState, formData: FormData): Promise<ActionState> {
  void _previousState;
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    callbackUrl: formData.get('callbackUrl') || undefined
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { email, password, callbackUrl } = parsed.data;

  try {
    // Llamar al nuevo endpoint de login
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.toLowerCase(),
        password
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        status: 'error',
        message: error.error || 'Email ou senha incorretos.'
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[LoginAction]', message);
    return {
      status: 'error',
      message: 'Erro ao entrar. Tente novamente.'
    };
  }

  // Éxito: redirigir FUERA del try-catch
  const callbackUrlFinal = callbackUrl || '/dashboard';
  redirect(callbackUrlFinal);
}

export async function signupAction(_previousState: ActionState = initialActionState, formData: FormData): Promise<ActionState> {
  void _previousState;
  const parsed = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword')
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return {
      status: 'error',
      message: 'Já existe uma conta com este e-mail.'
    };
  }

  const passwordHash = await hashPassword(password);

  const createdUser = await prisma.$transaction(async (transaction) => {
    const workspace = await transaction.workspace.create({
      data: {
        name: `${name.split(' ')[0]} Workspace`,
        timezone: 'America/Sao_Paulo'
      }
    });

    return transaction.user.create({
      data: {
        workspaceId: workspace.id,
        name,
        email: normalizedEmail,
        role: 'client',
        passwordHash
      }
    });
  });

  await assignServicesToUser(createdUser.id, 'profesional');

  await logAuditEvent({
    event: 'AUTH_SIGNUP',
    userId: createdUser.id,
    workspaceId: createdUser.workspaceId,
    email: createdUser.email,
    metadata: { plan: 'profesional' }
  });

  // Tentar fazer login automático após signup
  try {
    const loginResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        password
      })
    });

    if (loginResponse.ok) {
      redirect('/dashboard');
    }
  } catch (error) {
    console.error('[SignupAction] Auto-login failed:', error);
  }

  return {
    status: 'success',
    message: 'Conta criada com sucesso. Faça login para continuar.',
    fieldErrors: {}
  };
}

export async function forgotPasswordAction(_previousState: ActionState = initialActionState, formData: FormData): Promise<ActionState> {
  void _previousState;
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user) {
    try {
      await invalidateUserResetTokens(user.id);
      const rawToken = await createPasswordResetToken(user.id);

      const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetLink = `${appUrl}/reset-password/${rawToken}`;

      const delivery = await sendPasswordResetEmail(user.email, resetLink);

      await logAuditEvent({
        event: 'AUTH_PASSWORD_RESET_REQUESTED',
        userId: user.id,
        workspaceId: user.workspaceId,
        email: user.email,
        metadata: {
          mailProvider: delivery.provider,
          mailDelivered: delivery.ok,
          mailError: delivery.error || null
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[auth] forgotPassword internal error', message);
    }
  }

  return {
    status: 'success',
    message: 'Se o email existir, enviamos um link para redefinir a senha.'
  };
}

export async function resetPasswordAction(_previousState: ActionState = initialActionState, formData: FormData): Promise<ActionState> {
  void _previousState;
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword')
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { token, password } = parsed.data;
  const tokenRecord = await getValidPasswordResetToken(token);

  if (!tokenRecord) {
    return {
      status: 'error',
      message: 'O link não é válido ou expirou.'
    };
  }

  const nextPasswordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: {
      passwordHash: nextPasswordHash
    }
  });

  await markPasswordResetTokenAsUsed(token);
  await invalidateUserResetTokens(tokenRecord.userId);

  await logAuditEvent({
    event: 'AUTH_PASSWORD_CHANGED',
    userId: tokenRecord.userId,
    workspaceId: tokenRecord.user.workspaceId,
    email: tokenRecord.user.email
  });

  redirect('/login?reset=success');
}

export async function logoutAction() {
  const session = await auth();

  if (session?.user?.id) {
    await logAuditEvent({
      event: 'AUTH_LOGOUT',
      userId: session.user.id,
      email: session.user.email
    });
  }

  await signOut({ redirectTo: '/login' });
}
