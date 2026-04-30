'use client';

import { useEffect, useState } from 'react';
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
  { key: 'spam', label: 'Spam' },
];

export default function EmailsPage() {
  const copy = useUiCopy();
  const [folder, setFolder] = useState<Folder>('inbox');
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selected, setSelected] = useState<MailMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
    setLoading(true);
    setError(null);
    fetch(`/api/emails?folder=${folder}&limit=40`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setMessages(data.messages);
        else setError(data.error);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [folder]);

  function openMessage(msg: MailMessage) {
    if (msg.html || msg.text) {
      setSelected(msg);
      return;
    }
    fetch(`/api/emails/message?uid=${msg.uid}&folder=${folder}`)
      .then((r) => r.json())
      .then((data) => { if (data.ok) setSelected(data.message); });
  }

  return (
    <PageLayout title="Emails">
    <div className="flex min-h-0" style={{ height: 'calc(100vh - 120px)', background: 'var(--bg)' }}>
      {/* Pasta lateral */}
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
      </aside>

      {/* Message list */}
      <div className="w-80 shrink-0 border-r border-gray-800 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-sm font-semibold text-gray-200">
            {FOLDERS.find((f) => f.key === folder)?.label}
          </h1>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading && <p className="p-4 text-sm text-gray-500">Carregando...</p>}
          {error && <p className="p-4 text-sm text-red-400">{error}</p>}
          {!loading && !error && messages.length === 0 && (
            <p className="p-4 text-sm text-gray-500">Sem mensagens</p>
          )}
          {messages.map((msg) => (
            <button
              key={msg.uid}
              onClick={() => openMessage(msg)}
              className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                selected?.uid === msg.uid ? 'bg-gray-800' : ''
              }`}
            >
              <p className={`text-sm truncate ${msg.read ? 'text-gray-400' : 'text-white font-semibold'}`}>
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

      {/* Message content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            <p>{copy.common.selectMessage}</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">{selected.subject}</h2>
            <div className="text-xs text-gray-400 mb-4 space-y-1">
              <p><span className="text-gray-600">De:</span> {selected.from} {selected.fromEmail ? `<${selected.fromEmail}>` : ''}</p>
              <p><span className="text-gray-600">Para:</span> {selected.to}</p>
              {selected.date && (
                <p><span className="text-gray-600">Data:</span> {new Date(selected.date).toLocaleString('pt-BR')}</p>
              )}
            </div>
            <div className="border-t border-gray-800 pt-4">
              {selected.html ? (
                <iframe
                  srcDoc={selected.html}
                  className="w-full min-h-96 bg-white rounded-lg"
                  sandbox="allow-same-origin"
                />
              ) : (
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">{selected.text}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </PageLayout>
  );
}
