export type MailFolderKey = 'inbox' | 'sent' | 'important' | 'spam' | 'archive';

export type MailMessage = {
  uid: number;
  id: string;
  folder: MailFolderKey;
  subject: string;
  from: string;
  fromEmail: string | null;
  to: string;
  date: string | null;
  preview: string;
  html: string | null;
  text: string | null;
  read: boolean;
};

const ZOHO_API  = 'https://mail.zoho.eu/api';
const ZOHO_AUTH = 'https://accounts.zoho.eu/oauth/v2';

// Mapeamento de chave interna para nome de pasta no Zoho EU
const PASTA_ZOHO: Record<MailFolderKey, string> = {
  inbox:     'Inbox',
  sent:      'Sent',
  important: 'Starred',
  spam:      'Spam',
  archive:   'Archive',
};

let tokenCache: { value: string; exp: number } | null = null;

function accountId(): string {
  return process.env.ZOHO_ACCOUNT_ID ?? '8510223000000002002';
}

async function fetchToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    client_id:     process.env.ZOHO_CLIENT_ID ?? '',
    client_secret: process.env.ZOHO_CLIENT_SECRET ?? '',
    refresh_token: process.env.ZOHO_REFRESH_TOKEN ?? '',
  });
  const res  = await fetch(`${ZOHO_AUTH}/token`, { method: 'POST', body });
  const json = await res.json() as Record<string, unknown>;
  if (!json.access_token) throw new Error(`Zoho auth: ${JSON.stringify(json)}`);
  return json.access_token as string;
}

async function getToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && now < tokenCache.exp) return tokenCache.value;
  const value = await fetchToken();
  tokenCache = { value, exp: now + 55 * 60_000 };
  return value;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
}

interface ZohoMsg {
  messageId: string;
  subject?:  string;
  sender?:   string;
  fromAddress?: string;
  toAddress?:   string;
  receivedTime?: string;
  sentDateInGMT?: string;
  summary?:  string;
  status?:   string;  // '0' = unread, '1' = read
  folderId?: string;
}

export async function fetchMessages(folder: MailFolderKey = 'inbox', limit = 30): Promise<MailMessage[]> {
  try {
    const token      = await getToken();
    const folderName = PASTA_ZOHO[folder];
    // Usa a URL com folderName para filtrar pela pasta correta no Zoho EU
    const url = `${ZOHO_API}/accounts/${accountId()}/folders/${folderName}/messages/view?start=0&limit=${Math.min(limit, 100)}`;

    const res  = await fetch(url, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    const json = await res.json() as { data?: ZohoMsg[]; status?: { code: number } };
    if (!Array.isArray(json.data)) return [];

    return json.data.map((m) => {
      const ts = m.receivedTime ?? m.sentDateInGMT;
      return {
        uid:       Number(m.messageId),
        id:        m.messageId,
        folder,
        subject:   decodeHtml(m.subject ?? '(Sem assunto)'),
        from:      decodeHtml(m.sender || m.fromAddress || ''),
        fromEmail: m.fromAddress || null,
        to:        decodeHtml(m.toAddress ?? ''),
        date:      ts ? new Date(Number(ts)).toISOString() : null,
        preview:   decodeHtml((m.summary ?? '').slice(0, 120)),
        html:      null,
        text:      m.summary ? decodeHtml(m.summary) : null,
        read:      m.status === '1',
      };
    });
  } catch {
    return [];
  }
}

export async function fetchMessage(uid: number, folder: MailFolderKey = 'inbox'): Promise<MailMessage | null> {
  try {
    const token      = await getToken();
    // Usa o nome da pasta diretamente — evita buscar 200 mensagens só para obter o folderId
    const folderName = PASTA_ZOHO[folder];

    const res  = await fetch(
      `${ZOHO_API}/accounts/${accountId()}/folders/${folderName}/messages/${uid}/content?includeBlockedImages=1&getBody=true`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } },
    );
    const json = await res.json() as { data?: Record<string, unknown>; status?: { code: number } };
    if (json.status?.code !== 200 || !json.data) return null;

    const d  = json.data;
    const ts = (d.receivedTime ?? d.sentDateInGMT) as string | undefined;

    return {
      uid,
      id:        String(uid),
      folder,
      subject:   decodeHtml((d.subject as string) || '(Sem assunto)'),
      from:      decodeHtml((d.sender as string) || (d.fromAddress as string) || ''),
      fromEmail: (d.fromAddress as string) || null,
      to:        decodeHtml((d.toAddress as string) || ''),
      date:      ts ? new Date(Number(ts)).toISOString() : null,
      preview:   decodeHtml(((d.summary as string) ?? '').slice(0, 120)),
      html:      (d.htmlBody as string) || null,
      text:      (d.content as string) || (d.summary as string) ? decodeHtml((d.content as string) || (d.summary as string)) : null,
      read:      true,
    };
  } catch {
    return null;
  }
}
