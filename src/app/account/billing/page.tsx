'use client';

import { PageLayout } from '@/components/ui/PageLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';

type BillingRequest = {
  id: string;
  plan: string;
  contactMethod: string;
  status: string;
  createdAt: string;
};

type BillingPayload = {
  billing: {
    subscriptionStatus: string;
    trialStartedAt: string | null;
    trialEndsAt: string | null;
    accountCreatedAt: string;
    activeServices: number;
    requests: BillingRequest[];
  };
} | null;

const empty: BillingPayload = null;

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Ativo',
  PAST_DUE: 'Pagamento pendente',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado'
};

const STATUS_COLOR: Record<string, string> = {
  TRIAL: 'var(--yellow, #f5a623)',
  ACTIVE: 'var(--green)',
  PAST_DUE: 'var(--red, #e74c3c)',
  CANCELLED: 'var(--muted)',
  EXPIRED: 'var(--muted)'
};

export default function AccountBillingPage() {
  const api = useApi<BillingPayload>('/api/account/billing', empty);
  const billing = api.data?.billing;

  const columns: DataTableColumn[] = [
    { key: 'plan', label: 'Plano' },
    { key: 'canal', label: 'Canal' },
    { key: 'estado', label: 'Status' },
    { key: 'fecha', label: 'Data' }
  ];

  const rows = (billing?.requests ?? []).map((req) => ({
    id: req.id,
    plan: req.plan.charAt(0).toUpperCase() + req.plan.slice(1).toLowerCase(),
    canal: req.contactMethod,
    estado: req.status,
    fecha: new Date(req.createdAt).toLocaleDateString('pt-BR')
  }));

  const status = billing?.subscriptionStatus ?? '';
  const trialEndsAt = billing?.trialEndsAt ? new Date(billing.trialEndsAt) : null;
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : null;

  return (
    <PageLayout title="Billing">
      {api.error && <div className="ds-card ds-muted">Erro ao carregar faturamento: {api.error}</div>}

      {api.loading || !billing ? (
        <>
          <Skeleton height={100} />
          <Skeleton height={200} />
        </>
      ) : (
        <>
          <section className="ds-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 className="ds-title">Assinatura atual</h2>
                <p className="ds-subtitle">
                  {billing.activeServices} serviço{billing.activeServices !== 1 ? 's' : ''} ativo{billing.activeServices !== 1 ? 's' : ''}
                  {trialEndsAt && status === 'TRIAL' && ` · Trial termina em ${trialEndsAt.toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: STATUS_COLOR[status] ?? 'var(--muted)',
                  color: '#fff'
                }}
              >
                {STATUS_LABELS[status] ?? status}
              </span>
            </div>

            {status === 'TRIAL' && daysLeft !== null && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--card-alt, #111)',
                  borderLeft: '3px solid var(--green)'
                }}
              >
                <p style={{ margin: 0, fontSize: 13 }}>
                  {daysLeft > 0
                    ? `Restam ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} de trial. Entre em contato para ativar seu plano.`
                    : 'Seu trial expirou. Entre em contato para ativar seu plano.'}
                </p>
              </div>
            )}

            {status === 'PAST_DUE' && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--card-alt, #111)',
                  borderLeft: '3px solid var(--red, #e74c3c)'
                }}
              >
                <p style={{ margin: 0, fontSize: 13 }}>
                  Há um problema com seu pagamento. Entre em contato com o suporte em{' '}
                  <a href="mailto:hola@automatizawpp.com" style={{ color: 'var(--green)' }}>
                    hola@automatizawpp.com
                  </a>
                </p>
              </div>
            )}

            <p className="ds-muted" style={{ marginTop: 12, fontSize: 12 }}>
              Conta criada em {new Date(billing.accountCreatedAt).toLocaleDateString('pt-BR')}
            </p>
          </section>

          <section className="ds-card">
            <h2 className="ds-title">Histórico de solicitações</h2>
            {rows.length === 0 ? (
              <p className="ds-muted">Sem solicitações registradas.</p>
            ) : (
              <DataTable columns={columns} data={rows} />
            )}
          </section>
        </>
      )}
    </PageLayout>
  );
}
