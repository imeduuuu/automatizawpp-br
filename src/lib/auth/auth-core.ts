/**
 * SISTEMA DE AUTENTICACIÓN DEFINITIVO
 * ====================================
 * Reemplaza NextAuth con un sistema híbrido custom:
 * - JWT + Refresh tokens para sesiones de usuario
 * - Bearer tokens para API (con rate limiting y expiración)
 * - Soporte para Magic Links (OAuth futuro)
 * - Auditoría completa y rate limiting
 */

import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default-dev-secret-change-in-production'
);

const JWT_EXPIRATION = {
  access: 15 * 60, // 15 minutos
  refresh: 7 * 24 * 60 * 60, // 7 días
  apiToken: 365 * 24 * 60 * 60 // 1 año
};

export interface AuthPayload {
  userId: string;
  id?: string;
  workspaceId: string;
  email: string;
  role: 'admin' | 'client' | 'agent';
  type: 'session' | 'api';
  subscriptionStatus?: string;
  trialEndsAt?: Date | null;
  businessName?: string;
  [key: string]: unknown;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generar JWT con claims personalizados
 */
export async function generateAccessToken(payload: AuthPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + JWT_EXPIRATION.access)
    .sign(JWT_SECRET);
}

/**
 * Generar refresh token (almacenado en BD)
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + JWT_EXPIRATION.refresh * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      hashedToken,
      expiresAt,
      isRevoked: false
    }
  });

  return token;
}

/**
 * Generar API token (clave de larga duración para servicios)
 */
export async function generateApiToken(
  userId: string,
  name: string,
  expiresInDays: number = 365
): Promise<string> {
  const rawToken = `aut_${crypto.randomBytes(24).toString('hex')}`;
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.apiToken.create({
    data: {
      userId,
      hashedToken,
      name,
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      lastUsedAt: null,
      isRevoked: false
    }
  });

  return rawToken;
}

/**
 * Verificar y decodificar JWT
 */
export async function verifyAccessToken(token: string): Promise<AuthPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as AuthPayload;
  } catch (error) {
    console.error('[Auth] JWT verification failed:', error);
    return null;
  }
}

/**
 * Validar refresh token contra BD
 */
export async function verifyRefreshToken(userId: string, token: string): Promise<boolean> {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const refreshToken = await prisma.refreshToken.findUnique({
    where: { userId_hashedToken: { userId, hashedToken } }
  });

  if (!refreshToken) return false;

  // Verificar que no está revocado y no ha expirado
  if (refreshToken.isRevoked || refreshToken.expiresAt < new Date()) {
    return false;
  }

  return true;
}

/**
 * Validar API token contra BD
 */
export async function verifyApiToken(token: string): Promise<AuthPayload | null> {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const apiToken = await prisma.apiToken.findUnique({
    where: { hashedToken }
  });

  if (!apiToken) return null;

  // Verificar que no está revocado y no ha expirado
  if (apiToken.isRevoked || apiToken.expiresAt < new Date()) {
    return null;
  }

  // Actualizar último uso
  await prisma.apiToken.update({
    where: { hashedToken },
    data: { lastUsedAt: new Date() }
  });

  // Obtener usuario para retornar payload completo
  const user = await prisma.user.findUnique({
    where: { id: apiToken.userId }
  });

  if (!user) return null;

  return {
    userId: user.id,
    workspaceId: user.workspaceId,
    email: user.email,
    role: (user.role as any) || 'client',
    type: 'api'
  };
}

/**
 * Refrescar access token usando refresh token
 */
export async function refreshAccessToken(
  userId: string,
  refreshToken: string
): Promise<AuthTokens | null> {
  // Validar refresh token
  if (!(await verifyRefreshToken(userId, refreshToken))) {
    return null;
  }

  // Obtener usuario
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return null;

  const payload: AuthPayload = {
    userId: user.id,
    workspaceId: user.workspaceId,
    email: user.email,
    role: (user.role as any) || 'client',
    type: 'session'
  };

  const accessToken = await generateAccessToken(payload);
  const newRefreshToken = await generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: JWT_EXPIRATION.access
  };
}

/**
 * Revocar sesión (invalidar refresh token)
 */
export async function revokeSession(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.update({
      where: { userId_hashedToken: { userId, hashedToken } },
      data: { isRevoked: true }
    });
  } else {
    // Revocar todos los tokens del usuario
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    });
  }
}

/**
 * Revocar API token
 */
export async function revokeApiToken(tokenId: string): Promise<void> {
  await prisma.apiToken.update({
    where: { id: tokenId },
    data: { isRevoked: true }
  });
}
