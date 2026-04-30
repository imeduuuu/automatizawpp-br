import { auth } from '@/auth';
import { prisma } from '@/lib/db';
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

function toPositiveLimit(value: string | null, fallback = 50) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.trunc(parsed), 200);
}

function toOptionalBoolean(value: string | null) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export async function GET(request: Request) {
  const denied = await ensureSentinelAccess(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source')?.trim() || undefined;
    const severity = searchParams.get('severity')?.trim() || undefined;
    const resolved = toOptionalBoolean(searchParams.get('resolved'));
    const limit = toPositiveLimit(searchParams.get('limit'));

    const where = {
      ...(source ? { source } : {}),
      ...(severity ? { severity } : {}),
      ...(resolved === undefined ? {} : { resolved })
    };

    const errors = await prisma.sentinelError.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return sentinelJson({ errors, count: errors.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sentinelJson({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return sentinelOptions();
}
