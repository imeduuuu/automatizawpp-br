/**
 * GET /api/monitoring/check
 * Cron job para executar health checks e criar alertas
 * Deve ser chamado a cada 5-10 minutos
 * Protegido por CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runAllHealthChecks } from '@/lib/health';
import { checkAndCreateAlerts } from '@/lib/alerts';
import { logEvent } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    // Validar CRON_SECRET
    const secret = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Executar health checks
    const healthResults = await runAllHealthChecks();

    // Obter todos os workspaces e verificar alertas
    const workspaces = await prisma.workspace.findMany();
    for (const workspace of workspaces) {
      await checkAndCreateAlerts(workspace.id);
    }

    const unhealthyCount = healthResults.filter(r => r.status === 'UNHEALTHY').length;

    if (unhealthyCount > 0) {
      await logEvent({
        eventType: 'monitoring.alert',
        title: `${unhealthyCount} componentes com status UNHEALTHY`,
        severity: 'WARNING',
        source: 'SYSTEM',
        context: {
          metadata: {
            unhealthyComponents: healthResults
              .filter(r => r.status === 'UNHEALTHY')
              .map(r => r.component)
          }
        }
      });
    }

    // Log da execução
    await logEvent({
      eventType: 'cron.health_check',
      title: 'Health checks executados',
      severity: 'INFO',
      source: 'CRON',
      context: {
        metadata: {
          healthy: healthResults.filter(r => r.status === 'HEALTHY').length,
          degraded: healthResults.filter(r => r.status === 'DEGRADED').length,
          unhealthy: unhealthyCount,
          components: healthResults.map(r => ({
            component: r.component,
            status: r.status,
            responseTimeMs: r.responseTimeMs
          }))
        }
      }
    });

    return NextResponse.json({
      success: true,
      healthResults,
      checkCount: healthResults.length
    });
  } catch (error) {
    console.error('Error running health checks:', error);

    await logEvent({
      eventType: 'cron.health_check_failed',
      title: 'Erro ao executar health checks',
      severity: 'ERROR',
      source: 'CRON',
      context: {
        metadata: {
          error: error instanceof Error ? error.message : 'Erro interno do servidor'
        }
      }
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run health checks' },
      { status: 500 }
    );
  }
}
