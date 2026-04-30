import { NextRequest, NextResponse } from 'next/server';
import { BirdVoiceProvider } from '@/lib/calls/providers/bird-provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const to = (body as { to?: unknown }).to;
    const script = (body as { script?: unknown }).script;

    if (typeof to !== 'string' || !to.trim()) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const bird = new BirdVoiceProvider();
    const result = await bird.createOutboundCall({
      to,
      script: typeof script === 'string' && script.trim()
        ? script
        : 'Olá, esta é uma chamada de teste do AutomatizaWPP',
      leadId: 'test-lead'
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
