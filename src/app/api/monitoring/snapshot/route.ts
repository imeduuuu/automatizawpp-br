/**
 * GET /api/monitoring/snapshot
 * Cron job para criar snapshots diários de métricas
 * Deve ser chamado uma vez por dia (ex: 00:05 UTC)
 * Protegido por CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createMetricsSnapshot } from '@/lib/metrics';
import { logEvent } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    // Validar CRON_SECRET
    const secret = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obter todos os workspaces
    const workspaces = await prisma.workspace.findMany();

    let created = 0;
    let errors = 0;

    for (const workspace of workspaces) {
      try {
        await createMetricsSnapshot(workspace.id);
        created++;
      } catch (error) {
        console.error(`Failed to create snapshot for workspace ${workspace.id}:`, error);
        errors++;
      }
    }

    // Log da execução
    await logEvent({
      eventType: 'cron.metrics_snapshot',
      title: `Snapshots de métricas criados: ${created} workspaces`,
      description: errors > 0 ? `${errors} erros durante execução` : undefined,
      severity: errors > 0 ? 'WARNING' : 'INFO',
      source: 'CRON',
      context: {
        metadata: { created, errors, total: workspaces.length }
      }
    });

    return NextResponse.json({
      success: true,
      created,
      errors,
      total: workspaces.length
    });
  } catch (error) {
    console.error('Error creating metrics snapshots:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create snapshots' },
      { status: 500 }
    );
  }
}
