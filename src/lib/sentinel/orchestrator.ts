import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { diagnoseError } from '@/lib/sentinel/diagnoser';
import { executeAutoFix } from '@/lib/sentinel/fixer';
import { scanBrevo } from '@/lib/sentinel/scanner-brevo';
import { scanN8n } from '@/lib/sentinel/scanner-n8n';
import { scanPanelRoutes } from '@/lib/sentinel/scanner-panel';
import { scanStripe } from '@/lib/sentinel/scanner-stripe';
import { scanVapi } from '@/lib/sentinel/scanner-vapi';
import { scanWebhooks } from '@/lib/sentinel/scanner-webhooks';
import { scanInfra } from '@/lib/sentinel/scanner-infra';
import { DetectedError } from '@/lib/sentinel/types';

type Scanner = () => Promise<DetectedError[]>;

const SCANNERS: Record<string, Scanner> = {
  n8n: scanN8n,
  vapi: scanVapi,
  brevo: scanBrevo,
  panel: scanPanelRoutes,
  webhook: scanWebhooks,
  stripe: scanStripe,
  infra: scanInfra
};

function normalizeSources(value: unknown) {
  const withPanel = (items: string[]) => (items.includes('panel') ? items : [...items, 'panel']);
  if (Array.isArray(value)) {
    return withPanel(value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0));
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? withPanel(parsed.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0))
        : Object.keys(SCANNERS);
    } catch {
      return Object.keys(SCANNERS);
    }
  }

  return Object.keys(SCANNERS);
}

async function hasRecentDuplicate(error: DetectedError) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  return prisma.sentinelError.findFirst({
    where: {
      source: error.source,
      createdAt: { gte: since },
      ...(error.sourceId
        ? { sourceId: error.sourceId }
        : {
            title: error.title,
            rawError: error.rawError
          })
    }
  });
}

export async function runFullScan(): Promise<{
  totalErrors: number;
  totalFixed: number;
  scans: { source: string; errors: number; fixed: number; duration: number }[];
}> {
  const config = await prisma.sentinelConfig.findUnique({ where: { id: 'singleton' } });
  if (config && !config.enabled) {
    return { totalErrors: 0, totalFixed: 0, scans: [] };
  }

  const enabledSources = normalizeSources(config?.sources);
  const scans: { source: string; errors: number; fixed: number; duration: number }[] = [];
  let totalErrors = 0;
  let totalFixed = 0;

  for (const [source, scanner] of Object.entries(SCANNERS)) {
    if (!enabledSources.includes(source)) continue;

    const start = Date.now();
    let errorsFound = 0;
    let errorsFixed = 0;
    let scanStatus = 'success';

    try {
      const detected = await scanner();
      errorsFound = detected.length;

      for (const error of detected) {
        const existing = await hasRecentDuplicate(error);
        if (existing) continue;

        const dbError = await prisma.sentinelError.create({
          data: {
            source: error.source,
            severity: error.severity,
            title: error.title,
            rawError: error.rawError,
            sourceId: error.sourceId,
            metadata: error.metadata ? (error.metadata as Prisma.InputJsonValue) : undefined
          }
        });

        const diagnosis = await diagnoseError(error);

        await prisma.sentinelError.update({
          where: { id: dbError.id },
          data: {
            diagnosis: diagnosis.diagnosis,
            fixApplied: diagnosis.suggestedFix,
            fixResult: diagnosis.canAutoFix ? 'pending' : 'manual_needed'
          }
        });

        if (config?.autoFix !== false && diagnosis.canAutoFix && diagnosis.fixAction) {
          const result = await executeAutoFix(diagnosis.fixAction);
          await prisma.sentinelError.update({
            where: { id: dbError.id },
            data: {
              autoFixed: result.success,
              resolved: result.success,
              resolvedAt: result.success ? new Date() : null,
              fixResult: result.success ? 'success' : 'failed',
              fixApplied: `${diagnosis.suggestedFix}\n\nResultado: ${result.message}`
            }
          });

          if (result.success) {
            errorsFixed += 1;
          }
        }
      }
    } catch (error) {
      scanStatus = 'error';
      const message = error instanceof Error ? error.message : String(error);
      await prisma.sentinelError.create({
        data: {
          source,
          severity: 'warning',
          title: `Sentinel: error escaneando ${source}`,
          rawError: message,
          fixResult: 'manual_needed'
        }
      });
    }

    const duration = Date.now() - start;
    await prisma.sentinelScan.create({
      data: {
        source,
        status: scanStatus,
        errorsFound,
        errorsFixed,
        duration
      }
    });

    scans.push({ source, errors: errorsFound, fixed: errorsFixed, duration });
    totalErrors += errorsFound;
    totalFixed += errorsFixed;
  }

  return { totalErrors, totalFixed, scans };
}
