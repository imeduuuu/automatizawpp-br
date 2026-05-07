import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Não disponível' }, { status: 404 });
  }

  try {
    const [user1, user2] = await Promise.all([
      prisma.user.count(),
      prisma.user.count()
    ]);

    const prismaInfo = {
      hasDisconnect: typeof (prisma as unknown as Record<string, unknown>).$disconnect === 'function',
      hasConnect: typeof (prisma as unknown as Record<string, unknown>).$connect === 'function',
      nodeEnv: process.env.NODE_ENV
    };

    return Response.json({
      success: true,
      message: 'PrismaClient singleton funciona corretamente',
      userCounts: { count1: user1, count2: user2 },
      prismaInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const code = (error as Record<string, unknown>)?.code || 'UNKNOWN';

    return Response.json({
      success: false,
      error: errorMsg,
      errorCode: code
    }, { status: 500 });
  }
}
