import { auth } from '@/auth';
import { runFullScan } from '@/lib/sentinel/orchestrator';
import { sentinelJson, sentinelOptions } from '@/lib/sentinel/http';

async function ensureSentinelAccess(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied =
    request.headers.get('x-cron-secret') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (secret && supplied && supplied === secret) return null;

  const session = await auth();
  if (session?.user?.id) return null;

  return sentinelJson({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: Request) {
  const denied = await ensureSentinelAccess(request);
  if (denied) return denied;

  try {
    const result = await runFullScan();
    return sentinelJson({ status: 'completed', ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sentinelJson({ status: 'error', message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}

export async function OPTIONS() {
  return sentinelOptions();
}
