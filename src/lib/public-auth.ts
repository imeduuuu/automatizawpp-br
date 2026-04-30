import { NextRequest, NextResponse } from 'next/server';

export function validatePublicToken(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                new URL(request.url).searchParams.get('token');
  return token === process.env.PUBLIC_DASHBOARD_TOKEN;
}

export function createUnauthorizedResponse(msg: string) {
  return NextResponse.json({ error: msg }, { status: 401 });
}
