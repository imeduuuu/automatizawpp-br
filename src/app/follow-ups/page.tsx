'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import { showToast } from '@/lib/ui-toast';

type FollowUpsPayload = {
  followUps: Array<{
    id: string;
    status: string;
    channel: string;
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

type StatusConfig = { background: string; color: string; label: string };

const STATUS_CONFIG: Record<string, StatusConfig> = {
  QUEUED:    { background: 'var(--ds-neutral, #6b7280)', color: '#fff', label: 'Aguardando' },
  SENT:      { background: 'var(--ds-blue, #3b82f6)',    color: '#fff', label: 'Enviado' },
  COMPLETED: { background: 'var(--ds-green, #22c55e)',   color: '#fff', label: 'Concluído' },
  CANCELLED: { background: 'var(--ds-red, #ef4444)',     color: '#fff', label: 'Cancelado' },
  SKIPPED:   { background: 'var(--ds-yellow, #eab308)',  color: '#000', label: 'Ignorado' },
};

function FollowUpStatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { background: '#9ca3af', color: '#fff', label: status };
  return (
    <span
      style={{
        display: 'inline-flex',
        borderRadius: 5,
        padding: '3px 8px',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        background: cfg.background,
        color: cfg.color
      }}
    >
      {cfg.label}
    </span>
  );
}

function leadName(lead: FollowUpsPayload['followUps'][number]['lead']) {
  if (!lead) return 'Lead sem nome';
  if (lead.fullName?.trim()) return lead.fullName;
  return [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Lead sem nome';
}

export default function FollowUpsPage() {
  const copy = useUiCopy();
  const followUpsApi = useApi<FollowUpsPayload>('/api/followups', emptyPayload);
  const [escalated, setEscalated] = useState<Record<string, true>>({});
  const [pendingLead, setPendingLead] = useState<string | null>(null);
  const [runningNow, setRunningNow] = useState(false);

  async function handleRunNow() {
    try {
      setRunningNow(true);
      const response = await fetch('/api/followups/run', { method: 'POST' });
      if (!response.ok) throw new Error(copy.followUps.runFailed);
      const result = await response.json() as { executed?: number; successful?: number; failed?: number };
      const executed = result.executed ?? 0;
      const successful = result.successful ?? 0;
      const failed = result.failed ?? 0;
      showToast(`${copy.followUps.runSuccess}: ${executed} executados, ${successful} com sucesso, ${failed} com falha`, 'success');
    } catch {
      showToast(copy.followUps.runFailed, 'error');
    } finally {
      setRunningNow(false);
    }
  }

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
    { key: 'canal', label: copy.followUps.colChannel },
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
      status: <FollowUpStatusPill status={item.status} />,
      canal: item.channel ?? '-',
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

  const pendingCount = followUpsApi.data.followUps.filter((f) => f.status === 'QUEUED').length;

  return (
    <PageLayout title={copy.followUps.title} badges={{ followUps: pendingCount }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          className="ds-button ds-button-primary"
          onClick={handleRunNow}
          disabled={runningNow}
        >
          {runningNow ? copy.followUps.running : copy.followUps.runNow}
        </button>
      </div>

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
