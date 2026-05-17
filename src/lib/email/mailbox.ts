// mailbox.ts — Lee emails de BD local (channel=EMAIL en tabla Message)
// Bird/SparkPost sigue siendo el receiver via webhooks → guardan en BD.
import { prisma } from '@/lib/db';


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


// Lee de la BD local (tabla Message con channel=EMAIL). Los emails se reciben vía
// webhook de Bird/SparkPost (src/app/api/webhooks/email-received) y se guardan aquí.
// Gestión de carpetas via metadata jsonb: deleted, read, folder (spam|important|archive).
export async function fetchMessages(folder: MailFolderKey = 'inbox', limit = 30): Promise<MailMessage[]> {
  try {
    // Filtro SQL minimal — el resto (deleted, folder override) se filtra en JS
    // porque jsonb NOT/path con NULL no se comporta como queremos.
    const direction = folder === 'sent' ? 'OUTBOUND' as const : folder === 'inbox' ? 'INBOUND' as const : undefined;
    const rows = await prisma.message.findMany({
      where: { channel: 'EMAIL', ...(direction ? { direction } : {}) },
      include: { lead: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit * 2, 200) // overhead por filtrado post-query
    });

    // Filtrado en JS por metadata.deleted y metadata.folder
    const filtered = rows.filter((m) => {
      const meta = (m.metadata && typeof m.metadata === 'object' ? m.metadata : {}) as Record<string, unknown>;
      const isDeleted = meta.deleted === true;
      const metaFolder = typeof meta.folder === 'string' ? meta.folder : null;

      if (isDeleted) return false;

      if (folder === 'spam' || folder === 'important' || folder === 'archive') {
        return metaFolder === folder;
      }
      if (folder === 'inbox') {
        return metaFolder !== 'spam' && metaFolder !== 'archive';
      }
      // sent: ya filtrado por direction
      return true;
    }).slice(0, Math.min(limit, 100));

    return filtered.map((m, idx): MailMessage => {
      const meta = (m.metadata && typeof m.metadata === 'object' ? m.metadata : {}) as Record<string, unknown>;
      const subject = (typeof meta.subject === 'string' && meta.subject) || '(Sem assunto)';
      const fromEmail = (typeof meta.fromEmail === 'string' && meta.fromEmail) || m.lead?.email || null;
      const fromName = m.lead?.fullName || (typeof meta.fromName === 'string' ? meta.fromName : '') || fromEmail || 'Desconhecido';
      const html = typeof meta.html === 'string' ? meta.html : null;
      const date = (m.receivedAt || m.sentAt || m.createdAt).toISOString();
      const read = typeof meta.read === 'boolean' ? meta.read : (m.direction === 'OUTBOUND');

      return {
        uid: idx + 1,
        id: m.id,
        folder,
        subject,
        from: fromEmail ? `${fromName} <${fromEmail}>` : fromName,
        fromEmail,
        to: typeof meta.toEmail === 'string' ? meta.toEmail : 'inbox@automatizawpp.com',
        date,
        preview: m.body.replace(/<[^>]*>/g, '').trim().slice(0, 120),
        html,
        text: m.body,
        read
      };
    });
  } catch (e) {
    console.error('[mailbox] Error leyendo emails de BD:', e);
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
