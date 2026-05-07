import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const [user, requests, activeServices] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionStatus: true,
          trialStartedAt: true,
          trialEndsAt: true,
          createdAt: true
        }
      }),
      prisma.subscriptionRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          plan: true,
          contactMethod: true,
          status: true,
          createdAt: true
        }
      }),
      prisma.clientServiceAccess.count({
        where: {
          userId: session.user.id,
          status: 'ACTIVE'
        }
      })
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      billing: {
        subscriptionStatus: user.subscriptionStatus,
        trialStartedAt: user.trialStartedAt?.toISOString() ?? null,
        trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
        accountCreatedAt: user.createdAt.toISOString(),
        activeServices,
        requests: requests.map((request) => ({
          ...request,
          createdAt: request.createdAt.toISOString()
        }))
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
