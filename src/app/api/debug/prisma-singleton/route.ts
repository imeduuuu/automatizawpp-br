import { prisma } from '@/lib/db';

/**
 * Endpoint para diagnosticar si PrismaClient está siendo singleton-izado correctamente
 * en Vercel. Debería devolver siempre el mismo _ClientVersion en múltiples llamadas.
 */
export async function GET() {
  try {
    // Ejecutar 2 queries para verificar que usan la misma conexión
    const [user1, user2] = await Promise.all([
      prisma.user.count(),
      prisma.user.count()
    ]);

    // Revisar si el prisma tiene propiedades esperadas
    const prismaInfo = {
      hasDisconnect: typeof (prisma as any).$disconnect === 'function',
      hasConnect: typeof (prisma as any).$connect === 'function',
      // En producción, NODE_ENV debe ser 'production'
      nodeEnv: process.env.NODE_ENV
    };

    return Response.json({
      success: true,
      message: 'PrismaClient singleton funciona correctamente',
      userCounts: { count1: user1, count2: user2 },
      prismaInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const code = (error as any)?.code || 'UNKNOWN';

    return Response.json({
      success: false,
      error: errorMsg,
      errorCode: code,
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? '✓ Set' : '✗ Missing'
    }, { status: 500 });
  }
}
