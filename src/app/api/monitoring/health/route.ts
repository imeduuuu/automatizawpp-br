/**
 * GET /api/monitoring/health
 * Executa health checks e retorna status de todos os componentes
 */

import { NextResponse } from 'next/server';
import { runAllHealthChecks, getHealthStatus } from '@/lib/health';

export async function GET() {
  try {
    // Executar checks
    await runAllHealthChecks();

    // Obter status
    const healthStatus = await getHealthStatus();

    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error('Error running health checks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run health checks' },
      { status: 500 }
    );
  }
}
