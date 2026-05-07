import { NextResponse } from 'next/server';
import { transitionLead } from '@/lib/lead-state-machine';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await transitionLead(id, { type: 'HUMAN_ESCALATION' });
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
