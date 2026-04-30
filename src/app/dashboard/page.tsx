'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/ui/PageLayout';
import { useApi } from '@/components/ui/useApi';

interface Lead {
  id: string;
  fullName: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  lastContactAt?: string | null;
  createdAt: string;
}

interface Stats {
  totalLeads: number;
  newLeads: number;
  engaged: number;
  qualified: number;
  closedWon: number;
  conversations: number;
  messages: number;
  agentRuns: number;
}

const emptyLeads = { leads: [] as Lead[], total: 0 };

function StatCard({ label, value, color = 'var(--green)' }: { label: string; value: number; color?: string }) {
  return (
    <div className="ds-card" style={{ padding: '20px 24px', flex: 1, minWidth: 140 }}>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color }}>{value}</p>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</p>
    </div>
  );
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    NEW: '#888',
    ENGAGED: '#25D366',
    QUALIFIED: '#3b82f6',
    PROPOSAL_SENT: '#f59e0b',
    NEGOTIATING: '#f97316',
    CLOSED_WON: '#22c55e',
    CLOSED_LOST: '#ef4444',
    ON_HOLD: '#6b7280',
  };
  return map[status] ?? '#888';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    NEW: 'Novo',
    ENGAGED: 'Engajado',
    QUALIFIED: 'Qualificado',
    PROPOSAL_SENT: 'Proposta Enviada',
    NEGOTIATING: 'Negociando',
    CLOSED_WON: 'Ganho',
    CLOSED_LOST: 'Perdido',
    ON_HOLD: 'Em Espera',
  };
  return map[status] ?? status;
}

function DashboardContent() {
  const router = useRouter();
  const leadsApi = useApi<{ leads: Lead[]; total: number }>('/api/leads', emptyLeads);
  const metricsApi = useApi<{ metrics?: Record<string, number> }>('/api/metrics', {});

  const stats: Stats = {
    totalLeads: leadsApi.data.total ?? leadsApi.data.leads.length,
    newLeads: leadsApi.data.leads.filter(l => l.status === 'NEW').length,
    engaged: leadsApi.data.leads.filter(l => l.status === 'ENGAGED').length,
    qualified: leadsApi.data.leads.filter(l => l.status === 'QUALIFIED' || l.status === 'PROPOSAL_SENT' || l.status === 'NEGOTIATING').length,
    closedWon: leadsApi.data.leads.filter(l => l.status === 'CLOSED_WON').length,
    conversations: (metricsApi.data.metrics?.conversations as number) ?? 0,
    messages: (metricsApi.data.metrics?.messages as number) ?? 0,
    agentRuns: (metricsApi.data.metrics?.agentRuns as number) ?? 0,
  };

  const recentLeads = [...leadsApi.data.leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <PageLayout title="Dashboard">
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Total de Contatos" value={stats.totalLeads} />
        <StatCard label="Novos" value={stats.newLeads} color="var(--muted)" />
        <StatCard label="Engajados" value={stats.engaged} />
        <StatCard label="Qualificados" value={stats.qualified} color="#3b82f6" />
        <StatCard label="Ganhos" value={stats.closedWon} color="#22c55e" />
      </div>

      {/* Recent leads */}
      <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Contatos Recentes</p>
          <button
            className="ds-button ds-button-ghost"
            style={{ fontSize: 12, padding: '4px 12px' }}
            onClick={() => router.push('/contatos')}
          >
            Ver todos →
          </button>
        </div>

        {leadsApi.loading ? (
          <div style={{ padding: 24 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 36, background: 'var(--surface)', borderRadius: 6, marginBottom: 8 }} />
            ))}
          </div>
        ) : recentLeads.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ margin: 0 }}>Nenhum contato ainda.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface)' }}>
                {['Nome', 'Empresa', 'Email', 'Status', 'Criado em'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead, i) => (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/contatos/${lead.id}`)}
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{lead.fullName || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{lead.company || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{lead.email || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusColor(lead.status) + '22', color: statusColor(lead.status) }}>
                      {statusLabel(lead.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--muted)' }}>Carregando...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
