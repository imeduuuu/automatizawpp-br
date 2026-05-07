import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RETENTION_POLICIES } from '@/lib/gdpr/retention';

/**
 * GET /api/gdpr/purge — daily cron that applies retention policies.
 *
 * Auth: header `x-cron-secret` must match env CRON_SECRET. (Cron-only endpoint.)
 *
 * Strategy per table:
 *   - hard_delete: deleteMany WHERE createdAt < threshold
 *   - anonymize: scrub PII fields, keep row for analytics
 */

function ageThreshold(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }

  const results: Record<string, { strategy: string; affected: number; ageDays: number }> = {};

  for (const policy of RETENTION_POLICIES) {
    const threshold = ageThreshold(policy.ageDays);

    try {
      let affected = 0;

      if (policy.strategy === 'hard_delete') {
        switch (policy.table) {
          case 'EmailEvent': {
            const r = await prisma.emailEvent.deleteMany({ where: { createdAt: { lt: threshold } } });
            affected = r.count;
            break;
          }
          case 'AuditLog': {
            const r = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: threshold } } });
            affected = r.count;
            break;
          }
          case 'ToolCallLog': {
            const r = await prisma.toolCallLog.deleteMany({ where: { createdAt: { lt: threshold } } });
            affected = r.count;
            break;
          }
          case 'SentinelError': {
            const r = await prisma.sentinelError.deleteMany({
              where: { createdAt: { lt: threshold }, resolved: true },
            });
            affected = r.count;
            break;
          }
        }
      } else if (policy.strategy === 'anonymize') {
        switch (policy.table) {
          case 'Message': {
            const r = await prisma.message.updateMany({
              where: { createdAt: { lt: threshold }, body: { not: '[ERASED]' } },
              data: { body: '[ERASED]' },
            });
            affected = r.count;
            break;
          }
          case 'CallTranscript': {
            const r = await prisma.callTranscript.updateMany({
              where: { createdAt: { lt: threshold }, content: { not: '[ERASED]' } },
              data: { content: '[ERASED]' },
            });
            affected = r.count;
            break;
          }
          case 'LeadMemory': {
            const r = await prisma.leadMemory.deleteMany({ where: { updatedAt: { lt: threshold } } });
            affected = r.count;
            break;
          }
          case 'AgentRun': {
            const r = await prisma.agentRun.deleteMany({ where: { createdAt: { lt: threshold } } });
            affected = r.count;
            break;
          }
        }
      }

      results[policy.table] = {
        strategy: policy.strategy,
        ageDays: policy.ageDays,
        affected,
      };
    } catch (error) {
      results[policy.table] = {
        strategy: policy.strategy,
        ageDays: policy.ageDays,
        affected: -1,
      };
      console.error(`[gdpr-purge] ${policy.table} failed:`, error);
    }
  }

  return NextResponse.json({ ok: true, runAt: new Date().toISOString(), results });
}
