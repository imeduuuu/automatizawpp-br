import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));

    const attempts = await prisma.callAttempt.findMany({
      where: workspaceId ? { lead: { workspaceId } } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    const calls = attempts.map((attempt) => {
      const name = attempt.lead.fullName?.trim() || [attempt.lead.firstName, attempt.lead.lastName].filter(Boolean).join(' ').trim() || 'Lead sem nome';

      return {
        id: attempt.id,
        leadId: attempt.leadId,
        lead: {
          id: attempt.lead.id,
          name,
          fullName: name,
          firstName: attempt.lead.firstName,
          lastName: attempt.lead.lastName,
          phone: attempt.lead.phone
        },
        result: attempt.result,
        status: attempt.result,
        duration: attempt.duration,
        durationSec: attempt.duration,
        notes: attempt.notes,
        createdAt: attempt.createdAt.toISOString()
      };
    });

    return NextResponse.json({ calls, total: calls.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
