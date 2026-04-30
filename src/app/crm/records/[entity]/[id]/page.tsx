'use client';

import { useParams } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import type { LeadStatus } from '@/lib/types';

type LeadPayload = {
  lead?: {
    id: string;
    fullName: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    status: LeadStatus;
    leadScoreValue: number;
  };
};

const emptyPayload: LeadPayload = {};

export default function CrmRecordDetailPage() {
  const copy = useUiCopy();
  const params = useParams<{ entity: string; id: string }>();
  const entity = params?.entity;
  const id = params?.id;

  const leadApi = useApi<LeadPayload>(id ? `/api/leads/${id}` : '/api/leads/invalid', emptyPayload);

  return (
    <PageLayout title={copy.crm.title}>
      {leadApi.error ? <div className="ds-card ds-muted">{copy.common.error}: {leadApi.error}</div> : null}

      <section className="ds-card">
        <h2 className="ds-title">{copy.crm.detailRecord} {entity}</h2>
        {leadApi.loading ? (
          <div className="ds-grid" style={{ marginTop: 10 }}>
            <Skeleton height={18} />
            <Skeleton height={18} />
            <Skeleton height={18} />
          </div>
        ) : leadApi.data.lead ? (
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <p>
              <strong>{copy.crm.colName}:</strong> {leadApi.data.lead.fullName}
            </p>
            <p>
              <strong>{copy.crm.colCompany}:</strong> {leadApi.data.lead.company ?? '-'}
            </p>
            <p>
              <strong>{copy.crm.colEmail}:</strong> {leadApi.data.lead.email ?? '-'}
            </p>
            <p>
              <strong>{copy.crm.colPhone}:</strong> {leadApi.data.lead.phone ?? '-'}
            </p>
            <div>
              <StatusPill status={leadApi.data.lead.status} />
            </div>
          </div>
        ) : (
          <p className="ds-muted" style={{ marginTop: 10 }}>
            {copy.crm.notFound}
          </p>
        )}
      </section>
    </PageLayout>
  );
}
