'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';

type ConversationListPayload = {
  conversations: Array<{
    id: string;
    updatedAt: string;
    lead: {
      fullName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      company?: string | null;
    } | null;
    messages: Array<{
      id: string;
      body: string;
      createdAt: string;
    }>;
  }>;
};

type ConversationDetailPayload = {
  conversation?: {
    id: string;
    lead: {
      fullName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      company?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
    messages: Array<{
      id: string;
      direction: string;
      body: string;
      createdAt: string;
    }>;
  };
};

const emptyList: ConversationListPayload = { conversations: [] };
const emptyDetail: ConversationDetailPayload = {};

function leadName(lead: ConversationListPayload['conversations'][number]['lead']) {
  if (!lead) return 'Lead sem nome';
  if (lead.fullName?.trim()) return lead.fullName;
  const generated = [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim();
  return generated || 'Lead sem nome';
}

function initials(name: string) {
  const chunks = name.split(/\s+/).filter(Boolean).slice(0, 2);
  if (!chunks.length) return 'BF';
  return chunks.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

const DIRECAO: Record<string, string> = { INBOUND: 'Recebida', OUTBOUND: 'Enviada' };

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationsPage() {
  const copy = useUiCopy();
  const listApi = useApi<ConversationListPayload>('/api/conversations', emptyList);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && listApi.data.conversations[0]?.id) {
      setSelectedId(listApi.data.conversations[0].id);
    }
  }, [selectedId, listApi.data.conversations]);

  const detailApi = useApi<ConversationDetailPayload>(selectedId ? `/api/conversations/${selectedId}` : '/api/conversations/invalid', emptyDetail);

  const badges = useMemo(
    () => ({
      conversations: listApi.data.conversations.length
    }),
    [listApi.data.conversations.length]
  );

  return (
    <PageLayout title={copy.conversations.title} badges={badges}>
      {listApi.error ? <div className="ds-card ds-muted">{copy.common.error}: {listApi.error}</div> : null}
      {detailApi.error && selectedId ? <div className="ds-card ds-muted">{copy.common.error}: {detailApi.error}</div> : null}

      <div className="ds-grid" style={{ gridTemplateColumns: '320px 1fr' }}>
        <section className="ds-card">
          <h2 className="ds-title">{copy.conversations.listTitle}</h2>
          <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
            {listApi.loading ? (
              <>
                <Skeleton height={52} />
                <Skeleton height={52} />
                <Skeleton height={52} />
              </>
            ) : listApi.data.conversations.length === 0 ? (
              <p className="ds-muted">{copy.conversations.noConversations}</p>
            ) : (
              listApi.data.conversations.map((conversation) => {
                const name = leadName(conversation.lead);
                const active = selectedId === conversation.id;
                const lastMessage = conversation.messages[0]?.body ?? '-';

                return (
                  <button
                    type="button"
                    key={conversation.id}
                    className="ds-button"
                    onClick={() => setSelectedId(conversation.id)}
                    style={{
                      textAlign: 'left',
                      borderColor: active ? 'var(--green)' : 'var(--border)',
                      background: active ? 'var(--green-light)' : 'var(--surface)',
                      color: 'var(--text)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="ds-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                        {initials(name)}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <strong style={{ fontSize: 13 }}>{name}</strong>
                          <span className="ds-muted" style={{ fontSize: 11 }}>
                            {formatTime(conversation.updatedAt)}
                          </span>
                        </div>
                        <p className="ds-muted" style={{ margin: '2px 0 0', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lastMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="ds-card">
          <h2 className="ds-title">{copy.conversations.detailTitle}</h2>
          {detailApi.loading ? (
            <div className="ds-grid" style={{ marginTop: 10 }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          ) : !detailApi.data.conversation ? (
            <p className="ds-muted" style={{ marginTop: 10 }}>
              {copy.conversations.selectPrompt}
            </p>
          ) : (
            <>
              <div style={{ marginTop: 10, marginBottom: 10 }}>
                <strong>{leadName(detailApi.data.conversation.lead)}</strong>
                <p className="ds-muted" style={{ margin: '2px 0 0' }}>
                  {detailApi.data.conversation.lead?.company ?? '-'} · {detailApi.data.conversation.lead?.email ?? '-'}
                </p>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {detailApi.data.conversation.messages.map((message) => (
                  <div key={message.id} className="ds-card" style={{ padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong>{DIRECAO[message.direction] ?? message.direction}</strong>
                      <span className="ds-muted">{new Date(message.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    <p style={{ margin: '4px 0 0' }}>{message.body}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
