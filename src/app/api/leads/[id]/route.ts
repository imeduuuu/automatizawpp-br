import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));

    const lead = await prisma.lead.findFirst({
      where: workspaceId ? { id, workspaceId } : { id },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        company: true,
        phone: true,
        email: true,
        status: true,
        leadScoreValue: true,
        qualificationScore: true,
        assignedTo: true,
        nextAction: true,
        nextActionAt: true,
        lastContactAt: true,
        lastCallAt: true,
        lastEmailAt: true
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const [callAttempts, emailEvents, callRecords] = await Promise.all([
      prisma.callAttempt.findMany({
        where: { leadId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          attemptNumber: true,
          result: true,
          duration: true,
          notes: true,
          createdAt: true
        }
      }),
      prisma.emailEvent.findMany({
        where: { leadId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          emailTemplate: true,
          createdAt: true
        }
      }),
      prisma.callRecord.findMany({
        where: { leadId: id },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          status: true,
          summary: true,
          durationSec: true,
          createdAt: true
        }
      })
    ]);

    const fullName = lead.fullName ?? ([lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Lead sem nome');

    return NextResponse.json({
      lead: {
        ...lead,
        fullName
      },
      callAttempts,
      emailEvents,
      callRecords
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
