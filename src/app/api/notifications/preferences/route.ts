// GET /api/notifications/preferences - Obter preferências
// PUT /api/notifications/preferences - Atualizar preferências

import { NextResponse } from 'next/server';
import { getSession } from '@/auth';
import { getUserPreferences, updateUserPreferences } from '@/lib/notifications/preferences';
import { resolveWorkspaceId } from '@/lib/workspace';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));
    const channel = (searchParams.get('channel') || 'IN_APP') as any;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
    }

    const preferences = await getUserPreferences(workspaceId, session.user.id, channel);

    return NextResponse.json({ preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channel, updates } = await request.json();
    if (!channel) {
      return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
    }

    const preferences = await updateUserPreferences(session.user.id, channel, updates);

    return NextResponse.json({ preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
