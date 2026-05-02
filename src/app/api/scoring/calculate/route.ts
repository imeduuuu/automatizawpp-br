/**
 * POST /api/scoring/calculate — Calcula score completo para um lead
 *
 * Body:
 * {
 *   "leadId": "string",
 *   "detailed": true // opcional, retorna breakdown completo
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { scoreLeadComplete, quickScoreLead, getQualificationStatus } from '@/lib/scoring/engine';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { leadId, detailed } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId é obrigatório' }, { status: 400 });
    }

    // Verifica permissão
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead || lead.workspaceId !== session.user.workspaceId) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    let result;
    if (detailed) {
      result = await scoreLeadComplete({
        leadId,
        workspaceId: session.user.workspaceId
      });
    } else {
      const score = await quickScoreLead(leadId);
      result = {
        totalScore: score,
        isQualified: score >= 60,
        status: getQualificationStatus(score)
      };
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
