// mailbox.ts — Bird API v2 (canal email-sparkpost inbox@automatizawpp.com)

export type MailFolderKey = 'inbox' | 'sent' | 'important' | 'spam' | 'archive';

export type MailMessage = {
  uid: number;
  id: string;          // Bird conversation ID
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

const BIRD_API    = 'https://api.bird.com';
const WORKSPACE   = () => process.env.BIRD_WORKSPACE_ID ?? '';
const CHANNEL_ID  = () => process.env.BIRD_EMAIL_CHANNEL_ID ?? '';
const API_KEY     = () => process.env.BIRD_API_KEY ?? '';

interface BirdEmailBody {
  subject?: string;
  from?:    { email?: string; name?: string };
  to?:      Array<{ email?: string; name?: string }>;
  text?:    { text?: string };
  html?:    { html?: string };
}

interface BirdMessage {
  id:         string;
  direction?: 'received' | 'sent';
  status?:    string;
  createdAt?: string;
  body?: {
    type:    string;
    text?:   { text: string };
    email?:  BirdEmailBody;
  };
}

interface BirdContact {
  id:           string;
  displayName?: string;
  identifiers?: Array<{ key: string; value: string }>;
}

interface BirdConversation {
  id:           string;
  status?:      string;
  contact?:     BirdContact;
  lastMessage?: BirdMessage;
  createdAt?:   string;
  updatedAt?:   string;
}

function contactEmail(c?: BirdContact): string | null {
  if (!c?.identifiers) return null;
  return (
    c.identifiers.find((i) => i.key === 'emailaddress')?.value ??
    c.identifiers.find((i) => i.key === 'email')?.value ??
    null
  );
}

function parseBody(msg: BirdMessage): {
  subject: string;
  from: string;
  fromEmail: string | null;
  text: string | null;
  html: string | null;
} {
  if (msg.body?.type === 'email' && msg.body.email) {
    const e = msg.body.email;
    const fe = e.from?.email ?? null;
    const fn = e.from?.name;
    return {
      subject:   e.subject ?? '(Sem assunto)',
      from:      fn ? `${fn} <${fe}>` : (fe ?? ''),
      fromEmail: fe,
      text:      e.text?.text ?? null,
      html:      e.html?.html ?? null,
    };
  }
  return {
    subject:   '(Sem assunto)',
    from:      '',
    fromEmail: null,
    text:      msg.body?.text?.text ?? null,
    html:      null,
  };
}

function birdHeaders() {
  return {
    Authorization: `AccessKey ${API_KEY()}`,
    Accept:        'application/json',
  };
}

export async function fetchMessages(folder: MailFolderKey = 'inbox', limit = 30): Promise<MailMessage[]> {
  const key = API_KEY();
  const ws  = WORKSPACE();
  if (!key || !ws) return [];

  try {
    const ch       = CHANNEL_ID();
    const chParam  = ch ? `&channelId=${ch}` : '';
    const url      = `${BIRD_API}/workspaces/${ws}/conversations?pageSize=${Math.min(limit, 100)}${chParam}`;
    const res      = await fetch(url, { headers: birdHeaders() });
    if (!res.ok) return [];

    const json = await res.json() as { results?: BirdConversation[] };
    if (!Array.isArray(json.results)) return [];

    const messages: MailMessage[] = [];

    json.results.forEach((conv, idx) => {
      const last = conv.lastMessage;
      if (!last) return;

      const dir = last.direction;
      if (folder === 'inbox' && dir === 'sent')     return;
      if (folder === 'sent' && dir !== 'sent')      return;

      const { subject, from, fromEmail, text } = parseBody(last);
      const ce = contactEmail(conv.contact);

      messages.push({
        uid:       idx + 1,
        id:        conv.id,
        folder,
        subject,
        from:      from || conv.contact?.displayName || ce || 'Desconhecido',
        fromEmail: fromEmail ?? ce,
        to:        'inbox@automatizawpp.com',
        date:      last.createdAt ?? conv.updatedAt ?? conv.createdAt ?? null,
        preview:   (text ?? '').slice(0, 120),
        html:      null,
        text:      null,
        read:      last.status === 'read' || last.status === 'delivered',
      });
    });

    return messages;
  } catch {
    return [];
  }
}

// Busca mensagem completa (HTML + texto) por Bird conversation ID
export async function fetchMessage(conversationId: string): Promise<MailMessage | null> {
  const key = API_KEY();
  const ws  = WORKSPACE();
  if (!key || !ws) return null;

  try {
    const url = `${BIRD_API}/workspaces/${ws}/conversations/${conversationId}/messages?pageSize=50`;
    const res = await fetch(url, { headers: birdHeaders() });
    if (!res.ok) return null;

    const json = await res.json() as { results?: BirdMessage[] };
    if (!Array.isArray(json.results) || json.results.length === 0) return null;

    // Primeiro mensagem recebida na thread
    const msg = json.results.find((m) => m.direction === 'received') ?? json.results[0];
    const { subject, from, fromEmail, text, html } = parseBody(msg);

    return {
      uid:       0,
      id:        conversationId,
      folder:    'inbox',
      subject,
      from,
      fromEmail,
      to:        'inbox@automatizawpp.com',
      date:      msg.createdAt ?? null,
      preview:   (text ?? '').slice(0, 120),
      html,
      text,
      read:      true,
    };
  } catch {
    return null;
  }
}
