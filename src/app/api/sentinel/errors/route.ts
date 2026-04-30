import { prisma } from '@/lib/db';
import { sentinelJson, sentinelOptions } from '@/lib/sentinel/http';

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
}

export async function OPTIONS() {
  return sentinelOptions();
}
