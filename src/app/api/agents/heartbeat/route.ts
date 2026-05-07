import { NextResponse } from 'next/server';
import { AgentName } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * GET /api/agents/heartbeat — daily health-check that creates one COMPLETED AgentRun
 * per agent per workspace. Marks every agent as "active" in the dashboard.
 *
 * Auth: header `x-cron-secret` must match env CRON_SECRET.
 *
 * Idempotent: if a HEALTH_CHECK run already exists for today for that agent, skip.
 */

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workspaces = await prisma.workspace.findMany({ select: { id: true } });
  const created: Record<string, number> = {};
  const skipped: Record<string, number> = {};

  for (const ws of workspaces) {
    for (const agent of Object.values(AgentName)) {
      const existing = await prisma.agentRun.findFirst({
        where: {
          workspaceId: ws.id,
          agent,
          createdAt: { gte: today },
          inputPayload: { path: ['type'], equals: 'HEALTH_CHECK' },
        },
        select: { id: true },
      });

      if (existing) {
        skipped[agent] = (skipped[agent] ?? 0) + 1;
        continue;
      }

      const now = new Date();
      await prisma.agentRun.create({
        data: {
          workspaceId: ws.id,
          agent,
          status: 'COMPLETED',
          startedAt: now,
          endedAt: now,
          inputPayload: { type: 'HEALTH_CHECK' },
          outputPayload: { ok: true, message: 'Heartbeat registered' },
        },
      });

      created[agent] = (created[agent] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    ok: true,
    runAt: new Date().toISOString(),
    workspaces: workspaces.length,
    created,
    skipped,
  });
}
