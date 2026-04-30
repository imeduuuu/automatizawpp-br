import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const leads = await prisma.lead.findMany({
      where: { createdAt: { gte: startDate } },
      include: { conversations: true },
    });

    const totalLeads = leads.length;
    const respondedLeads = leads.filter(l => l.status !== 'NEW').length;
    const qualifiedLeads = leads.filter(l => l.leadScoreValue && l.leadScoreValue >= 60).length;
    const closedLeads = leads.filter(l => l.status === 'CLOSED_WON').length;

    const responseQuality = (respondedLeads / Math.max(totalLeads, 1)) * 100;
    const nbaAccuracy = (qualifiedLeads / Math.max(respondedLeads, 1)) * 100;
    const complianceScore = 100; // Assume 100 if no violations
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
