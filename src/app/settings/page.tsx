'use client';

import { useMemo, useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';

type MetricsPayload = {
  mrr: {
    total: number;
  };
};

type LeadsPayload = {
  leads: Array<{
    id: string;
    fullName: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
  }>;
};

const emptyMetrics: MetricsPayload = { mrr: { total: 0 } };
const emptyLeads: LeadsPayload = { leads: [] };

type Tab = 'general' | 'integraciones' | 'notificaciones' | 'cuenta';

export default function SettingsPage() {
  const copy = useUiCopy();
  const [tab, setTab] = useState<Tab>('general');
  const metricsApi = useApi<MetricsPayload>('/api/metrics', emptyMetrics);
  const leadsApi = useApi<LeadsPayload>('/api/leads', emptyLeads);

  const loading = metricsApi.loading || leadsApi.loading;
  const error = metricsApi.error ?? leadsApi.error;

  const firstLead = useMemo(() => leadsApi.data.leads[0], [leadsApi.data.leads]);

  return (
    <PageLayout title={copy.settings.title} badges={{ leads: leadsApi.data.leads.length }}>
      {error ? <div className="ds-card ds-muted">{copy.common.error}: {error}</div> : null}

      <section className="ds-card">
        <div className="ds-tabs">
          <button type="button" className={`ds-tab${tab === 'general' ? ' active' : ''}`} onClick={() => setTab('general')}>
            {copy.settings.tabGeneral}
          </button>
          <button type="button" className={`ds-tab${tab === 'integraciones' ? ' active' : ''}`} onClick={() => setTab('integraciones')}>
            {copy.settings.tabIntegrations}
          </button>
          <button type="button" className={`ds-tab${tab === 'notificaciones' ? ' active' : ''}`} onClick={() => setTab('notificaciones')}>
            {copy.settings.tabNotifications}
          </button>
          <button type="button" className={`ds-tab${tab === 'cuenta' ? ' active' : ''}`} onClick={() => setTab('cuenta')}>
            {copy.settings.tabAccount}
          </button>
        </div>
      </section>

      <section className="ds-card">
        {loading ? (
          <div className="ds-grid">
            <Skeleton height={34} />
            <Skeleton height={34} />
            <Skeleton height={34} />
          </div>
        ) : null}

        {!loading && tab === 'general' ? (
          <form
            style={{ display: 'grid', gap: 10 }}
            onSubmit={(event) => {
              event.preventDefault();
              window.alert(copy.settings.savedGeneral);
            }}
          >
            <div>
              <label className="ds-label">{copy.settings.workspaceName}</label>
              <input className="ds-input" defaultValue="AutomatizaWPP Workspace" />
            </div>
            <div>
              <label className="ds-label">{copy.settings.language}</label>
              <select className="ds-select" defaultValue="pt-BR">
                <option value="pt-BR">{copy.settings.langPt}</option>
                <option value="es-ES">{copy.settings.langEs}</option>
                <option value="en-US">{copy.settings.langEn}</option>
              </select>
            </div>
            <button type="submit" className="ds-button ds-button-primary">
              {copy.settings.save}
            </button>
          </form>
        ) : null}

        {!loading && tab === 'integraciones' ? (
          <form
            style={{ display: 'grid', gap: 10 }}
            onSubmit={(event) => {
              event.preventDefault();
              window.alert(copy.settings.savedIntegrations);
            }}
          >
            <fieldset style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '4px' }}>
              <legend style={{ fontWeight: 'bold', paddingRight: '8px' }}>🐦 Bird Integration (Email + WhatsApp)</legend>
              <div style={{ marginTop: '12px' }}>
                <label className="ds-label">Bird API Key</label>
                <input className="ds-input" type="password" placeholder="sk_live_..." />
                <small style={{ color: '#666' }}>From https://dash.bird.gg/settings/api</small>
              </div>
              <div style={{ marginTop: '8px' }}>
                <label className="ds-label">Bird Workspace ID</label>
                <input className="ds-input" placeholder="ws_..." />
              </div>
              <div style={{ marginTop: '8px' }}>
                <label className="ds-label">URL do Webhook Bird (Somente leitura)</label>
                <input className="ds-input" value="https://automatizawpp.com/api/webhooks/bird" readOnly />
                <small style={{ color: '#666' }}>Configure esta URL no painel Bird → Webhooks → Assinar: message.received</small>
              </div>
              <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '12px' }}>
                <strong>📝 Como configurar:</strong>
                <ol style={{ marginTop: '4px', paddingLeft: '16px' }}>
                  <li>Go to <code>https://dash.bird.gg/webhooks</code></li>
                  <li>Create webhook pointing to the URL above</li>
                  <li>Subscribe to <code>message.received</code> event</li>
                  <li>Test with Sample Payload in Bird dashboard</li>
                </ol>
              </div>
            </fieldset>

            <fieldset style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '4px' }}>
              <legend style={{ fontWeight: 'bold', paddingRight: '8px' }}>📧 Brevo (Transactional Email)</legend>
              <div>
                <label className="ds-label">{copy.settings.brevoWebhook}</label>
                <input className="ds-input" defaultValue="https://automatizawpp.com/api/webhooks/brevo" />
              </div>
              <div style={{ marginTop: '8px' }}>
                <label className="ds-label">Brevo API Key</label>
                <input className="ds-input" type="password" placeholder="xkeysib_..." />
                <small style={{ color: '#666' }}>From https://app.brevo.com/settings/keys/api</small>
              </div>
            </fieldset>

            <fieldset style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '4px' }}>
              <legend style={{ fontWeight: 'bold', paddingRight: '8px' }}>🤖 AI Agents (OpenAI / Anthropic)</legend>
              <div>
                <label className="ds-label">OpenAI API Key (Optional)</label>
                <input className="ds-input" type="password" placeholder="sk-..." />
              </div>
              <div style={{ marginTop: '8px' }}>
                <label className="ds-label">Anthropic API Key (Optional)</label>
                <input className="ds-input" type="password" placeholder="sk-ant-..." />
              </div>
              <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
                Pelo menos uma é obrigatória. Agentes: Orchestrator, LeadResponse, Qualification, Objection, Closer, FollowUp, Writer, QA, Memory
              </small>
            </fieldset>

            <fieldset style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '4px' }}>
              <legend style={{ fontWeight: 'bold', paddingRight: '8px' }}>⚙️ Banco de Dados e Fila</legend>
              <div>
                <label className="ds-label">PostgreSQL URL</label>
                <input className="ds-input" type="password" placeholder="postgresql://user:pass@host/sales_os" readOnly value="(Configurado no ambiente)" />
              </div>
              <div style={{ marginTop: '8px' }}>
                <label className="ds-label">Redis URL</label>
                <input className="ds-input" type="password" placeholder="redis://host:6379" readOnly value="(Configurado no ambiente)" />
              </div>
            </fieldset>

            <fieldset style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '4px' }}>
              <legend style={{ fontWeight: 'bold', paddingRight: '8px' }}>📋 Regras de Conformidade</legend>
              <div>
                <label className="ds-label">Máximo de Contatos por Dia</label>
                <select className="ds-select" defaultValue="5">
                  <option value="3">3</option>
                  <option value="5">5 (recommended)</option>
                  <option value="10">10</option>
                </select>
              </div>
              <div style={{ marginTop: '8px' }}>
                <label className="ds-label">Início do Horário de Silêncio (ex.: 21 para 21:00)</label>
                <input className="ds-input" type="number" min="0" max="23" defaultValue="21" />
              </div>
              <div style={{ marginTop: '8px' }}>
                <label className="ds-label">Fim do Horário de Silêncio (ex.: 9 para 09:00)</label>
                <input className="ds-input" type="number" min="0" max="23" defaultValue="9" />
              </div>
              <div style={{ marginTop: '8px' }}>
                <label className="ds-label">Fuso Horário do Workspace</label>
                <select className="ds-select" defaultValue="America/Sao_Paulo">
                  <option value="America/Sao_Paulo">America/Sao_Paulo (BR)</option>
                  <option value="Europe/Madrid">Europe/Madrid (ES)</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>
            </fieldset>

            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
              <strong>📊 Sales OS — Weighted Efficiency Formula</strong>
              <div style={{ marginTop: '8px' }}>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li>30% Qualidade de Resposta (Meta: ≥90)</li>
                  <li>20% Precisão de Próxima Ação (Meta: ≥85)</li>
                  <li>20% Pontuação de Conformidade (Meta: 100)</li>
                  <li>15% Progressão de Etapa (Meta: ≥60)</li>
                  <li>15% Efetividade de Follow-up (Meta: ≥80)</li>
                </ul>
                <p style={{ marginTop: '8px', color: '#d32f2f', fontWeight: 'bold' }}>
                  → Meta Combinada: ≥85% de Eficiência
                </p>
              </div>
            </div>

            <div>
              <label className="ds-label">{copy.settings.mrrActive}</label>
              <input className="ds-input" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(metricsApi.data.mrr.total)} readOnly />
            </div>

            <button type="submit" className="ds-button ds-button-primary">
              {copy.settings.save}
            </button>
          </form>
        ) : null}

        {!loading && tab === 'notificaciones' ? (
          <form
            style={{ display: 'grid', gap: 10 }}
            onSubmit={(event) => {
              event.preventDefault();
              window.alert(copy.settings.savedNotifications);
            }}
          >
            <div>
              <label className="ds-label">{copy.settings.callAlerts}</label>
              <select className="ds-select" defaultValue="on">
                <option value="on">{copy.common.active}</option>
                <option value="off">{copy.common.inactive}</option>
              </select>
            </div>
            <div>
              <label className="ds-label">{copy.settings.followUpAlerts}</label>
              <select className="ds-select" defaultValue="on">
                <option value="on">{copy.common.active}</option>
                <option value="off">{copy.common.inactive}</option>
              </select>
            </div>
            <button type="submit" className="ds-button ds-button-primary">
              {copy.settings.save}
            </button>
          </form>
        ) : null}

        {!loading && tab === 'cuenta' ? (
          <form
            style={{ display: 'grid', gap: 10 }}
            onSubmit={(event) => {
              event.preventDefault();
              window.alert(copy.settings.savedAccount);
            }}
          >
            <div>
              <label className="ds-label">{copy.common.name}</label>
              <input className="ds-input" defaultValue={firstLead?.fullName ?? 'Usuario AutomatizaWPP'} />
            </div>
            <div>
              <label className="ds-label">{copy.common.email}</label>
              <input className="ds-input" defaultValue={firstLead?.email ?? 'user@automatizawpp.com'} />
            </div>
            <div>
              <label className="ds-label">{copy.common.company}</label>
              <input className="ds-input" defaultValue={firstLead?.company ?? 'AutomatizaWPP'} />
            </div>
            <div>
              <label className="ds-label">{copy.common.phone}</label>
              <input className="ds-input" defaultValue={firstLead?.phone ?? ''} />
            </div>
            <button type="submit" className="ds-button ds-button-primary">
              {copy.settings.save}
            </button>
          </form>
        ) : null}
      </section>
    </PageLayout>
  );
}
