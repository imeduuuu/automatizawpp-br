import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function resolveWorkspaceId(explicitWorkspaceId?: string | null): Promise<string | null> {
  const normalized = explicitWorkspaceId?.trim();
  if (normalized) {
    return normalized;
  }

  const session = await auth();
  const sessionWorkspaceId = session?.user?.workspaceId?.trim();
  if (sessionWorkspaceId) {
    return sessionWorkspaceId;
  }

  const firstWorkspace = await prisma.workspace.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' }
  });

  return firstWorkspace?.id ?? null;
}
