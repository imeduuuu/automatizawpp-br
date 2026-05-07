import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));

    const records = await prisma.callRecord.findMany({
      where: workspaceId ? { workspaceId } : undefined,
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

    const calls = records.map((record) => {
      const name =
        record.lead.fullName?.trim() ||
        [record.lead.firstName, record.lead.lastName].filter(Boolean).join(' ').trim() ||
        'Lead sem nome';

      return {
        id: record.id,
        leadId: record.leadId,
        lead: {
          id: record.lead.id,
          name,
          fullName: name,
          firstName: record.lead.firstName,
          lastName: record.lead.lastName,
          phone: record.lead.phone
        },
        status: record.status,
        durationSec: record.durationSec,
        summary: record.summary,
        nextAction: record.nextAction,
        direction: record.direction,
        startedAt: record.startedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString()
      };
    });

    return NextResponse.json({ calls, total: calls.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
