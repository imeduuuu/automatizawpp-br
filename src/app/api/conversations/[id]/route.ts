import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            company: true,
            email: true,
            phone: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 120,
          select: {
            id: true,
            direction: true,
            body: true,
            createdAt: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
