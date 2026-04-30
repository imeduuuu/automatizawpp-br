import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const call = await prisma.callRecord.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            phone: true,
            company: true,
            email: true
          }
        },
        transcripts: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            speaker: true,
            content: true,
            timestampSec: true,
            createdAt: true
          }
        }
      }
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    return NextResponse.json({ call });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
