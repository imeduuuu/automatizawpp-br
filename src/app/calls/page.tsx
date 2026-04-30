'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import type { LeadStatus } from '@/lib/types';

type CallsPayload = {
  calls: Array<{
    id: string;
    status: string;
    durationSec?: number | null;
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
  if (value === 'CONNECTED') return 'QUALIFIED';
  return 'NEW';
}

export default function CallsPage() {
  const copy = useUiCopy();
  const router = useRouter();
  const callsApi = useApi<CallsPayload>('/api/calls', emptyCalls);

  const todayCalls = useMemo(() => {
    const now = new Date();
    return callsApi.data.calls.filter((call) => {
      const date = new Date(call.createdAt);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
    }).length;
  }, [callsApi.data.calls]);

  const columns: DataTableColumn[] = [
    { key: 'lead', label: copy.calls.colLead },
    { key: 'numero', label: copy.calls.colNumber },
    { key: 'resultado', label: copy.calls.colOutcome },
    { key: 'duracion', label: copy.calls.colDuration },
    { key: 'fecha', label: copy.calls.colDate }
  ];

  const rows = callsApi.data.calls.map((call) => ({
    id: call.id,
    lead: leadName(call.lead),
    numero: call.lead?.phone ?? '-',
    resultado: <StatusPill status={callResultAsStatus(call.status)} />,
    duracion: `${call.durationSec ?? 0}s`,
    fecha: new Date(call.createdAt).toLocaleString('pt-BR')
  }));

  async function createCall() {
    const leadId = window.prompt('ID do lead para nova ligação');
    const to = window.prompt('Telefone destino (E.164)');
    if (!leadId || !to) return;

    try {
      const response = await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'auto',
          leadId,
          objective: 'Nova ligação comercial',
          to
        })
      });

      if (!response.ok) {
        throw new Error(copy.calls.errorCreate);
      }

      window.location.reload();
    } catch {
      window.alert(copy.calls.errorCreate);
    }
  }

  return (
    <PageLayout
      title={copy.calls.title}
      badges={{ calls: callsApi.data.calls.length }}
      actions={
        <button type="button" className="ds-button ds-button-primary" onClick={createCall}>
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
    </PageLayout>
  );
}
