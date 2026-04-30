import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { sentinelJson, sentinelOptions } from '@/lib/sentinel/http';
import { SENTINEL_REVIEW_TYPES } from '@/lib/sentinel/review-types';

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

function normalizeSources(value: unknown): string[] {
  const defaults = ['n8n', 'vapi', 'brevo', 'stripe', 'webhook', 'panel'];
  const withPanel = (items: string[]) => (items.includes('panel') ? items : [...items, 'panel']);
  if (Array.isArray(value)) {
    return withPanel(value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0));
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? withPanel(parsed.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0))
        : defaults;
    } catch {
      return defaults;
    }
  }

  return defaults;
}

export async function GET(request: Request) {
  const denied = await ensureSentinelAccess(request);
  if (denied) return denied;

  try {
    const now = Date.now();
    const h24 = new Date(now - 24 * 60 * 60 * 1000);
    const h1 = new Date(now - 60 * 60 * 1000);

    const [total, unresolved, critical, last24h, lastHour, autoFixed, recentScans, config] = await Promise.all([
      prisma.sentinelError.count(),
      prisma.sentinelError.count({ where: { resolved: false } }),
      prisma.sentinelError.count({ where: { severity: 'critical', resolved: false } }),
      prisma.sentinelError.count({ where: { createdAt: { gte: h24 } } }),
      prisma.sentinelError.count({ where: { createdAt: { gte: h1 } } }),
      prisma.sentinelError.count({ where: { autoFixed: true } }),
      prisma.sentinelScan.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.sentinelConfig.findUnique({ where: { id: 'singleton' } })
    ]);

    return sentinelJson({
      total,
      unresolved,
      critical,
      last24h,
      lastHour,
      autoFixed,
      enabled: config?.enabled ?? true,
      autoFixEnabled: config?.autoFix ?? true,
      scanInterval: config?.scanInterval ?? 300,
      model: config?.model ?? 'gpt-4o',
      sources: normalizeSources(config?.sources),
      reviewTypes: SENTINEL_REVIEW_TYPES,
      recentScans
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sentinelJson({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return sentinelOptions();
}
