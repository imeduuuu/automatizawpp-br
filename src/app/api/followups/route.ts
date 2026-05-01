import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));

    const followUps = await prisma.followUpTask.findMany({
      where: workspaceId ? { lead: { workspaceId } } : undefined,
      orderBy: { scheduledFor: 'asc' },
      take: 150,
      select: {
        id: true,
        status: true,
        channel: true,
        reason: true,
        scheduledFor: true,
        createdAt: true,
        lead: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            assignedTo: true,
            lastContactAt: true
          }
        }
      }
    });

    return NextResponse.json({ followUps });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
