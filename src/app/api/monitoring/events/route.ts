/**
 * GET /api/monitoring/events
 * Query interface para buscar eventos com filtros
 */

import { auth } from '@/auth';
import { NextResponse, NextRequest } from 'next/server';
import { queryEvents } from '@/lib/logging';
import { EventSeverity, EventSource } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Get workspaceId from session
    const workspaceId = 'workspace-default';

    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get('eventType') || undefined;
    const severity = searchParams.get('severity') as EventSeverity | undefined;
    const source = searchParams.get('source') as EventSource | undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const skip = parseInt(searchParams.get('skip') || '0');

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const result = await queryEvents({
      workspaceId,
      eventType,
      severity,
      source,
      limit,
      skip,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error querying events:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query events' },
      { status: 500 }
    );
  }
}
