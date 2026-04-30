import { NextResponse } from 'next/server';
import { getLeadById } from '@/lib/repositories/leads';
import { getNextBestAction } from '@/lib/decision/next-best-action';
import { resolveWorkspaceId } from '@/lib/workspace';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));
    const lead = await getLeadById(id, workspaceId ?? undefined);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const recommendation = getNextBestAction(lead);
    return NextResponse.json({ recommendation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
