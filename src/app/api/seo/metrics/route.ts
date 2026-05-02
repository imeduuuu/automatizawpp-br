import { NextRequest, NextResponse } from 'next/server';
import { gscClient } from '@/lib/gsc/client';

/**
 * GET /api/seo/metrics
 * Retorna métricas de Google Search Console dos últimos 28 dias
 * Requer header de autenticação
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
    const metrics = await gscClient.fetchMetrics(28);

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        period: {
          days: 28,
          startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar métricas GSC:', error);
    return NextResponse.json(
      {
        error: 'Falha ao buscar métricas',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seo/metrics
 * Força um refresh das métricas
 */
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiToken = process.env.API_TOKEN;

  if (!token || token !== apiToken) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  try {
    const metrics = await gscClient.fetchMetrics(28);
    const indexStatus = await gscClient.checkIndexationStatus();

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        indexation: indexStatus,
        refreshedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Erro ao atualizar métricas:', error);
    return NextResponse.json(
      {
        error: 'Falha ao atualizar métricas',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
