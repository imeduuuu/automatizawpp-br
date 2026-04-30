'use client';

import { useParams } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';

type Resource = {
  id: string;
  title: string;
  resourceType: string;
  url: string | null;
  content: string | null;
  createdAt: string;
};

type Activity = {
  id: string;
  event: string;
  summary: string | null;
  createdAt: string;
};

type ServiceDetailPayload = {
  service: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string | null;
    longDescription: string | null;
    publicCategory: string | null;
    icon: string | null;
    access: {
      id: string;
      status: string;
      assignedAt: string;
      startsAt: string | null;
      endsAt: string | null;
      notes: string | null;
    };
    resources: Resource[];
    activities: Activity[];
  };
} | null;

const empty: ServiceDetailPayload = null;

export default function ServiceDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const api = useApi<ServiceDetailPayload>(`/api/services/${slug}`, empty);

  const resourceColumns: DataTableColumn[] = [
    { key: 'titulo', label: 'Recurso' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'link', label: 'Ação' }
  ];

  const activityColumns: DataTableColumn[] = [
    { key: 'evento', label: 'Evento' },
    { key: 'resumo', label: 'Detalhe' },
    { key: 'data', label: 'Data' }
  ];

  const resourceRows = (api.data?.service.resources ?? []).map((r) => ({
    id: r.id,
    titulo: r.title,
    tipo: r.resourceType,
    link: r.url ? (
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="ds-button ds-button-secondary" style={{ fontSize: 12, padding: '4px 10px' }}>
        Abrir
      </a>
    ) : (
      <span className="ds-muted">—</span>
    )
  }));

  const activityRows = (api.data?.service.activities ?? []).map((a) => ({
    id: a.id,
    evento: a.event,
    resumo: a.summary ?? '—',
    data: new Date(a.createdAt).toLocaleDateString('pt-BR')
  }));

  const service = api.data?.service;

  return (
    <PageLayout title={service ? service.name : slug}>
      {api.error && <div className="ds-card ds-muted">Erro: {api.error}</div>}

      {api.loading ? (
        <>
          <Skeleton height={88} />
          <Skeleton height={200} />
        </>
      ) : !service ? null : (
        <>
          <section className="ds-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {service.icon && <span style={{ fontSize: 32 }}>{service.icon}</span>}
              <div>
                <h2 className="ds-title">{service.name}</h2>
                {service.shortDescription && <p className="ds-subtitle">{service.shortDescription}</p>}
              </div>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: 'var(--green-light)',
                  color: 'var(--green-dark)'
                }}
              >
                {service.access.status}
              </span>
            </div>
            {service.longDescription && (
              <p className="ds-muted" style={{ marginTop: 10 }}>
                {service.longDescription}
              </p>
            )}
            {service.access.notes && (
              <p className="ds-muted" style={{ marginTop: 6, fontStyle: 'italic' }}>
                {service.access.notes}
              </p>
            )}
            <p className="ds-muted" style={{ marginTop: 8, fontSize: 12 }}>
              Atribuído em {new Date(service.access.assignedAt).toLocaleDateString('pt-BR')}
              {service.access.endsAt && ` · Termina em ${new Date(service.access.endsAt).toLocaleDateString('pt-BR')}`}
            </p>
          </section>

          {resourceRows.length > 0 && (
            <section className="ds-card">
              <h2 className="ds-title">Recursos</h2>
              <DataTable columns={resourceColumns} data={resourceRows} />
            </section>
          )}

          {activityRows.length > 0 && (
            <section className="ds-card">
              <h2 className="ds-title">Histórico</h2>
              <DataTable columns={activityColumns} data={activityRows} />
            </section>
          )}

          {resourceRows.length === 0 && activityRows.length === 0 && (
            <section className="ds-card">
              <p className="ds-muted">Ainda não há recursos ou atividade neste serviço.</p>
            </section>
          )}
        </>
      )}
    </PageLayout>
  );
}
