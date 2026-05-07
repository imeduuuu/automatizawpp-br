// POST /api/notifications/clear-all - Limpar todas as notificações

import { NextResponse } from 'next/server';
import { getSession } from '@/auth';
import { clearAllNotifications } from '@/lib/notifications/service';
import { resolveWorkspaceId } from '@/lib/workspace';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { workspaceId: providedWorkspaceId } = await request.json();
    const workspaceId = await resolveWorkspaceId(providedWorkspaceId);
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
    }

    const count = await clearAllNotifications(workspaceId, session.user.id);

    return NextResponse.json({
      success: true,
      archivedCount: count
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
