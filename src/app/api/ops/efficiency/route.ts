import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const leads = await Promise.race([
      prisma.lead.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          status: true,
          leadScoreValue: true,
        }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]) as any[];

    const totalLeads = leads?.length || 0;
    const respondedLeads = leads?.filter(l => l.status !== 'NEW').length || 0;
    const qualifiedLeads = leads?.filter(l => l.leadScoreValue && l.leadScoreValue >= 60).length || 0;
    const closedLeads = leads?.filter(l => l.status === 'CLOSED_WON').length || 0;

    const responseQuality = (respondedLeads / Math.max(totalLeads, 1)) * 100;
    const nbaAccuracy = (qualifiedLeads / Math.max(respondedLeads, 1)) * 100;
    const complianceScore = 100;
    const stageProgression = (closedLeads / Math.max(totalLeads, 1)) * 100;
    const followUpEffectiveness = (closedLeads / Math.max(qualifiedLeads, 1)) * 100;

    const weightedEfficiency =
      0.3 * responseQuality +
      0.2 * nbaAccuracy +
      0.2 * complianceScore +
      0.15 * stageProgression +
      0.15 * followUpEffectiveness;

    return NextResponse.json({
      responseQuality: Math.round(responseQuality * 10) / 10,
      nbaAccuracy: Math.round(nbaAccuracy * 10) / 10,
      complianceScore,
      stageProgression: Math.round(stageProgression * 10) / 10,
      followUpEffectiveness: Math.round(followUpEffectiveness * 10) / 10,
      weightedEfficiency: Math.round(weightedEfficiency * 10) / 10,
      status: 'success',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Efficiency API error:', error);
    return NextResponse.json(
      {
        responseQuality: 0,
        nbaAccuracy: 0,
        complianceScore: 100,
        stageProgression: 0,
        followUpEffectiveness: 0,
        weightedEfficiency: 20,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
