import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sentinelJson, sentinelOptions } from '@/lib/sentinel/http';

const schema = z.object({
  source: z.string().min(1).default('frontend'),
  severity: z.enum(['critical', 'warning', 'info']).default('warning'),
  title: z.string().min(1),
  rawError: z.string().min(1),
  sourceId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return sentinelJson({ error: parsed.error.flatten() }, { status: 400 });
    }

    const recentDuplicate = await prisma.sentinelError.findFirst({
      where: {
        source: parsed.data.source,
        title: parsed.data.title,
        rawError: parsed.data.rawError,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
      }
    });

    if (recentDuplicate) {
      return sentinelJson({ ok: true, duplicate: true, id: recentDuplicate.id });
    }

    const error = await prisma.sentinelError.create({
      data: {
        source: parsed.data.source,
        severity: parsed.data.severity,
        title: parsed.data.title,
        rawError: parsed.data.rawError,
        sourceId: parsed.data.sourceId,
        metadata: parsed.data.metadata ? (parsed.data.metadata as Prisma.InputJsonValue) : undefined,
        fixResult: 'pending'
      }
    });

    return sentinelJson({ ok: true, id: error.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sentinelJson({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return sentinelOptions();
}
