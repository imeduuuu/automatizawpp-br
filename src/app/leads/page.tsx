'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
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

export default function LeadsPage() {
  const copy = useUiCopy();
  const router = useRouter();
  const leadsApi = useApi<LeadsPayload>('/api/leads', emptyLeads);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'ALL'>('ALL');

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

  async function handleCreateLead() {
    const fullName = window.prompt(copy.leads.colName);
    if (!fullName) return;

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName })
      });

      if (!response.ok) {
        throw new Error(copy.leads.errorCreate);
      }

      window.location.reload();
    } catch {
      window.alert(copy.leads.errorCreate);
    }
  }

  return (
    <PageLayout
      title={copy.leads.title}
      badges={{ leads: leadsApi.data.leads.length }}
      actions={
        <button type="button" className="ds-button ds-button-primary" onClick={handleCreateLead}>
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
    </PageLayout>
  );
}
