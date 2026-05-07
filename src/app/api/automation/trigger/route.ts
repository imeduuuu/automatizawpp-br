/**
 * POST /api/automation/trigger — Dispara regras de automação para um lead
 *
 * Body:
 * {
 *   "leadId": "string",
 *   "triggerEvent": "SCORE_UPDATED" | "EMAIL_OPENED" | "CALL_COMPLETED"
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { triggerAutomation } from '@/lib/scoring/automation-rules';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { leadId, triggerEvent } = body;

    if (!leadId || !triggerEvent) {
      return NextResponse.json(
        { error: 'leadId e triggerEvent são obrigatórios' },
        { status: 400 }
      );
    }

    // Verifica permissão
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead || lead.workspaceId !== session.user.workspaceId) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Dispara automação
    await triggerAutomation({
      leadId,
      workspaceId: session.user.workspaceId,
      triggerEvent
    });

    // Retorna lead atualizado
    const updatedLead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        status: true,
        leadScoreValue: true,
        nextAction: true,
        nextActionAt: true
      }
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('[Automation API] Erro:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
