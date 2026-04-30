import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Endpoint de autenticação Zoho OAuth2
const ZOHO_AUTH = 'https://accounts.zoho.eu/oauth/v2';

/**
 * GET /api/emails/health
 *
 * Verifica a conectividade com o Zoho Mail tentando renovar o access_token
 * via refresh_token. Substitui a verificação IMAP anterior.
 */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, erro: 'Não autorizado' }, { status: 401 });

  try {
    const corpo = new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     process.env.ZOHO_CLIENT_ID ?? '',
      client_secret: process.env.ZOHO_CLIENT_SECRET ?? '',
      refresh_token: process.env.ZOHO_REFRESH_TOKEN ?? '',
    });

    const res  = await fetch(`${ZOHO_AUTH}/token`, { method: 'POST', body: corpo });
    const json = await res.json() as Record<string, unknown>;

    if (!json.access_token) throw new Error(JSON.stringify(json));

    return NextResponse.json({ ok: true, status: 'zoho_conectado' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, erro: msg }, { status: 500 });
  }
}
