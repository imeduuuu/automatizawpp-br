'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';

type ConversationListPayload = {
  conversations: Array<{
    id: string;
    leadId: string;
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

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationsPage() {
  const copy = useUiCopy();
  const listApi = useApi<ConversationListPayload>('/api/conversations', emptyList);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resposta, setResposta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId && listApi.data.conversations[0]?.id) {
      setSelectedId(listApi.data.conversations[0].id);
    }
  }, [selectedId, listApi.data.conversations]);

  const [detailKey, setDetailKey] = useState(0);
  const detailUrl = selectedId
    ? `/api/conversations/${selectedId}?_=${detailKey}`
    : '/api/conversations/invalid';
  const detailApi = useApi<ConversationDetailPayload>(detailUrl, emptyDetail);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [detailApi.data.conversation?.messages]);

  const conversaSelecionada = useMemo(
    () => listApi.data.conversations.find((c) => c.id === selectedId) ?? null,
    [listApi.data.conversations, selectedId]
  );

  const handleSelecionar = useCallback((id: string) => {
    setSelectedId(id);
    setResposta('');
    setErroEnvio(null);
    setDetailKey((k) => k + 1);
  }, []);

  const handleEnviar = useCallback(async () => {
    if (!resposta.trim() || !selectedId || !conversaSelecionada) return;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const res = await fetch('/api/events/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'auto',
          leadId: conversaSelecionada.leadId,
          conversationId: selectedId,
          channel: 'EMAIL',
          message: resposta.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Erro ao enviar');
      }
      setResposta('');
      setDetailKey((k) => k + 1);
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setEnviando(false);
    }
  }, [resposta, selectedId, conversaSelecionada]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleEnviar();
      }
    },
    [handleEnviar]
  );

  const badges = useMemo(
    () => ({ conversations: listApi.data.conversations.length }),
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
                    onClick={() => handleSelecionar(conversation.id)}
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

        <section className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
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

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingBottom: 8,
                  maxHeight: 420,
                }}
              >
                {detailApi.data.conversation.messages.map((message) => {
                  const isOutbound = message.direction === 'OUTBOUND';
                  return (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: isOutbound ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '72%',
                          padding: '8px 12px',
                          borderRadius: 10,
                          background: isOutbound ? 'var(--green-light)' : 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: isOutbound ? 'var(--green)' : 'var(--text)',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {message.body}
                        </p>
                        <span
                          className="ds-muted"
                          style={{ fontSize: 11, display: 'block', marginTop: 4, textAlign: isOutbound ? 'right' : 'left' }}
                        >
                          {new Date(message.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {erroEnvio ? (
                  <p className="ds-muted" style={{ marginBottom: 8, color: 'var(--red, #e53e3e)', fontSize: 13 }}>
                    {erroEnvio}
                  </p>
                ) : null}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <textarea
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escrever resposta..."
                    rows={3}
                    disabled={enviando}
                    style={{
                      flex: 1,
                      resize: 'vertical',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    type="button"
                    className="ds-button"
                    onClick={handleEnviar}
                    disabled={enviando || !resposta.trim()}
                    style={{
                      minWidth: 90,
                      height: 40,
                      background: 'var(--green)',
                      color: '#fff',
                      borderColor: 'var(--green)',
                      fontWeight: 600,
                      fontSize: 14,
                      opacity: enviando || !resposta.trim() ? 0.6 : 1,
                    }}
                  >
                    {enviando ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
                <p className="ds-muted" style={{ marginTop: 4, fontSize: 11 }}>
                  Ctrl+Enter para enviar
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
