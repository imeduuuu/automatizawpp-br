import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireScaleBundleService, ScaleBundleError } from '@/lib/scale-bundle/access';
import { getGoogleReviewsStats, runGoogleReviews } from '@/lib/scale-bundle/service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const access = await requireScaleBundleService({
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      serviceSlug: 'google-reviews'
    });

    return NextResponse.json({ success: true, ...(await getGoogleReviewsStats(access)) });
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
    const body = (await request.json()) as { businessId?: string };
    const businessId = body.businessId?.trim();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const access = await requireScaleBundleService({
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      serviceSlug: 'google-reviews'
    });

    return NextResponse.json({ success: true, ...(await runGoogleReviews(access, { businessId })) });
  } catch (error) {
    if (error instanceof ScaleBundleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
