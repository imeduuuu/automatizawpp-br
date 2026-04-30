import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sentinelJson, sentinelOptions } from '@/lib/sentinel/http';

const schema = z
  .object({
    enabled: z.boolean().optional(),
    autoFix: z.boolean().optional(),
    scanInterval: z.number().int().positive().optional(),
    model: z.string().min(1).optional(),
    sources: z.array(z.string().min(1)).optional()
  })
  .strict();

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return sentinelJson({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { enabled, autoFix, scanInterval, model, sources } = parsed.data;

  const config = await prisma.sentinelConfig.upsert({
    where: { id: 'singleton' },
    update: {
      ...(enabled !== undefined ? { enabled } : {}),
      ...(autoFix !== undefined ? { autoFix } : {}),
      ...(scanInterval !== undefined ? { scanInterval } : {}),
      ...(model !== undefined ? { model } : {}),
      ...(sources !== undefined ? { sources } : {})
    },
    create: {
      id: 'singleton',
      enabled: enabled ?? true,
      autoFix: autoFix ?? true,
      scanInterval: scanInterval ?? 300,
      model: model ?? process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
      sources: sources ?? ['n8n', 'vapi', 'brevo', 'stripe', 'webhook', 'panel']
    }
  });

  return sentinelJson({ config });
}

export async function OPTIONS() {
  return sentinelOptions();
}
