/**
 * POST /api/sequences/scheduler — Processa follow-ups agendados
 *
 * Esse endpoint é chamado por um cron job a cada 15 minutos
 * para processar todos os follow-ups que estão vencidos
 */

import { NextResponse } from 'next/server';
import { processScheduledFollowUps } from '@/lib/sequences/scheduler';

export async function POST(request: Request) {
  // Verifica token de cron (se usado externamente)
  const cronToken = request.headers.get('x-cron-token');
  const expectedToken = process.env.CRON_TOKEN;

  if (expectedToken && cronToken !== expectedToken) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const results = await processScheduledFollowUps();

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('[Scheduler] Erro:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
