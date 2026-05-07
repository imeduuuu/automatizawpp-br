import { NextResponse } from 'next/server';
import { AgentName } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

type AgentStats = {
  agent: string;
  totalRuns: number;
  runsToday: number;
  completedRuns: number;
  failedRuns: number;
  runningRuns: number;
  lastRunAt: Date | null;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const today = startOfToday();
    const runs = await prisma.agentRun.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 250,
      select: {
        agent: true,
        status: true,
        createdAt: true
      }
    });

    const statsByAgent = new Map<string, AgentStats>();

    for (const agent of Object.values(AgentName)) {
      statsByAgent.set(agent, {
        agent,
        totalRuns: 0,
        runsToday: 0,
        completedRuns: 0,
        failedRuns: 0,
        runningRuns: 0,
        lastRunAt: null
      });
    }

    for (const run of runs) {
      const current = statsByAgent.get(run.agent) ?? {
        agent: run.agent,
        totalRuns: 0,
        runsToday: 0,
        completedRuns: 0,
        failedRuns: 0,
        runningRuns: 0,
        lastRunAt: null
      };

      current.totalRuns += 1;
      if (run.createdAt >= today) {
        current.runsToday += 1;
      }
      if (run.status === 'COMPLETED') {
        current.completedRuns += 1;
      }
      if (run.status === 'FAILED') {
        current.failedRuns += 1;
      }
      if (run.status === 'RUNNING') {
        current.runningRuns += 1;
      }
      if (!current.lastRunAt || run.createdAt > current.lastRunAt) {
        current.lastRunAt = run.createdAt;
      }

      statsByAgent.set(run.agent, current);
    }

    const agents = Array.from(statsByAgent.values())
      .map((entry) => ({
        agent: entry.agent,
        totalRuns: entry.totalRuns,
        runsToday: entry.runsToday,
        completedRuns: entry.completedRuns,
        failedRuns: entry.failedRuns,
        runningRuns: entry.runningRuns,
        successRate: entry.totalRuns > 0 ? Math.round((entry.completedRuns / entry.totalRuns) * 100) : 0,
        active: entry.runningRuns > 0 || entry.runsToday > 0,
        lastRunAt: entry.lastRunAt?.toISOString() ?? null
      }))
      .sort((a, b) => {
        if (!a.lastRunAt) return 1;
        if (!b.lastRunAt) return -1;
        return new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime();
      });

    return NextResponse.json({ agents, total: agents.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
