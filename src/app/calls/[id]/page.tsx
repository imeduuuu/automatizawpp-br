'use client';

import { useParams } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import type { LeadStatus } from '@/lib/types';

type CallDetailPayload = {
  call?: {
    id: string;
    status: string;
    durationSec?: number | null;
    summary?: string | null;
    startedAt?: string | null;
    endedAt?: string | null;
    lead: {
      fullName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      company?: string | null;
      email?: string | null;
    } | null;
    transcripts: Array<{
      id: string;
      speaker: string;
      content: string;
      timestampSec?: number | null;
    }>;
  };
};

const emptyCall: CallDetailPayload = {};

function leadName(lead: CallDetailPayload['call'] extends infer C ? C extends { lead: infer L } ? L : never : never) {
  if (!lead) return 'Lead sem nome';
  if (lead.fullName?.trim()) return lead.fullName;
  return [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Lead sem nome';
}

function mapResultToStatus(status: string): LeadStatus {
  if (status === 'BOOKED') return 'CLOSED_WON';
  if (status === 'NO_ANSWER' || status === 'FOLLOW_UP_REQUIRED') return 'CALL_ATTEMPTED';
  if (status === 'NOT_INTERESTED' || status === 'FAILED') return 'CLOSED_LOST';
  if (status === 'CONNECTED') return 'QUALIFIED';
  return 'NEW';
}

export default function CallDetailPage() {
  const copy = useUiCopy();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const detailApi = useApi<CallDetailPayload>(id ? `/api/calls/${id}` : '/api/calls/invalid', emptyCall);

  return (
    <PageLayout title={copy.callDetail.title} badges={{ calls: 1 }}>
      {detailApi.error ? <div className="ds-card ds-muted">{copy.common.error}: {detailApi.error}</div> : null}

      <section className="ds-card">
        {detailApi.loading || !detailApi.data.call ? (
          <div className="ds-grid">
            <Skeleton height={18} />
            <Skeleton height={18} />
            <Skeleton height={18} />
          </div>
        ) : (
          <>
            <h2 className="ds-title">{leadName(detailApi.data.call.lead)}</h2>
            <p className="ds-subtitle">
              {detailApi.data.call.lead?.company ?? '-'} · {detailApi.data.call.lead?.phone ?? '-'} · {detailApi.data.call.lead?.email ?? '-'}
            </p>

            <div className="ds-grid ds-grid-4" style={{ marginTop: 12 }}>
              <div className="ds-card" style={{ padding: 10 }}>
                <p className="ds-kpi-label">{copy.callDetail.outcome}</p>
                <div style={{ marginTop: 6 }}>
                  <StatusPill status={mapResultToStatus(detailApi.data.call.status)} />
                </div>
              </div>
              <div className="ds-card" style={{ padding: 10 }}>
                <p className="ds-kpi-label">{copy.callDetail.duration}</p>
                <p className="ds-kpi-value">{detailApi.data.call.durationSec ?? 0}s</p>
              </div>
              <div className="ds-card" style={{ padding: 10 }}>
                <p className="ds-kpi-label">{copy.callDetail.start}</p>
                <p>{detailApi.data.call.startedAt ? new Date(detailApi.data.call.startedAt).toLocaleString('pt-BR') : '-'}</p>
              </div>
              <div className="ds-card" style={{ padding: 10 }}>
                <p className="ds-kpi-label">{copy.callDetail.end}</p>
                <p>{detailApi.data.call.endedAt ? new Date(detailApi.data.call.endedAt).toLocaleString('pt-BR') : '-'}</p>
              </div>
            </div>

            <div className="ds-card" style={{ marginTop: 12 }}>
              <p className="ds-label">{copy.callDetail.notes}</p>
              <p className="ds-muted">{detailApi.data.call.summary ?? copy.callDetail.noNotes}</p>
            </div>

            <div className="ds-card" style={{ marginTop: 12 }}>
              <p className="ds-label">{copy.callDetail.transcript}</p>
              {detailApi.data.call.transcripts.length === 0 ? (
                <p className="ds-muted">{copy.callDetail.noTranscript}</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {detailApi.data.call.transcripts.map((line) => (
                    <div key={line.id} className="ds-card" style={{ padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong>{line.speaker}</strong>
                        <span className="ds-muted">{line.timestampSec ?? 0}s</span>
                      </div>
                      <p style={{ margin: '4px 0 0' }}>{line.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </PageLayout>
  );
}
