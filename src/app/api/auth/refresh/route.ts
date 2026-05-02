/**
 * REFRESH TOKEN ENDPOINT
 * ======================
 * Obtiene nuevo access token usando refresh token
 * Llamado automáticamente cuando access token expira
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/auth/auth-core';
import { getSessionCookieOptions } from '@/lib/auth/session';
import { verifyAccessToken } from '@/lib/auth/auth-core';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('auth.access-token')?.value;
    const refreshToken = request.cookies.get('auth.refresh-token')?.value;

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

    // Crear response con nuevas cookies
    const response = NextResponse.json(
      {
        ok: true,
        expiresIn: tokens.expiresIn
      },
      { status: 200 }
    );

    // Setear cookies httpOnly en el response
    const cookieOptions = getSessionCookieOptions();
    response.cookies.set(
      cookieOptions.accessToken.name,
      tokens.accessToken,
      cookieOptions.accessToken.options
    );
    response.cookies.set(
      cookieOptions.refreshToken.name,
      tokens.refreshToken,
      cookieOptions.refreshToken.options
    );

    return response;
  } catch (error) {
    console.error('[Auth Refresh]', error);
    return NextResponse.json(
      { ok: false, error: 'Error al refrescar sesión' },
      { status: 500 }
    );
  }
}
