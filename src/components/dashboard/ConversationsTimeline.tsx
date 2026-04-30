'use client';

interface Conversation {
  id: string;
  leadId: string;
  channel: string;
  isClosed: boolean;
  lastMessageAt?: string;
  lead: { id: string; name: string; phone?: string; company?: string };
  lastMessage: string;
}

const CHANNEL: Record<string, { icon: string; color: string }> = {
  EMAIL:    { icon: '✉', color: '#60CFFF' },
  WHATSAPP: { icon: '●', color: '#00FF41' },
  CALL:     { icon: '◎', color: '#B47FFF' },
  SMS:      { icon: '↗', color: '#FFD060' },
};

export function ConversationsTimeline({ conversations }: { conversations: Conversation[] }) {
  if (conversations.length === 0) {
    return (
      <div style={{ border: '1px solid rgba(0,255,65,.18)', borderRadius: 18, padding: '32px 0', textAlign: 'center', color: '#B0B0B0', background: 'rgba(0,255,65,.03)', fontSize: 13 }}>
        Nenhuma conversa para exibir
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid rgba(0,255,65,.18)', borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.01))' }}>
      {conversations.map((c, i) => {
        const ch = CHANNEL[c.channel] ?? { icon: '·', color: '#B0B0B0' };
        return (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px',
            borderBottom: i < conversations.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
            transition: '.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,65,.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${ch.color}40`, background: `${ch.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ch.color, fontSize: 16, flexShrink: 0 }}>
              {ch.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{c.lead.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 999, color: ch.color, background: `${ch.color}18`, border: `1px solid ${ch.color}40` }}>
                    {c.channel}
                  </span>
                  {c.isClosed && <span style={{ color: '#00FF41', fontSize: 11 }}>✔</span>}
                </div>
              </div>
              {c.lead.company && <p style={{ fontSize: 11, color: '#B0B0B0', margin: '0 0 4px' }}>{c.lead.company}</p>}
              <p style={{ fontSize: 13, color: '#d0d0d0', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.lastMessage || '—'}
              </p>
              {c.lastMessageAt && (
                <p style={{ fontSize: 11, color: '#666', margin: 0 }}>
                  {new Date(c.lastMessageAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
