/**
 * GET /api/auth/me
 * ================
 * Retorna datos de la sesión actual del usuario autenticado
 * Usado por el cliente para validar sesión
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/auth-core';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('auth.access-token')?.value;

    // Intentar extraer token del header o cookies
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validar token
    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Obtener información adicional del usuario si es necesario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        workspaceId: true,
        role: true,
        image: true,
        subscriptionStatus: true,
        trialEndsAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: user.workspaceId,
          role: user.role,
          image: user.image,
          subscriptionStatus: user.subscriptionStatus,
          trialEndsAt: user.trialEndsAt
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Auth Me]', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
