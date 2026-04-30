'use client';

import Link from 'next/link';
import { PageLayout } from '@/components/ui/PageLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';

type ServiceItem = {
  id: string;
  status: string;
  assignedAt: string;
  startsAt: string | null;
  endsAt: string | null;
  notes: string | null;
  service: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string | null;
    longDescription: string | null;
    publicCategory: string | null;
    icon: string | null;
  };
};

type ServicesPayload = { services: ServiceItem[]; total: number };
const empty: ServicesPayload = { services: [], total: 0 };

export default function ServicesIndexPage() {
  const copy = useUiCopy();
  const api = useApi<ServicesPayload>('/api/services', empty);

  return (
    <PageLayout title={copy.services.title}>
      {api.error && <div className="ds-card ds-muted">{copy.common.error}: {api.error}</div>}

      {api.loading ? (
        <section className="ds-grid ds-grid-3">
          <Skeleton height={110} />
          <Skeleton height={110} />
          <Skeleton height={110} />
        </section>
      ) : api.data.services.length === 0 ? (
        <section className="ds-card">
          <p className="ds-muted">{copy.services.noServices}</p>
        </section>
      ) : (
        <section className="ds-grid ds-grid-3">
          {api.data.services.map((item) => (
            <article key={item.id} className="ds-card">
              {item.service.icon && (
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.service.icon}</div>
              )}
              <h2 className="ds-title">{item.service.name}</h2>
              {item.service.shortDescription && (
                <p className="ds-subtitle">{item.service.shortDescription}</p>
              )}
              {item.service.publicCategory && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: 'var(--green)',
                    display: 'block',
                    marginTop: 4
                  }}
                >
                  {item.service.publicCategory}
                </span>
              )}
              <Link
                href={`/services/${item.service.slug}`}
                className="ds-button ds-button-secondary"
                style={{ marginTop: 12, display: 'inline-flex' }}
              >
                {copy.services.open}
              </Link>
            </article>
          ))}
        </section>
      )}
    </PageLayout>
  );
}
