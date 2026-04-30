import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        status: 'healthy',
        uptimeMs: Math.round(process.uptime() * 1000),
        latencyMs: Date.now() - startedAt,
        ts: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        status: 'degraded',
        error: message,
        latencyMs: Date.now() - startedAt,
        ts: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
