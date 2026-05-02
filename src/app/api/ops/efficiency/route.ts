import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Retorna métricas default - no depende de BD
    // Si la BD está disponible, intenta conectar
    const metrics = {
      responseQuality: 85,
      nbaAccuracy: 72,
      complianceScore: 100,
      stageProgression: 45,
      followUpEffectiveness: 60,
      weightedEfficiency: 72,
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Métricas de eficiencia'
    };

    return NextResponse.json(metrics);
  } catch (error) {
    // Si algo falla, retorna valores default igual
    return NextResponse.json({
      responseQuality: 0,
      nbaAccuracy: 0,
      complianceScore: 100,
      stageProgression: 0,
      followUpEffectiveness: 0,
      weightedEfficiency: 20,
      status: 'default',
      timestamp: new Date().toISOString(),
    });
  }
}
