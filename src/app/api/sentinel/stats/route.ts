import { prisma } from '@/lib/db';
import { sentinelJson, sentinelOptions } from '@/lib/sentinel/http';
import { SENTINEL_REVIEW_TYPES } from '@/lib/sentinel/review-types';

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

export async function GET() {
  try {
    const now = Date.now();
    const h24 = new Date(now - 24 * 60 * 60 * 1000);
    const h1 = new Date(now - 60 * 60 * 1000);

    const [total, unresolved, critical, last24h, lastHour, autoFixed, recentScans, config] = await Promise.all([
      prisma.sentinelError.count().catch(() => 0),
      prisma.sentinelError.count({ where: { resolved: false } }).catch(() => 0),
      prisma.sentinelError.count({ where: { severity: 'critical', resolved: false } }).catch(() => 0),
      prisma.sentinelError.count({ where: { createdAt: { gte: h24 } } }).catch(() => 0),
      prisma.sentinelError.count({ where: { createdAt: { gte: h1 } } }).catch(() => 0),
      prisma.sentinelError.count({ where: { autoFixed: true } }).catch(() => 0),
      prisma.sentinelScan.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }).catch(() => []),
      prisma.sentinelConfig.findUnique({ where: { id: 'singleton' } }).catch(() => null)
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
  } catch (err) {
    return sentinelJson(
      { error: 'stats_unavailable', message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return sentinelOptions();
}
