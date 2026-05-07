/**
 * GET /api/monitoring/alerts
 * Retorna alertas ativos para o workspace do usuário
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getActiveAlerts } from '@/lib/alerts';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const workspaceId = session.user.workspaceId ?? 'demo_workspace';

    const alerts = await getActiveAlerts(workspaceId);

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
