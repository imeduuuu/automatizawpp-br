import { NextRequest, NextResponse } from 'next/server';

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
  '/teste-gratis',   // página de trial gratuito — acesso público
  '/pricing',        // página de preços de marketing — acesso público
];

// API paths that do NOT require a session (have their own auth or are truly public)
const PUBLIC_API_PREFIXES = [
  '/api/auth',           // NextAuth endpoints
  '/api/register',       // public registration
  '/api/webhooks',       // Brevo/Stripe/Vapi/Meta — own signature auth
  '/api/agents/heartbeat', // cron secret
  '/api/gdpr/purge',     // cron secret
  '/api/events/inbound', // inbound events from external providers
  '/api/test',           // testing endpoints
  '/api/public',         // public dashboard endpoints (with token auth)
  '/api/health',         // Docker healthcheck — no auth required
  '/api/ops',            // internal ops/metrics endpoints
  '/api/system/tick',    // background tick — follow-ups + sentinel
  '/api/sentinel',       // sentinel scanner — sem auth própria
  '/api/newsletter',     // inscrição newsletter — público
  '/api/diagnostico',    // pedido de diagnóstico gratuito — público
];

function isResetPasswordPath(pathname: string) {
  return pathname.startsWith('/reset-password');
}

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value ||
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value
  );
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = hasSessionCookie(request);

  // API routes
  if (pathname.startsWith('/api/')) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!isPublicApi && !hasCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Page routes
  const isPublicPage = PUBLIC_PAGE_PATHS.includes(pathname) ||
                       isResetPasswordPath(pathname) ||
                       pathname.startsWith('/blog/');

  // Guard private pages: no cookie → send to login.
  if (!hasCookie && !isPublicPage) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Do NOT redirect users with a cookie away from public pages here.
  // The pages themselves call auth() server-side to validate the JWT and redirect
  // to /dashboard if the session is genuine. Doing it here based on cookie existence
  // alone caused stale-cookie redirect loops after NEXTAUTH_SECRET rotation.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)']
};
