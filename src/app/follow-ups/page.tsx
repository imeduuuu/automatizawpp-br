'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import { showToast } from '@/lib/ui-toast';
import type { LeadStatus } from '@/lib/types';

type FollowUpsPayload = {
  followUps: Array<{
    id: string;
    status: string;
    reason: string;
    scheduledFor: string;
    createdAt: string;
    lead: {
      id: string;
      fullName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      assignedTo?: string | null;
      lastContactAt?: string | null;
    } | null;
  }>;
};

const emptyPayload: FollowUpsPayload = { followUps: [] };

function leadName(lead: FollowUpsPayload['followUps'][number]['lead']) {
  if (!lead) return 'Lead sem nome';
  if (lead.fullName?.trim()) return lead.fullName;
  return [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Lead sem nome';
}

function followUpStatusAsLeadStatus(status: string): LeadStatus {
  if (status === 'COMPLETED') return 'CLOSED_WON';
  if (status === 'CANCELLED') return 'COLD';
  if (status === 'SENT') return 'FOLLOW_UP';
  return 'CALL_ATTEMPTED';
}

export default function FollowUpsPage() {
  const copy = useUiCopy();
  const followUpsApi = useApi<FollowUpsPayload>('/api/followups', emptyPayload);
  const [escalated, setEscalated] = useState<Record<string, true>>({});
  const [pendingLead, setPendingLead] = useState<string | null>(null);

  async function handleEscalate(leadId: string) {
    try {
      setPendingLead(leadId);
      const response = await fetch(`/api/leads/${leadId}/escalate`, { method: 'POST' });
      if (!response.ok) throw new Error(copy.followUps.escalateFailed);
      setEscalated((current) => ({ ...current, [leadId]: true }));
    } catch {
      showToast(copy.followUps.escalateFailed, 'error');
    } finally {
      setPendingLead(null);
    }
  }

  const columns: DataTableColumn[] = [
    { key: 'lead', label: copy.followUps.colLead },
    { key: 'status', label: copy.followUps.colStatus },
    { key: 'ultima', label: copy.followUps.colLastAction },
    { key: 'proxima', label: copy.followUps.colNextAction },
    { key: 'accion', label: copy.followUps.colAction }
  ];

  const rows = followUpsApi.data.followUps.map((item) => {
    const leadId = item.lead?.id;
    const isHuman = Boolean(leadId && escalated[leadId]) || item.lead?.assignedTo === 'human';

    return {
      id: item.id,
      lead: leadName(item.lead),
      status: <StatusPill status={followUpStatusAsLeadStatus(item.status)} />,
      ultima: item.lead?.lastContactAt ? new Date(item.lead.lastContactAt).toLocaleString('pt-BR') : '-',
      proxima: new Date(item.scheduledFor).toLocaleString('pt-BR'),
      accion: isHuman ? (
        <span
          style={{
            display: 'inline-flex',
            borderRadius: 5,
            padding: '3px 8px',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            background: 'var(--text)',
            color: 'var(--surface)'
          }}
        >
          {copy.common.human}
        </span>
      ) : leadId ? (
        <button
          type="button"
          className="ds-button ds-button-secondary"
          onClick={() => handleEscalate(leadId)}
          disabled={pendingLead === leadId}
        >
          {pendingLead === leadId ? copy.common.escalating : copy.common.escalate}
        </button>
      ) : (
        '-'
      )
    };
  });

  return (
    <PageLayout title={copy.followUps.title} badges={{ followUps: followUpsApi.data.followUps.length }}>
      {followUpsApi.error ? <div className="ds-card ds-muted">{copy.common.error}: {followUpsApi.error}</div> : null}

      <section className="ds-card">
        {followUpsApi.loading ? (
          <div className="ds-grid">
            <Skeleton height={34} />
            <Skeleton height={34} />
            <Skeleton height={34} />
            <Skeleton height={34} />
          </div>
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </section>
    </PageLayout>
  );
}
