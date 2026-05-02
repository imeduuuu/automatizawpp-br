/**
 * POST /api/scoring/ai-qualify — Qualifica lead com IA
 *
 * Body:
 * {
 *   "leadId": "string"
 * }
 *
 * Retorna:
 * {
 *   "budget": "...",
 *   "timeline": "URGENT|SOON|FUTURE",
 *   "painPoints": [],
 *   "objections": [],
 *   "score": 0-100,
 *   "recommendation": "...",
 *   "followUpMessage": "..."
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { qualifyLeadWithAI } from '@/lib/scoring/ai-qualification';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { leadId } = body;

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

    // Qualifica com IA
    const result = await qualifyLeadWithAI(leadId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Qualify] Erro:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
