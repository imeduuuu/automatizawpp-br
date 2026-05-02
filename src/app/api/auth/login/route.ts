/**
 * NUEVO ENDPOINT DE LOGIN
 * =======================
 * Reemplaza signIn('credentials') con un endpoint que:
 * 1. Valida credenciales contra BD
 * 2. Genera access token + refresh token
 * 3. Setea cookies httpOnly
 * 4. Registra en auditoría
 * 5. Retorna payload con sesión
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, isValidBcryptHash } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/auth-core';
import { setSessionCookies } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña requerida')
});

const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(email);

  if (!record) {
    loginAttempts.set(email, { count: 1, resetTime: now + LOCK_TIME_MS });
    return true;
  }

  if (now > record.resetTime) {
    loginAttempts.set(email, { count: 1, resetTime: now + LOCK_TIME_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

function resetRateLimit(email: string): void {
  loginAttempts.delete(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      console.error('[Auth Login] Validation error:', parsed.error.flatten());
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid email or password format',
          details: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Rate limiting: protección contra fuerza bruta
    if (!checkRateLimit(normalizedEmail)) {
      await logAuditEvent({
        event: 'AUTH_RATE_LIMIT_EXCEEDED',
        email: normalizedEmail,
        metadata: { ip: request.headers.get('x-forwarded-for') || 'unknown' }
      });

      return NextResponse.json(
        {
          ok: false,
          error: 'Demasiados intentos fallidos. Intente más tarde.'
        },
        { status: 429 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        workspaceId: true,
        role: true,
        passwordHash: true
      }
    });

    if (!user || !user.passwordHash) {
      await logAuditEvent({
        event: 'AUTH_FAILED',
        email: normalizedEmail,
        metadata: { reason: user ? 'invalid_password' : 'user_not_found' }
      });

      return NextResponse.json(
        {
          ok: false,
          error: 'Email o contraseña incorrectos.'
        },
        { status: 401 }
      );
    }

    // Validar formato del hash
    if (!isValidBcryptHash(user.passwordHash)) {
      console.error('[Auth] Hash bcrypt inválido para usuario:', user.id);
      return NextResponse.json(
        {
          ok: false,
          error: 'Error de autenticación. Contacte al soporte.'
        },
        { status: 500 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      await logAuditEvent({
        event: 'AUTH_FAILED',
        email: normalizedEmail,
        metadata: { reason: 'invalid_password' }
      });

      return NextResponse.json(
        {
          ok: false,
          error: 'Email o contraseña incorrectos.'
        },
        { status: 401 }
      );
    }

    // Login exitoso: limpiar rate limit
    resetRateLimit(normalizedEmail);

    // Generar tokens
    const accessToken = await generateAccessToken({
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email,
      role: (user.role as any) || 'client',
      type: 'session'
    });

    const refreshToken = await generateRefreshToken(user.id);

    // Setear cookies httpOnly
    await setSessionCookies(accessToken, refreshToken);

    // Registrar evento de login
    await logAuditEvent({
      event: 'AUTH_LOGIN',
      userId: user.id,
      email: user.email,
      metadata: { ip: request.headers.get('x-forwarded-for') || 'unknown' }
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: user.workspaceId,
          role: user.role
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Auth Login]', message);

    return NextResponse.json(
      {
        ok: false,
        error: 'Error en la autenticación. Intente más tarde.'
      },
      { status: 500 }
    );
  }
}
