import { NextRequest, NextResponse } from 'next/server';
import { normalizeBirdEvent } from '@/lib/channels/bird-normalizer';
import { resolveLead } from '@/lib/orchestration/lead-resolution';
import { runSalesOrchestration } from '@/lib/orchestration/sales-engine';

// APP_WORKSPACE_ID = workspace da app na BD. BIRD_WORKSPACE_ID é o ID externo do Bird API.
const WORKSPACE_ID = process.env.APP_WORKSPACE_ID ?? 'demo_workspace';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const normalized = normalizeBirdEvent(body as Parameters<typeof normalizeBirdEvent>[0], WORKSPACE_ID);

  if (!normalized) {
    return NextResponse.json({ ok: false, reason: 'Unrecognized Bird event shape' }, { status: 200 });
  }

  let lead;
  try {
    lead = await resolveLead({
      workspaceId: normalized.workspaceId,
      lead: normalized.lead
    });
  } catch (error) {
    console.error('[Bird] Lead resolution failed:', error);
    return NextResponse.json({ error: 'Lead resolution failed' }, { status: 500 });
  }

  try {
    const result = await runSalesOrchestration({
      workspaceId: normalized.workspaceId,
      leadId: lead.id,
      channel: normalized.channel,
      message: normalized.message,
      subject: normalized.subject,
      threadRef: normalized.threadRef,
      messageId: normalized.messageId,
      receivedAt: normalized.receivedAt,
      metadata: normalized.metadata
    });

    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      agent: result.agent,
      summary: result.summary,
      delivery: result.delivery
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Bird] Orchestration failed:', errMsg);
    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      agent: 'ORCHESTRATOR',
      summary: 'Lead received — orchestration unavailable',
      delivery: null,
      warning: errMsg
    });
  }
}

// Bird webhook verification (GET)
export async function GET() {
  return NextResponse.json({ ok: true, service: 'AutomatizaWPP Bird Webhook' });
}
