import { NextRequest, NextResponse } from 'next/server';
import { seoTracker } from '@/lib/seo/tracker';
import { gscClient } from '@/lib/gsc/client';

/**
 * GET /api/seo/dashboard
 * Retorna dashboard completo de SEO com:
 * - Métricas GSC
 * - Rankings de keywords
 * - Tráfego orgânico
 * - Análise de competidores
 * - Health score
 */
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiToken = process.env.API_TOKEN;

  if (!token || token !== apiToken) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  try {
    // Executar em paralelo para performance
    const [
      gscMetrics,
      indexStatus,
      organicTraffic,
      competitors,
      healthScore,
      backlinks,
    ] = await Promise.all([
      gscClient.fetchMetrics(28),
      gscClient.checkIndexationStatus(),
      seoTracker.fetchOrganicTraffic(30),
      seoTracker.analyzeCompetitors(),
      seoTracker.calculateHealthScore(),
      seoTracker.fetchBacklinks(20),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        googleSearchConsole: {
          metrics: gscMetrics,
          indexation: indexStatus,
        },
        organicTraffic,
        competitors,
        healthScore,
        backlinks,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar dashboard SEO:', error);
    return NextResponse.json(
      {
        error: 'Falha ao gerar dashboard',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
