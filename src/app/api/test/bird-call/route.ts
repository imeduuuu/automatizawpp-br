import { NextRequest, NextResponse } from 'next/server';
import { BirdVoiceProvider } from '@/lib/calls/providers/bird-provider';

export async function POST(request: NextRequest) {
  const { to, script } = await request.json();

  if (!to) {
    return NextResponse.json({ error: 'Missing "to" parameter' }, { status: 400 });
  }

  const bird = new BirdVoiceProvider();
  const result = await bird.createOutboundCall({
    to,
    script: script || 'Olá, esta é uma chamada de teste do AutomatizaWPP',
    leadId: 'test-lead'
  });

  return NextResponse.json(result);
}
