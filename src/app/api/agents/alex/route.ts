import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireScaleBundleService, ScaleBundleError } from '@/lib/scale-bundle/access';
import { chatWithAlexBundle, generateAlexWeeklyReport, monitorAlexBundle } from '@/lib/scale-bundle/service';

async function resolveBundleAccess(userId: string, workspaceId: string) {
  const [alexAccess, emailAccess, reviewsAccess, icebreakerAccess] = await Promise.all([
    requireScaleBundleService({ userId, workspaceId, serviceSlug: 'alex-supervisor' }),
    requireScaleBundleService({ userId, workspaceId, serviceSlug: 'email-scrapper' }),
    requireScaleBundleService({ userId, workspaceId, serviceSlug: 'google-reviews' }),
    requireScaleBundleService({ userId, workspaceId, serviceSlug: 'icebreaker' })
  ]);

  return { alexAccess, emailAccess, reviewsAccess, icebreakerAccess };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const accesses = await resolveBundleAccess(session.user.id, session.user.workspaceId);
    return NextResponse.json({ success: true, ...(await monitorAlexBundle(accesses)) });
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
    const body = (await request.json()) as { action?: string; message?: string };
    const accesses = await resolveBundleAccess(session.user.id, session.user.workspaceId);

    if (body.action === 'chat') {
      if (!body.message?.trim()) {
        return NextResponse.json({ error: 'Message required' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        reply: await chatWithAlexBundle({ ...accesses, message: body.message.trim() })
      });
    }

    if (body.action === 'report') {
      return NextResponse.json({
        success: true,
        report: await generateAlexWeeklyReport({ ...accesses, persist: true })
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof ScaleBundleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
