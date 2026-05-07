import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { activateScaleBundleForEmail, activateScaleBundleForUser } from '@/lib/services/catalog';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    plan?: string;
    source?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    sessionId?: string;
  };
  const internalSecret = process.env.AUTOMATIZAWPP_INTERNAL_WEBHOOK_SECRET?.trim();
  const suppliedSecret = request.headers.get('x-automatizawpp-internal-secret')?.trim();

  if (internalSecret && suppliedSecret === internalSecret) {
    const plan = (body.plan || '').trim().toLowerCase();
    if (plan !== 'scale') {
      return NextResponse.json({ ok: true, skipped: true, reason: 'plan_not_scale' });
    }

    if (!body.email?.trim()) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    try {
      const result = await activateScaleBundleForEmail(body.email);
      return NextResponse.json({
        ok: true,
        activated: result,
        source: body.source || 'internal-webhook',
        stripeCustomerId: body.stripeCustomerId || null,
        stripeSubscriptionId: body.stripeSubscriptionId || null,
        sessionId: body.sessionId || null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const result = await activateScaleBundleForUser(session.user.id);
    return NextResponse.json({ ok: true, activated: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
