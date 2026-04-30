import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchMessage, type MailFolderKey } from '@/lib/email/mailbox';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const uid = Number(searchParams.get('uid'));
  const folder = (searchParams.get('folder') || 'inbox') as MailFolderKey;

  if (!uid) return NextResponse.json({ ok: false, error: 'uid obrigatório' }, { status: 400 });

  try {
    const message = await fetchMessage(uid, folder);
    if (!message) return NextResponse.json({ ok: false, error: 'Mensagem não encontrada' }, { status: 404 });
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
