import { NextRequest, NextResponse } from 'next/server';
import { growthAutomation } from '@/lib/growth/automation';

/**
 * GET /api/growth/analytics
 * Retorna análise ROI e métricas de crescimento
 * Query: ?days=30 (padrão: 30)
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
    const daysStr = request.nextUrl.searchParams.get('days');
    const days = daysStr ? parseInt(daysStr) : 30;

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'days deve estar entre 1 e 365' },
        { status: 400 }
      );
    }

    const roi = await growthAutomation.calculateGrowthROI(days);

    // Calcular métricas derivadas
    const conversionRate = (roi.conversions / roi.newLeads) * 100;
    const costPerConversion = roi.totalInvested / roi.conversions;
    const paybackPeriod = Math.ceil(roi.totalInvested / (roi.revenue / days));

    return NextResponse.json({
      success: true,
      data: {
        roi,
        derivedMetrics: {
          conversionRate: conversionRate.toFixed(2) + '%',
          costPerConversion: costPerConversion.toFixed(2),
          paybackPeriodDays: paybackPeriod,
          profitMargin: ((roi.revenue - roi.totalInvested) / roi.revenue * 100).toFixed(2) + '%',
        },
        period: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao calcular analytics de crescimento:', error);
    return NextResponse.json(
      {
        error: 'Falha ao calcular analytics',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
