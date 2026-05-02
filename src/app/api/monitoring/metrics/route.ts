/**
 * GET /api/monitoring/metrics
 * Retorna métricas do sistema para o workspace do usuário
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getMetrics } from '@/lib/metrics';
import { logEvent } from '@/lib/logging';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Get workspaceId from session
    const workspaceId = 'workspace-default';

    const metrics = await getMetrics(workspaceId);

    // Log da consulta de métricas
    await logEvent({
      eventType: 'metrics.queried',
      title: 'Métricas do sistema consultadas',
      source: 'API',
      severity: 'INFO',
      context: {
        userId: session.user.id,
        workspaceId
      }
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
