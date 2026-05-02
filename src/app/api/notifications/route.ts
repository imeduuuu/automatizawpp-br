// GET /api/notifications - Listar notificações do usuário
// POST /api/notifications - Criar notificação

import { NextResponse } from 'next/server';
import { getSession } from '@/auth';
import { getUserNotifications, getUnreadCount } from '@/lib/notifications/service';
import { resolveWorkspaceId } from '@/lib/workspace';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
    }

    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '20', 10) || 20));
    const offset = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(workspaceId, session.user.id, limit, offset),
      getUnreadCount(workspaceId, session.user.id)
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      page,
      limit,
      total: unreadCount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
