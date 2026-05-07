import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireScaleBundleService, ScaleBundleError } from '@/lib/scale-bundle/access';
import { getIcebreakerStats, runIcebreaker } from '@/lib/scale-bundle/service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const access = await requireScaleBundleService({
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      serviceSlug: 'icebreaker'
    });

    return NextResponse.json({ success: true, ...(await getIcebreakerStats(access)) });
  } catch (error) {
    if (error instanceof ScaleBundleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      prospect?: { name?: string; email?: string; company?: string };
      channel?: 'email' | 'linkedin';
    };
    const name = body.prospect?.name?.trim();
    const email = body.prospect?.email?.trim();
    if (!name || !email) {
      return NextResponse.json({ error: 'Prospect name and email required' }, { status: 400 });
    }

    const access = await requireScaleBundleService({
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      serviceSlug: 'icebreaker'
    });

    return NextResponse.json({
      success: true,
      ...(await runIcebreaker(access, {
        prospect: { name, email, company: body.prospect?.company?.trim() || undefined },
        channel: body.channel || 'email'
      }))
    });
  } catch (error) {
    if (error instanceof ScaleBundleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
