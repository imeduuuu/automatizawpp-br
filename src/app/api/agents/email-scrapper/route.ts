import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireScaleBundleService, ScaleBundleError } from '@/lib/scale-bundle/access';
import { getEmailScrapperStats, runEmailScrapper } from '@/lib/scale-bundle/service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const access = await requireScaleBundleService({
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      serviceSlug: 'email-scrapper'
    });

    return NextResponse.json({ success: true, ...(await getEmailScrapperStats(access)) });
  } catch (error) {
    if (error instanceof ScaleBundleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { domain?: string; maxResults?: number };
    const domain = body.domain?.trim();
    if (!domain) {
      return NextResponse.json({ error: 'Domain required' }, { status: 400 });
    }

    const access = await requireScaleBundleService({
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      serviceSlug: 'email-scrapper'
    });

    return NextResponse.json({ success: true, ...(await runEmailScrapper(access, { domain, maxResults: body.maxResults })) });
  } catch (error) {
    if (error instanceof ScaleBundleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
