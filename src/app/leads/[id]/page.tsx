'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import type { LeadStatus } from '@/lib/types';

type LeadDetailPayload = {
  lead?: {
    id: string;
    fullName: string;
    company?: string | null;
    phone?: string | null;
    email?: string | null;
    status: LeadStatus;
    leadScoreValue: number;
    qualificationScore?: number | null;
    assignedTo?: string | null;
    nextAction?: string | null;
    nextActionAt?: string | null;
  };
  callAttempts?: Array<{
    id: string;
    result: string;
    duration?: number | null;
    notes?: string | null;
    createdAt: string;
  }>;
  emailEvents?: Array<{
    id: string;
    type: string;
    emailTemplate: string;
    createdAt: string;
  }>;
  error?: string;
};

const emptyPayload: LeadDetailPayload = {};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

export default function LeadDetailPage() {
  const copy = useUiCopy();
  const params = useParams<{ id: string }>();
  const leadId = params?.id;
  const [escalating, setEscalating] = useState(false);
  const [colding, setColding] = useState(false);

  const detailApi = useApi<LeadDetailPayload>(leadId ? `/api/leads/${leadId}` : '/api/leads/invalid', emptyPayload);

  const timeline = useMemo(() => {
    const callItems = (detailApi.data.callAttempts ?? []).map((item) => ({
      id: `call-${item.id}`,
      type: 'CALL',
      label: item.result,
      detail: item.notes ?? copy.common.noData,
      createdAt: item.createdAt
    }));

    const emailItems = (detailApi.data.emailEvents ?? []).map((item) => ({
      id: `email-${item.id}`,
      type: 'EMAIL',
      label: item.type,
      detail: item.emailTemplate,
      createdAt: item.createdAt
    }));

    return [...callItems, ...emailItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [detailApi.data.callAttempts, detailApi.data.emailEvents, copy.common.noData]);

  const lead = detailApi.data.lead;

  async function handleEscalate() {
    if (!leadId) return;
    try {
      setEscalating(true);
      const response = await fetch(`/api/leads/${leadId}/escalate`, { method: 'POST' });
      if (!response.ok) throw new Error(copy.leadActions.escalateFailed);
      window.location.reload();
    } catch {
      window.alert(copy.leadActions.escalateFailed);
    } finally {
      setEscalating(false);
    }
  }

  async function handleMarkCold() {
    if (!leadId) return;
    try {
      setColding(true);
      const response = await fetch(`/api/leads/${leadId}/mark-cold`, { method: 'POST' });
      if (!response.ok) throw new Error(copy.leadActions.markColdFailed);
      window.location.reload();
    } catch {
      window.alert(copy.leadActions.markColdFailed);
    } finally {
      setColding(false);
    }
  }

  async function handleCallNow() {
    if (!lead) return;
    if (!lead.phone) {
      window.alert(copy.leadActions.noPhone);
      return;
    }

    try {
      const response = await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'auto',
          leadId: lead.id,
          objective: 'Llamada comercial',
          to: lead.phone
        })
      });

      if (!response.ok) {
        throw new Error(copy.leadActions.callFailed);
      }

      window.alert(copy.leadActions.callQueued);
    } catch {
      window.alert(copy.leadActions.callFailed);
    }
  }

  return (
    <PageLayout title={copy.leadActions.infoTitle} badges={{ leads: 1 }}>
      {detailApi.error ? <div className="ds-card ds-muted">{copy.common.error}: {detailApi.error}</div> : null}

      <div className="ds-grid ds-grid-2">
        <section className="ds-card">
          <h2 className="ds-title">{copy.leadActions.infoTitle}</h2>
          {detailApi.loading || !lead ? (
            <div className="ds-grid" style={{ marginTop: 10 }}>
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
            </div>
          ) : (
            <>
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                <div>
                  <span className="ds-muted">{copy.crm.colName}</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700 }}>{lead.fullName}</p>
                </div>
                <div>
                  <span className="ds-muted">{copy.crm.colCompany}</span>
                  <p style={{ margin: '2px 0 0' }}>{lead.company ?? '-'}</p>
                </div>
                <div>
                  <span className="ds-muted">{copy.crm.colPhone}</span>
                  <p style={{ margin: '2px 0 0' }}>{lead.phone ?? '-'}</p>
                </div>
                <div>
                  <span className="ds-muted">{copy.crm.colEmail}</span>
                  <p style={{ margin: '2px 0 0' }}>{lead.email ?? '-'}</p>
                </div>
                <div>
                  <span className="ds-muted">{copy.common.status}</span>
                  <div style={{ marginTop: 4 }}>
                    <StatusPill status={lead.status} />
                  </div>
                </div>
                <div>
                  <span className="ds-muted">{copy.leadActions.fieldScore}</span>
                  <p style={{ margin: '2px 0 0' }}>{lead.qualificationScore ?? lead.leadScoreValue}</p>
                </div>
                <div>
                  <span className="ds-muted">{copy.leadActions.fieldAssignedTo}</span>
                  <p style={{ margin: '2px 0 0' }}>{lead.assignedTo ?? '-'}</p>
                </div>
              </div>

              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="ds-button ds-button-primary" onClick={handleCallNow}>
                  {copy.leadActions.callNow}
                </button>
                <button type="button" className="ds-button ds-button-secondary" onClick={handleEscalate} disabled={escalating}>
                  {escalating ? copy.leadActions.escalating : copy.leadActions.escalateToHuman}
                </button>
                <button type="button" className="ds-button ds-button-secondary" onClick={handleMarkCold} disabled={colding}>
                  {colding ? copy.leadActions.marking : copy.leadActions.markCold}
                </button>
              </div>
            </>
          )}
        </section>

        <section className="ds-card">
          <h2 className="ds-title">{copy.leadActions.timelineTitle}</h2>
          {detailApi.loading ? (
            <div className="ds-grid" style={{ marginTop: 10 }}>
              <Skeleton height={38} />
              <Skeleton height={38} />
              <Skeleton height={38} />
            </div>
          ) : timeline.length === 0 ? (
            <p className="ds-muted" style={{ marginTop: 10 }}>
              {copy.leadActions.noEvents}
            </p>
          ) : (
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {timeline.map((event) => (
                <div key={event.id} className="ds-card" style={{ padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <strong>{event.type}</strong>
                    <span className="ds-muted">{formatDate(event.createdAt)}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{event.label}</p>
                  <p className="ds-muted" style={{ margin: '2px 0 0' }}>
                    {event.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
