import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePublicToken, createUnauthorizedResponse } from '@/lib/public-auth';

/**
 * GET /api/public/analytics
 * 
 * Retorna resumo de KPIs do dashboard público.
 * Restrições: Apenas métricas de leads com status !== 'NEW' e createdAt >= 30 dias atrás
 */
export async function GET(request: NextRequest) {
  // Validar token
  if (!validatePublicToken(request)) {
    return createUnauthorizedResponse('Invalid or missing token');
  }

  try {
    // Data constraint: 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Total de leads
    const totalLeads = await prisma.lead.count({
      where: {
        status: { not: 'NEW' },
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // 2. Score médio
    const avgScore = await prisma.lead.aggregate({
      where: {
        status: { not: 'NEW' },
        createdAt: { gte: thirtyDaysAgo }
      },
      _avg: { leadScoreValue: true }
    });

    // 3. Emails enviados
    const emailsSent = await prisma.emailEvent.count({
      where: {
        type: 'SENT',
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // 4. Calls completadas
    const callsCompleted = await prisma.callRecord.count({
      where: {
        status: { in: ['CONNECTED', 'INTERESTED', 'BOOKED'] },
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // 5. Leads WON
    const wonLeads = await prisma.lead.count({
      where: {
        status: { in: ['CLOSED_WON', 'WON', 'BOOKED'] },
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Calcular conversion rate
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    const stats = {
      totalLeads,
      emailsSent,
      callsCompleted,
      averageScore: Math.round((avgScore._avg.leadScoreValue || 0) * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      responseTime: 2.5
    };

    return NextResponse.json({ stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[public/analytics] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
