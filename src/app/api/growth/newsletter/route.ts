import { NextRequest, NextResponse } from 'next/server';
import { growthAutomation } from '@/lib/growth/automation';

/**
 * POST /api/growth/newsletter
 * Registra novo subscriber de newsletter
 * Body: { email, name?, source? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, source } = body;

    // Validar email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Registrar subscriber
    const subscriber = await growthAutomation.addNewsletterSubscriber(
      email,
      name,
      source || 'website'
    );

    return NextResponse.json({
      success: true,
      data: subscriber,
      message: 'Inscrição realizada com sucesso!',
    });
  } catch (error: any) {
    console.error('Erro ao registrar subscriber:', error);
    return NextResponse.json(
      {
        error: 'Falha ao processar inscrição',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/growth/newsletter
 * Retorna estatísticas de newsletter
 */
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiToken = process.env.API_TOKEN;

  if (!token || token !== apiToken) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  try {
    // Em produção, buscar do DB
    return NextResponse.json({
      success: true,
      data: {
        totalSubscribers: 1250,
        activeSubscribers: 1180,
        unsubscribed: 70,
        bounced: 15,
        engagementRate: 0.42,
        openRate: 0.32,
        clickRate: 0.08,
        lastCampaignDate: '2026-04-29',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Falha ao buscar estatísticas',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
