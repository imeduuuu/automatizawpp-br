/**
 * REFRESH TOKEN ENDPOINT
 * ======================
 * Obtiene nuevo access token usando refresh token
 * Llamado automáticamente cuando access token expira
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshAccessToken } from '@/lib/auth/auth-core';
import { setSessionCookies } from '@/lib/auth/session';
import { verifyAccessToken } from '@/lib/auth/auth-core';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('auth.access-token')?.value;
    const refreshToken = cookieStore.get('auth.refresh-token')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { ok: false, error: 'Tokens no encontrados' },
        { status: 401 }
      );
    }

    // Obtener userId del access token (incluso si expiró)
    let userId: string | undefined;

    try {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        userId = payload.userId;
      }
    } catch (error) {
      // Token expirado - intentar decodificar sin verificar firma
      // En producción, se requeriría un endpoint separado con validación adicional
      console.error('[Refresh] Access token inválido');
      return NextResponse.json(
        { ok: false, error: 'Sesión inválida' },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Sesión inválida' },
        { status: 401 }
      );
    }

    // Refrescar token
    const tokens = await refreshAccessToken(userId, refreshToken);

    if (!tokens) {
      return NextResponse.json(
        { ok: false, error: 'Refresh token inválido o expirado' },
        { status: 401 }
      );
    }

    // Setear nuevas cookies
    await setSessionCookies(tokens.accessToken, tokens.refreshToken);

    return NextResponse.json(
      {
        ok: true,
        expiresIn: tokens.expiresIn
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Auth Refresh]', error);
    return NextResponse.json(
      { ok: false, error: 'Error al refrescar sesión' },
      { status: 500 }
    );
  }
}
