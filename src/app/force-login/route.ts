import { NextRequest, NextResponse } from 'next/server';

const COOKIE_PREFIXES = [
  'authjs.',
  '__Secure-authjs.',
  '__Host-authjs.',
  'next-auth.',
  '__Secure-next-auth.'
];

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard';
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const loginUrl = new URL('/login', `${forwardedProto}://${forwardedHost}`);
  loginUrl.searchParams.set('callbackUrl', callbackUrl);
  loginUrl.searchParams.set('force', '1');

  const response = NextResponse.redirect(loginUrl);

  const cookieNames = new Set(
    request.cookies
      .getAll()
      .map((cookie) => cookie.name)
      .filter((name) => COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix)))
  );

  for (const cookieName of cookieNames) {
    response.cookies.set({
      name: cookieName,
      value: '',
      expires: new Date(0),
      path: '/'
    });
  }

  return response;
}
