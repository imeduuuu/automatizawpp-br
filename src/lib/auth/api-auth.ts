/**
 * Autenticación para API endpoints
 * ================================
 * Maneja:
 * - Bearer token (API tokens personales)
 * - Session JWT (desde cookies)
 * - Validación de permisos por workspace
 */

import { NextRequest } from 'next/server';
import { AuthPayload, verifyAccessToken, verifyApiToken } from './auth-core';

const BEARER_PREFIX = 'Bearer ';

/**
 * Extraer y validar token del header Authorization
 */
export async function extractAndValidateToken(request: NextRequest): Promise<AuthPayload | null> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return null;
  }

  // Bearer token (API)
  if (authHeader.startsWith(BEARER_PREFIX)) {
    const token = authHeader.slice(BEARER_PREFIX.length);
    return await verifyApiToken(token);
  }

  return null;
}

/**
 * Extraer token JWT de cookies (para validar en middleware)
 */
export function extractTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get('auth.access-token')?.value || null;
}

/**
 * Middleware helper: requiere autenticación en endpoint API
 * Retorna 401 si no está autenticado
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ auth: AuthPayload | null; status?: number }> {
  // Intentar extraer desde Authorization header (Bearer token)
  let auth = await extractAndValidateToken(request);

  // Si no hay Bearer token, intentar desde cookies (sesión)
  if (!auth) {
    const token = extractTokenFromCookie(request);
    if (token) {
      auth = await verifyAccessToken(token);
    }
  }

  return { auth };
}

/**
 * Middleware helper: requiere autorización a workspace específico
 */
export async function requireWorkspaceAccess(
  request: NextRequest,
  requiredWorkspaceId: string
): Promise<{ auth: AuthPayload | null; authorized: boolean }> {
  const { auth } = await requireAuth(request);

  if (!auth) {
    return { auth: null, authorized: false };
  }

  const authorized = auth.workspaceId === requiredWorkspaceId || auth.role === 'admin';

  return { auth, authorized };
}

/**
 * Middleware helper: requiere rol específico
 */
export async function requireRole(
  request: NextRequest,
  requiredRoles: ('admin' | 'client' | 'agent')[]
): Promise<{ auth: AuthPayload | null; authorized: boolean }> {
  const { auth } = await requireAuth(request);

  if (!auth) {
    return { auth: null, authorized: false };
  }

  const authorized = requiredRoles.includes(auth.role);

  return { auth, authorized };
}
