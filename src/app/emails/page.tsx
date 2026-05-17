'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';

type MailMessage = {
  uid: number;
  id: string;
  folder: string;
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

type Folder = 'inbox' | 'sent' | 'important' | 'spam';

const FOLDERS: { key: Folder; label: string }[] = [
  { key: 'inbox', label: 'Recebidos' },
  { key: 'sent', label: 'Enviados' },
  { key: 'important', label: 'Importantes' },
  { key: 'spam', label: 'Spam' }
];

export default function EmailsPage() {
  const copy = useUiCopy();
  const [folder, setFolder] = useState<Folder>('inbox');
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selected, setSelected] = useState<MailMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Modal de respuesta
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [sending, setSending] = useState(false);

  const showToast = (kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  };

  const reload = useCallback(() => {
    setSelected(null);
    setLoading(true);
    setError(null);
    fetch(`/api/emails?folder=${folder}&limit=80`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setMessages(data.messages);
        else setError(data.error);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [folder]);

  useEffect(() => {
    reload();
  }, [reload]);

  function openMessage(msg: MailMessage) {
    setSelected(msg);
    // Marcar como leído si no lo está
    if (!msg.read) {
      fetch(`/api/emails/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      }).then(() => {
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)));
      }).catch(() => {});
    }
  }

  async function markUnread() {
    if (!selected) return;
    const res = await fetch(`/api/emails/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: false })
    });
    if (res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === selected.id ? { ...m, read: false } : m)));
      setSelected({ ...selected, read: false });
      showToast('ok', 'Marcado como não lido');
    } else {
      showToast('err', 'Erro ao marcar');
    }
  }

  async function deleteMessage() {
    if (!selected) return;
    if (!confirm('Eliminar esta mensagem? (move-se para a lixeira interna)')) return;
    const res = await fetch(`/api/emails/${selected.id}`, { method: 'DELETE' });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== selected.id));
      setSelected(null);
      showToast('ok', 'Mensagem eliminada');
    } else {
      showToast('err', 'Erro ao eliminar');
    }
  }

  async function moveToFolder(target: Folder) {
    if (!selected) return;
    const res = await fetch(`/api/emails/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: target })
    });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== selected.id));
      setSelected(null);
      showToast('ok', `Movida para ${target}`);
    } else {
      showToast('err', 'Erro ao mover');
    }
  }

  function openReply() {
    if (!selected) return;
    const subj = selected.subject.toLowerCase().startsWith('re:') ? selected.subject : `Re: ${selected.subject}`;
    setReplySubject(subj);
    setReplyBody(`\n\n---\nEm ${selected.date ? new Date(selected.date).toLocaleString('pt-BR') : ''}, ${selected.from} escreveu:\n${(selected.text || selected.preview || '').replace(/<[^>]*>/g, '')}`);
    setReplyOpen(true);
  }

  async function sendReply() {
    if (!selected || !replyBody.trim()) {
      showToast('err', 'Escreva uma resposta antes de enviar');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/emails/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: selected.id, subject: replySubject, body: replyBody })
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        showToast('ok', 'Resposta enviada com sucesso');
        setReplyOpen(false);
        setReplyBody('');
        if (folder === 'sent') reload();
      } else {
        showToast('err', `Erro: ${j.error || res.statusText}`);
      }
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'Erro');
    } finally {
      setSending(false);
    }
  }

  return (
    <PageLayout title="Emails">
      <div className="flex min-h-0" style={{ height: 'calc(100vh - 120px)', background: 'var(--bg)' }}>
        {/* Pastas */}
        <aside className="w-40 shrink-0 border-r border-gray-800 p-4 flex flex-col gap-1">
          <p className="text-xs text-gray-500 uppercase mb-2 font-semibold">Pastas</p>
          {FOLDERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFolder(f.key)}
              className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                folder === f.key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={reload}
            className="mt-4 text-left text-xs px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-800 border border-gray-800"
          >
            ↻ Atualizar
          </button>
        </aside>

        {/* Lista */}
        <div className="w-80 shrink-0 border-r border-gray-800 flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h1 className="text-sm font-semibold text-gray-200">{FOLDERS.find((f) => f.key === folder)?.label}</h1>
            <span className="text-xs text-gray-500">{messages.length}</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading && <p className="p-4 text-sm text-gray-500">Carregando...</p>}
            {error && <p className="p-4 text-sm text-red-400">{error}</p>}
            {!loading && !error && messages.length === 0 && <p className="p-4 text-sm text-gray-500">Sem mensagens</p>}
            {messages.map((msg) => (
              <button
                key={msg.uid}
                onClick={() => openMessage(msg)}
                className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                  selected?.id === msg.id ? 'bg-gray-800' : ''
                }`}
              >
                <p className={`text-sm truncate ${msg.read ? 'text-gray-400' : 'text-white font-semibold'}`}>
                  {!msg.read && <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-2 align-middle" />}
                  {msg.from || msg.fromEmail || 'Desconhecido'}
                </p>
                <p className="text-xs text-gray-300 truncate">{msg.subject}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{msg.preview}</p>
                {msg.date && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(msg.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conteudo + Toolbar */}
        <div className="flex-1 flex flex-col min-h-0">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-gray-600">
              <p>{copy.common.selectMessage}</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 flex-wrap">
                <button onClick={openReply} className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-500">
                  ↩ Responder
                </button>
                <button onClick={markUnread} className="px-3 py-1.5 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800">
                  ◯ Marcar não lido
                </button>
                <button onClick={() => moveToFolder('important')} className="px-3 py-1.5 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800">
                  ★ Importante
                </button>
                <button onClick={() => moveToFolder('spam')} className="px-3 py-1.5 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800">
                  ⚠ Spam
                </button>
                <button onClick={deleteMessage} className="px-3 py-1.5 text-xs rounded-md border border-red-800 text-red-400 hover:bg-red-900/30">
                  🗑 Eliminar
                </button>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-lg font-semibold text-white mb-2">{selected.subject}</h2>
                <div className="text-xs text-gray-400 mb-4 space-y-1">
                  <p><span className="text-gray-600">De:</span> {selected.from} {selected.fromEmail ? `<${selected.fromEmail}>` : ''}</p>
                  <p><span className="text-gray-600">Para:</span> {selected.to}</p>
                  {selected.date && <p><span className="text-gray-600">Data:</span> {new Date(selected.date).toLocaleString('pt-BR')}</p>}
                </div>
                <div className="border-t border-gray-800 pt-4">
                  {selected.html ? (
                    <iframe srcDoc={selected.html} className="w-full min-h-96 bg-white rounded-lg" sandbox="allow-same-origin" />
                  ) : (
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">{selected.text}</pre>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de respuesta */}
      {replyOpen && selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => !sending && setReplyOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Responder</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Para</label>
                <input type="text" disabled value={selected.fromEmail || ''} className="w-full px-3 py-2 rounded-md bg-gray-800 text-gray-400 text-sm border border-gray-700" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Assunto</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-gray-800 text-white text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Mensagem</label>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 rounded-md bg-gray-800 text-white text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setReplyOpen(false)} disabled={sending} className="px-4 py-2 text-sm rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={sendReply} disabled={sending} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50">
                {sending ? 'Enviando...' : '→ Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg z-50 text-sm ${
          toast.kind === 'ok' ? 'bg-green-900/90 text-green-100 border border-green-700' : 'bg-red-900/90 text-red-100 border border-red-700'
        }`}>
          {toast.text}
        </div>
      )}
    </PageLayout>
  );
}
