'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/components/ui/useApi';
import type { LeadStatus } from '@/lib/types';

type ContatosPayload = {
  leads: Array<{
    id: string;
    fullName: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    status: LeadStatus;
    lastContactAt?: string | null;
    nextAction?: string | null;
    nextActionAt?: string | null;
  }>;
};

const emptyContatos: ContatosPayload = { leads: [] };

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('pt-BR');
}

export default function ContatosPage() {
  const router = useRouter();
  const api = useApi<ContatosPayload>('/api/leads', emptyContatos);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'ALL'>('ALL');

  const statuses = useMemo(() => {
    const values = new Set<LeadStatus>();
    api.data.leads.forEach((l) => values.add(l.status));
    return ['ALL', ...Array.from(values)] as Array<'ALL' | LeadStatus>;
  }, [api.data.leads]);

  const filtered = useMemo(
    () => selectedStatus === 'ALL' ? api.data.leads : api.data.leads.filter(l => l.status === selectedStatus),
    [selectedStatus, api.data.leads]
  );

  const statusLabel: Record<string, string> = {
    ALL: 'Todos', NEW: 'Novo', ENGAGED: 'Engajado', QUALIFIED: 'Qualificado',
    PROPOSAL_SENT: 'Proposta', NEGOTIATING: 'Negociando', CLOSED_WON: 'Ganho',
    CLOSED_LOST: 'Perdido', ON_HOLD: 'Em Espera'
  };

  const columns: DataTableColumn[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'email', label: 'Email' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'status', label: 'Status' },
    { key: 'ultimo', label: 'Último contato' }
  ];

  const rows = filtered.map(l => ({
    id: l.id,
    nome: l.fullName || '—',
    empresa: l.company ?? '—',
    email: l.email ?? '—',
    telefone: l.phone ?? '—',
    status: <StatusPill status={l.status} />,
    ultimo: formatDate(l.lastContactAt)
  }));

  async function handleNovoContato() {
    const fullName = window.prompt('Nome do contato:');
    if (!fullName?.trim()) return;
    const email = window.prompt('Email (opcional):') ?? '';

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim() || undefined })
      });
      if (!res.ok) throw new Error('Erro ao criar contato');
      window.location.reload();
    } catch {
      window.alert('Não foi possível criar o contato. Tente novamente.');
    }
  }

  return (
    <PageLayout
      title="Contatos"
      badges={{ leads: api.data.leads.length }}
      actions={
        <button type="button" className="ds-button ds-button-primary" onClick={handleNovoContato}>
          + Novo Contato
        </button>
      }
    >
      {api.error ? <div className="ds-card ds-muted">Erro: {api.error}</div> : null}

      <section className="ds-card">
        <div className="ds-tabs">
          {statuses.map(s => (
            <button
              key={s}
              type="button"
              className={`ds-tab${selectedStatus === s ? ' active' : ''}`}
              onClick={() => setSelectedStatus(s)}
            >
              {statusLabel[s] ?? s}
            </button>
          ))}
        </div>
      </section>

      <section className="ds-card">
        {api.loading ? (
          <div className="ds-grid">
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={34} />)}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            onRowClick={row => {
              if (typeof row.id === 'string') router.push(`/contatos/${row.id}`);
            }}
          />
        )}
      </section>
    </PageLayout>
  );
}
