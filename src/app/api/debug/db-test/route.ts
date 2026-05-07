import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Não disponível' }, { status: 404 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@automatizawpp.com' }
    });

    return Response.json({
      success: true,
      message: 'Conexión a BD exitosa',
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHashExists: !!user.passwordHash
      } : null
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
