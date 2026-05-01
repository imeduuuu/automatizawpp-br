'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import { showToast } from '@/lib/ui-toast';
import type { LeadStatus } from '@/lib/types';

type CallsPayload = {
  calls: Array<{
    id: string;
    status: string;
    durationSec?: number | null;
    summary?: string | null;
    createdAt: string;
    lead: {
      id: string;
      fullName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
    } | null;
  }>;
};

const emptyCalls: CallsPayload = { calls: [] };

function leadName(lead: CallsPayload['calls'][number]['lead']) {
  if (!lead) return 'Lead sem nome';
  if (lead.fullName?.trim()) return lead.fullName;
  return [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Lead sem nome';
}

function callResultAsStatus(value: string): LeadStatus {
  if (value === 'BOOKED') return 'CLOSED_WON';
  if (value === 'NO_ANSWER' || value === 'FOLLOW_UP_REQUIRED') return 'CALL_ATTEMPTED';
  if (value === 'NOT_INTERESTED' || value === 'FAILED') return 'CLOSED_LOST';
  if (value === 'CONNECTED' || value === 'INTERESTED') return 'QUALIFIED';
  return 'NEW';
}

type ModalState = {
  leadId: string;
  phone: string;
  objective: string;
};

export default function CallsPage() {
  const copy = useUiCopy();
  const router = useRouter();
  const callsApi = useApi<CallsPayload>('/api/calls', emptyCalls);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);

  const todayCalls = useMemo(() => {
    const now = new Date();
    return callsApi.data.calls.filter((call) => {
      const date = new Date(call.createdAt);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    }).length;
  }, [callsApi.data.calls]);

  const avgDuration = useMemo(() => {
    const withDuration = callsApi.data.calls.filter((c) => c.durationSec != null && c.durationSec > 0);
    if (withDuration.length === 0) return 0;
    const total = withDuration.reduce((sum, c) => sum + (c.durationSec ?? 0), 0);
    return Math.round(total / withDuration.length);
  }, [callsApi.data.calls]);

  const columns: DataTableColumn[] = [
    { key: 'lead', label: copy.calls.colLead },
    { key: 'numero', label: copy.calls.colNumber },
    { key: 'resultado', label: copy.calls.colOutcome },
    { key: 'duracion', label: copy.calls.colDuration },
    { key: 'resumo', label: copy.calls.colSummary },
    { key: 'fecha', label: copy.calls.colDate }
  ];

  const rows = callsApi.data.calls.map((call) => ({
    id: call.id,
    lead: leadName(call.lead),
    numero: call.lead?.phone ?? '-',
    resultado: <StatusPill status={callResultAsStatus(call.status)} />,
    duracion: `${call.durationSec ?? 0}s`,
    resumo: call.summary ? (call.summary.length > 60 ? call.summary.slice(0, 60) + '...' : call.summary) : '-',
    fecha: new Date(call.createdAt).toLocaleString('pt-BR')
  }));

  function openModal() {
    setModal({ leadId: '', phone: '', objective: 'Ligação comercial' });
  }

  function closeModal() {
    setModal(null);
  }

  async function confirmCall() {
    if (!modal) return;
    if (!modal.leadId.trim() || !modal.phone.trim()) return;
    setSaving(true);
    try {
      const response = await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'auto',
          leadId: modal.leadId.trim(),
          objective: modal.objective.trim() || 'Ligação comercial',
          to: modal.phone.trim()
        })
      });

      if (!response.ok) {
        throw new Error(copy.calls.errorCreate);
      }

      closeModal();
      window.location.reload();
    } catch {
      showToast(copy.calls.errorCreate, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout
      title={copy.calls.title}
      badges={{ calls: callsApi.data.calls.length }}
      actions={
        <button type="button" className="ds-button ds-button-primary" onClick={openModal}>
          {copy.calls.newCall}
        </button>
      }
    >
      {callsApi.error ? <div className="ds-card ds-muted">{copy.common.error}: {callsApi.error}</div> : null}

      <div className="ds-grid ds-grid-4">
        <div className="ds-card">
          <p className="ds-kpi-label">{copy.calls.totalCalls}</p>
          <p className="ds-kpi-value">{callsApi.data.calls.length}</p>
        </div>
        <div className="ds-card">
          <p className="ds-kpi-label">{copy.calls.callsToday}</p>
          <p className="ds-kpi-value">{todayCalls}</p>
        </div>
        <div className="ds-card">
          <p className="ds-kpi-label">{copy.calls.avgDuration}</p>
          <p className="ds-kpi-value">{avgDuration}s</p>
        </div>
      </div>

      <section className="ds-card">
        {callsApi.loading ? (
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
                router.push(`/calls/${row.id}`);
              }
            }}
          />
        )}
      </section>

      {modal !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="ds-card" style={{ width: 400, maxWidth: '90vw', padding: 24, display: 'grid', gap: 16 }}>
            <h2 className="ds-title">{copy.calls.modalTitle}</h2>

            <div style={{ display: 'grid', gap: 8 }}>
              <label className="ds-label">{copy.calls.modalLeadId}</label>
              <input
                className="ds-input"
                type="text"
                value={modal.leadId}
                onChange={(e) => setModal((m) => m && { ...m, leadId: e.target.value })}
                placeholder="cuid..."
              />
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <label className="ds-label">{copy.calls.modalPhone}</label>
              <input
                className="ds-input"
                type="text"
                value={modal.phone}
                onChange={(e) => setModal((m) => m && { ...m, phone: e.target.value })}
                placeholder="+55119..."
              />
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <label className="ds-label">{copy.calls.modalObjective}</label>
              <input
                className="ds-input"
                type="text"
                value={modal.objective}
                onChange={(e) => setModal((m) => m && { ...m, objective: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="ds-button" onClick={closeModal} disabled={saving}>
                {copy.calls.modalCancel}
              </button>
              <button
                type="button"
                className="ds-button ds-button-primary"
                onClick={confirmCall}
                disabled={saving || !modal.leadId.trim() || !modal.phone.trim()}
              >
                {copy.calls.modalConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
