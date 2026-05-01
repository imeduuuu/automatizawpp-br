'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import { showToast } from '@/lib/ui-toast';
import type { LeadStatus } from '@/lib/types';

type LeadsPayload = {
  leads: Array<{
    id: string;
    fullName: string;
    company?: string | null;
    phone?: string | null;
    status: LeadStatus;
    lastContactAt?: string | null;
    nextAction?: string | null;
    nextActionAt?: string | null;
  }>;
};

const emptyLeads: LeadsPayload = { leads: [] };

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

type NovoLead = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
};

const novoLeadVazio: NovoLead = { fullName: '', email: '', phone: '', company: '' };

export default function LeadsPage() {
  const copy = useUiCopy();
  const router = useRouter();
  const leadsApi = useApi<LeadsPayload>('/api/leads', emptyLeads);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [novoLead, setNovoLead] = useState<NovoLead>(novoLeadVazio);
  const [criando, setCriando] = useState(false);
  const fullNameRef = useRef<HTMLInputElement>(null);

  const statuses = useMemo(() => {
    const values = new Set<LeadStatus>();
    leadsApi.data.leads.forEach((lead) => values.add(lead.status));
    return ['ALL', ...Array.from(values)] as Array<'ALL' | LeadStatus>;
  }, [leadsApi.data.leads]);

  const filteredLeads = useMemo(() => {
    if (selectedStatus === 'ALL') return leadsApi.data.leads;
    return leadsApi.data.leads.filter((lead) => lead.status === selectedStatus);
  }, [selectedStatus, leadsApi.data.leads]);

  const columns: DataTableColumn[] = [
    { key: 'nombre', label: copy.leads.colName },
    { key: 'empresa', label: copy.leads.colCompany },
    { key: 'telefono', label: copy.leads.colPhone },
    { key: 'status', label: copy.leads.colStatus },
    { key: 'ultima', label: copy.leads.colLastAction },
    { key: 'proxima', label: copy.leads.colNextAction }
  ];

  const rows = filteredLeads.map((lead) => ({
    id: lead.id,
    nombre: lead.fullName,
    empresa: lead.company ?? '-',
    telefono: lead.phone ?? '-',
    status: <StatusPill status={lead.status} />,
    ultima: formatDate(lead.lastContactAt),
    proxima: lead.nextActionAt ? `${lead.nextAction ?? 'Acción'} · ${formatDate(lead.nextActionAt)}` : lead.nextAction ?? '-'
  }));

  function abrirModal() {
    setNovoLead(novoLeadVazio);
    setShowModal(true);
    setTimeout(() => fullNameRef.current?.focus(), 50);
  }

  function fecharModal() {
    setShowModal(false);
    setNovoLead(novoLeadVazio);
  }

  function handleCampo(campo: keyof NovoLead) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setNovoLead((prev) => ({ ...prev, [campo]: e.target.value }));
  }

  async function handleSubmitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!novoLead.fullName.trim()) return;

    const payload: Record<string, string> = { fullName: novoLead.fullName.trim() };
    if (novoLead.email.trim()) payload.email = novoLead.email.trim();
    if (novoLead.phone.trim()) payload.phone = novoLead.phone.trim();
    if (novoLead.company.trim()) payload.company = novoLead.company.trim();

    try {
      setCriando(true);
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(copy.leads.errorCreate);
      }

      fecharModal();
      window.location.reload();
    } catch {
      showToast(copy.leads.errorCreate, 'error');
    } finally {
      setCriando(false);
    }
  }

  return (
    <PageLayout
      title={copy.leads.title}
      badges={{ leads: leadsApi.data.leads.length }}
      actions={
        <button type="button" className="ds-button ds-button-primary" onClick={abrirModal}>
          {copy.leads.newLead}
        </button>
      }
    >
      {leadsApi.error ? <div className="ds-card ds-muted">{copy.common.error}: {leadsApi.error}</div> : null}

      <section className="ds-card">
        <div className="ds-tabs">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              className={`ds-tab${selectedStatus === status ? ' active' : ''}`}
              onClick={() => setSelectedStatus(status)}
            >
              {status === 'ALL' ? copy.leads.tabAll : status.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      </section>

      <section className="ds-card">
        {leadsApi.loading ? (
          <div className="ds-grid">
            <Skeleton height={34} />
            <Skeleton height={34} />
            <Skeleton height={34} />
            <Skeleton height={34} />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            onRowClick={(row) => {
              if (row.id && typeof row.id === 'string') {
                router.push(`/leads/${row.id}`);
              }
            }}
          />
        )}
      </section>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}
        >
          <div
            className="ds-card"
            style={{ width: '100%', maxWidth: 440, padding: 28 }}
          >
            <h2 className="ds-title" style={{ marginBottom: 20 }}>
              {copy.leads.newLead}
            </h2>

            <form onSubmit={handleSubmitLead} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label className="ds-muted" style={{ display: 'block', marginBottom: 4 }}>
                  {copy.leads.colName} *
                </label>
                <input
                  ref={fullNameRef}
                  className="ds-input"
                  type="text"
                  value={novoLead.fullName}
                  onChange={handleCampo('fullName')}
                  required
                  disabled={criando}
                />
              </div>

              <div>
                <label className="ds-muted" style={{ display: 'block', marginBottom: 4 }}>
                  {copy.crm.colEmail}
                </label>
                <input
                  className="ds-input"
                  type="email"
                  value={novoLead.email}
                  onChange={handleCampo('email')}
                  disabled={criando}
                />
              </div>

              <div>
                <label className="ds-muted" style={{ display: 'block', marginBottom: 4 }}>
                  {copy.leads.colPhone}
                </label>
                <input
                  className="ds-input"
                  type="tel"
                  value={novoLead.phone}
                  onChange={handleCampo('phone')}
                  disabled={criando}
                />
              </div>

              <div>
                <label className="ds-muted" style={{ display: 'block', marginBottom: 4 }}>
                  {copy.leads.colCompany}
                </label>
                <input
                  className="ds-input"
                  type="text"
                  value={novoLead.company}
                  onChange={handleCampo('company')}
                  disabled={criando}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button
                  type="button"
                  className="ds-button ds-button-secondary"
                  onClick={fecharModal}
                  disabled={criando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ds-button ds-button-primary"
                  disabled={criando || !novoLead.fullName.trim()}
                >
                  {criando ? 'Criando...' : 'Criar Contato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
