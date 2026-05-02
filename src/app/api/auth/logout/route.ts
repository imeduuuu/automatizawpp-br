/**
 * LOGOUT ENDPOINT
 * ===============
 * Limpia cookies y revoca refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { getAccessToken } from '@/lib/auth/session';
import { verifyAccessToken } from '@/lib/auth/auth-core';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('auth.access-token')?.value;
    const refreshToken = cookieStore.get('auth.refresh-token')?.value;

    // Obtener payload del token para auditoría
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        // Revocar todos los refresh tokens del usuario
        await prisma.refreshToken.updateMany({
          where: { userId: payload.userId },
          data: { isRevoked: true }
        });

        await logAuditEvent({
          event: 'AUTH_LOGOUT',
          userId: payload.userId,
          email: payload.email
        });
      }
    }

    // Limpiar cookies
    cookieStore.delete('auth.access-token');
    cookieStore.delete('auth.refresh-token');

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[Auth Logout]', error);
    return NextResponse.json(
      { ok: false, error: 'Error en logout' },
      { status: 500 }
    );
  }
}
