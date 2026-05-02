import { NextRequest, NextResponse } from 'next/server';

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

    // Lazy-load the growth automation module
    const { growthAutomation } = await import('@/lib/growth/automation');

    // Registrar subscriber
    const subscriber = await growthAutomation.addNewsletterSubscriber(
      email,
      name,
      source || 'website'
    );

    return NextResponse.json({
      success: true,
      subscriberId: subscriber.id,
      email: subscriber.email
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
