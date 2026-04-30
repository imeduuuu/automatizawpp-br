import { NextResponse } from 'next/server';
import { runFollowUps } from '@/lib/followup/runner';
import { runFullScan } from '@/lib/sentinel/orchestrator';

let lastSentinelScan = 0;
const SENTINEL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied =
    request.headers.get('x-cron-secret') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || supplied !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    const followUps = await runFollowUps();
    results.followUps = followUps;
  } catch (err) {
    results.followUps = { error: err instanceof Error ? err.message : String(err) };
  }

  const now = Date.now();
  if (now - lastSentinelScan >= SENTINEL_INTERVAL_MS) {
    lastSentinelScan = now;
    try {
      const scan = await runFullScan();
      results.sentinel = scan;
    } catch (err) {
      results.sentinel = { error: err instanceof Error ? err.message : String(err) };
    }
  } else {
    results.sentinel = { skipped: true, nextIn: Math.ceil((SENTINEL_INTERVAL_MS - (now - lastSentinelScan)) / 1000) };
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString(), ...results });
}
