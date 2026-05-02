import { NextRequest, NextResponse } from 'next/server';
import { gscClient } from '@/lib/gsc/client';

/**
 * POST /api/seo/monitor
 * Cron job para monitorar GSC diariamente
 * Requer CRON_SECRET no header
 */
export async function POST(request: NextRequest) {
  // Validação do secret token (para evitar chamadas não autorizadas)
  const secret = request.headers.get('x-cron-secret') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
  const esperado = process.env.CRON_SECRET;

  if (!esperado || secret !== esperado) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  try {
    // Buscar métricas atuais
    const metrics = await gscClient.fetchMetrics(7); // Últimos 7 dias
    const indexStatus = await gscClient.checkIndexationStatus();

    // Verificar alertas
    const alerts: string[] = [];

    // Alerta 1: Queda em cliques
    if (metrics.totalClicks < 100) {
      alerts.push('Cliques baixos: menos de 100 cliques nos últimos 7 dias');
    }

    // Alerta 2: CTR muito baixo
    if (metrics.averageCTR < 0.02) {
      alerts.push('CTR crítico: abaixo de 2%');
    }

    // Alerta 3: Ranking ruim
    if (metrics.averagePosition > 30) {
      alerts.push('Posição média acima de 30: otimização necessária');
    }

    // Alerta 4: Problemas de indexação
    if (!indexStatus.isHealthy) {
      alerts.push(`Problemas de indexação: ${indexStatus.warnings.join(', ')}`);
    }

    // Em produção, salvar histórico no DB e enviar alertas por email
    const monitoringReport = {
      timestamp: new Date().toISOString(),
      metrics: {
        totalClicks: metrics.totalClicks,
        totalImpressions: metrics.totalImpressions,
        averageCTR: metrics.averageCTR,
        averagePosition: metrics.averagePosition,
      },
      indexation: {
        isHealthy: indexStatus.isHealthy,
        indexedPages: indexStatus.indexedPages,
        errorPages: indexStatus.errorPages,
      },
      alerts,
      topQueries: metrics.topQueries.slice(0, 5).map(q => ({
        query: q.query,
        position: q.position,
        clicks: q.clicks,
      })),
    };

    return NextResponse.json({
      success: true,
      data: monitoringReport,
      alertCount: alerts.length,
    });
  } catch (error: any) {
    console.error('Erro no monitoramento GSC:', error);

    // Registrar erro para investigação posterior
    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao monitorar GSC',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
