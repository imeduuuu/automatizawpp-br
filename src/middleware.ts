/**
 * NUEVO MIDDLEWARE DE AUTENTICACIÓN
 * ==================================
 * - Valida JWT de cookies (nuevo sistema)
 * - Valida Bearer tokens en API
 * - Maneja redirección y autorización
 * - Mejor separación entre páginas y API
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/auth-core';

const PUBLIC_PAGE_PATHS = [
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/force-login',
  '/automacao-whatsapp',
  '/automacao-vendas',
  '/automacao-atendimento',
  '/casos-sucesso',
  '/blog',
  '/teste-gratis',
  '/contatos',
  '/contatos-publico',
  '/pricing',
  '/api-docs',
];

// API que NO requieren autenticación (tienen su propia autenticación)
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',     // Nuevo endpoint de login
  '/api/auth/logout',    // Nuevo endpoint de logout
  '/api/auth/refresh',   // Refrescar token
  '/api/register',       // Registro público
  '/api/webhooks',       // Webhooks con signature auth
  '/api/agents/heartbeat',
  '/api/gdpr/purge',
  '/api/events/inbound',
  '/api/test',
  '/api/debug',
  '/api/public',
  '/api/forms',
  '/api/leads',          // Creación de leads desde formularios públicos
  '/api/health',
  '/api/ops',
  '/api/system/tick',
  '/api/sentinel',
  '/api/newsletter',
  '/api/diagnostico',
  '/api/growth',
  '/api/blog',
  '/api/monitoring',
  '/api/monitoring/snapshot',
];

function getTokenFromRequest(request: NextRequest): string | null {
  // 1. Intentar obtener desde Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 2. Intentar obtener desde cookies (sesión de usuario)
  return request.cookies.get('auth.access-token')?.value || null;
}

function isResetPasswordPath(pathname: string) {
  return pathname.startsWith('/reset-password');
}

function isPublicPage(pathname: string): boolean {
  return (
    PUBLIC_PAGE_PATHS.includes(pathname) ||
    isResetPasswordPath(pathname) ||
    pathname.startsWith('/blog/')
  );
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromRequest(request);
  let isAuthenticated = false;

  // Validar token si existe
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      isAuthenticated = !!payload;
    } catch (error) {
      console.error('[Middleware] Token validation error:', error);
      isAuthenticated = false;
    }
  }

  // ============================================
  // MANEJO DE RUTAS API
  // ============================================
  if (pathname.startsWith('/api/')) {
    // API pública: pasar sin validar
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }

    // API privada: requiere autenticación
    if (!isAuthenticated) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // ============================================
  // MANEJO DE PÁGINAS
  // ============================================

  // Páginas públicas: permitir acceso
  if (isPublicPage(pathname)) {
    // Si está autenticado pero intenta acceder a login, redirigir a dashboard
    if (isAuthenticated && (pathname === '/login' || pathname === '/signup' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin));
    }

    return NextResponse.next();
  }

  // Páginas privadas: requiere autenticación
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)']
};
