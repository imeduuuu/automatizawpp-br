import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { validatePublicToken } from '@/lib/public-auth';
import { fetchMessage } from '@/lib/email/mailbox';

export async function GET(request: NextRequest) {
  const session  = await auth();
  const temToken = validatePublicToken(request);

  if (!session && !temToken) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // Aceita ?id=<conversationId> (novo) ou ?uid=<conversationId> (retrocompat)
  const id = searchParams.get('id') ?? searchParams.get('uid') ?? '';

  if (!id) {
    return NextResponse.json({ ok: false, erro: 'Parâmetro id obrigatório' }, { status: 400 });
  }

  try {
    const message = await fetchMessage(id);
    if (!message) {
      return NextResponse.json({ ok: false, erro: 'Mensagem não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
