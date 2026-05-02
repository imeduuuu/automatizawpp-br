import { prisma } from '@/lib/db';

export async function GET() {
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
      error: (error as Error).message,
      databaseUrl: process.env.DATABASE_URL ? '✓ Configurada' : '✗ NO CONFIGURADA'
    }, { status: 500 });
  }
}
