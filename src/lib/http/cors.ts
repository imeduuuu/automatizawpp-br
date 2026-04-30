import { NextResponse } from 'next/server';

export const DEFAULT_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

export function corsJson(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      ...DEFAULT_CORS_HEADERS,
      ...(init?.headers || {})
    }
  });
}

export function corsOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: DEFAULT_CORS_HEADERS
  });
}
