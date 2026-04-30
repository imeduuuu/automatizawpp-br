import { NextResponse } from 'next/server';
import { computeEfficiency } from '@/lib/ops/efficiency';
import { resolveWorkspaceId } from '@/lib/workspace';

function buildActions(weighted: number) {
  if (weighted >= 85) {
    return [
      'Keep winning prompt variants and freeze as stable version.',
      'Increase sample size for QA reviews to prevent drift.',
      'Start optimizing close-rate and no-show recovery next.'
    ];
  }

  if (weighted >= 75) {
    return [
      'Tune closer + objection pair for price/value hesitation.',
      'Increase follow-up variation angles to reduce repetition.',
      'Review 20 low-score conversations and patch prompt constraints.'
    ];
  }

  return [
    'Run daily QA labeling on at least 30 outbound messages.',
    'Fix routing misfires by tightening orchestrator trigger conditions.',
    'Prioritize stage progression and follow-up effectiveness in this sprint.'
  ];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
    }

    const week = Number(searchParams.get('week') ?? '1');

    const metrics7d = await computeEfficiency(workspaceId, 7);
    const actions = buildActions(metrics7d.weightedEfficiency);

    return NextResponse.json({
      workspaceId,
      week,
      target: 85,
      metrics7d,
      status: metrics7d.weightedEfficiency >= 85 ? 'on-track' : 'needs-tuning',
      actions,
      checkpoints: [
        'Daily: response quality + compliance incidents',
        'Twice-weekly: orchestrator routing review',
        'Weekly: promote/kill prompt variants and publish changelog'
      ]
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
