/**
 * LOGOUT ENDPOINT
 * ===============
 * Limpia cookies y revoca refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { verifyAccessToken } from '@/lib/auth/auth-core';

export async function POST(request: NextRequest) {
  try {
    // Obtener tokens del request (del header o de cookies)
    const accessToken = request.cookies.get('auth.access-token')?.value;
    const refreshToken = request.cookies.get('auth.refresh-token')?.value;

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

    // Crear response y limpiar cookies
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.delete('auth.access-token');
    response.cookies.delete('auth.refresh-token');

    return response;
  } catch (error) {
    console.error('[Auth Logout]', error);
    return NextResponse.json(
      { ok: false, error: 'Error en logout' },
      { status: 500 }
    );
  }
}
