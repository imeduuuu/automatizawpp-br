import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { validatePublicToken } from '@/lib/public-auth';
import { fetchMessages, type MailFolderKey } from '@/lib/email/mailbox';

export async function GET(request: NextRequest) {
  // Aceita sessão NextAuth OU Bearer token público (padrão do projeto)
  const session = await auth();
  const temToken = validatePublicToken(request);

  if (!session && !temToken) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folder = (searchParams.get('folder') || 'inbox') as MailFolderKey;
  const limit = Math.min(Number(searchParams.get('limit') || 30), 100);

  try {
    const messages = await fetchMessages(folder, limit);
    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
