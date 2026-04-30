import { NextResponse } from 'next/server';

export const SENTINEL_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

export function sentinelJson(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      ...SENTINEL_CORS_HEADERS,
      ...(init?.headers || {})
    }
  });
}

export function sentinelOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: SENTINEL_CORS_HEADERS
  });
}
