'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { formatAgentName } from '@/lib/ui-formatters';
import { showToast } from '@/lib/ui-toast';
import { useUiLanguage, useUiCopy } from '@/components/ui/UiLanguageProvider';

type AgentsPayload = {
  agents: Array<{
    agent: string;
    totalRuns: number;
    runsToday: number;
    completedRuns: number;
    failedRuns: number;
    runningRuns: number;
    successRate: number;
    active: boolean;
    lastRunAt: string | null;
  }>;
};

type BundleLifecycle = 'loading' | 'active' | 'pending_activation' | 'upgrade_required' | 'error';

type EmailStatsPayload = {
  count: number;
  qualified: number;
  validationRate: number;
  costPerLead: number;
  lastRunAt: string | null;
};

type ReviewsStatsPayload = {
  new: number;
  replied: number;
  replyRate: number;
  ratingChange: number;
  lastRunAt: string | null;
};

type IcebreakerStatsPayload = {
  sent: number;
  responses: number;
  responseRate: number;
  conversions: number;
  revenue: number;
  lastRunAt: string | null;
};

type AlexPayload = {
  status: 'healthy' | 'warning' | 'error';
  alerts: string[];
  recommendations: Array<{
    agentType: string;
    title: string;
    description: string;
    impactEstimate: string;
    autoExecutable: boolean;
  }>;
  weeklyReport: {
    week: string;
    summaryText: string;
  } | null;
};

const emptyAgents: AgentsPayload = {
  agents: []
};

const emptyEmailStats: EmailStatsPayload = {
  count: 0,
  qualified: 0,
  validationRate: 0,
  costPerLead: 0,
  lastRunAt: null
};

const emptyReviewsStats: ReviewsStatsPayload = {
  new: 0,
  replied: 0,
  replyRate: 0,
  ratingChange: 0,
  lastRunAt: null
};

const emptyIcebreakerStats: IcebreakerStatsPayload = {
  sent: 0,
  responses: 0,
  responseRate: 0,
  conversions: 0,
  revenue: 0,
  lastRunAt: null
};

const emptyAlex: AlexPayload = {
  status: 'healthy',
  alerts: [],
  recommendations: [],
  weeklyReport: null
};

const bundleAgentLabels: Record<string, string> = {
  'email-scrapper': 'Email Scrapper',
  'google-reviews': 'Google Reviews',
  icebreaker: 'Icebreaker',
  'alex-supervisor': 'Alex Supervisor'
};

function formatDateTime(value: string | null, fallback = 'Sem atividade') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('pt-BR');
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

async function readJson<T>(response: Response) {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `Error ${response.status}`);
  }
  return payload;
}

export default function AgentsPage() {
  const copy = useUiCopy();
  const { language } = useUiLanguage();
  const agentsApi = useApi<AgentsPayload>('/api/agents', emptyAgents);
  const [bundleState, setBundleState] = useState<BundleLifecycle>('loading');
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [emailStats, setEmailStats] = useState<EmailStatsPayload>(emptyEmailStats);
  const [reviewsStats, setReviewsStats] = useState<ReviewsStatsPayload>(emptyReviewsStats);
  const [icebreakerStats, setIcebreakerStats] = useState<IcebreakerStatsPayload>(emptyIcebreakerStats);
  const [alexStats, setAlexStats] = useState<AlexPayload>(emptyAlex);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [emailDomain, setEmailDomain] = useState('');
  const [googleBusinessId, setGoogleBusinessId] = useState('');
  const [icebreakerProspect, setIcebreakerProspect] = useState({ name: '', email: '', company: '' });
  const [alexQuestion, setAlexQuestion] = useState('');
  const [alexReply, setAlexReply] = useState('');

  const loadBundleDashboard = useCallback(async () => {
    setBundleError(null);
    setBundleState((current) => (current === 'active' ? 'active' : 'loading'));

    try {
      const alexResponse = await fetch('/api/agents/alex', { cache: 'no-store' });

      if (alexResponse.status === 402) {
        setBundleState('pending_activation');
        setAlexStats(emptyAlex);
        return;
      }

      if (alexResponse.status === 403) {
        setBundleState('upgrade_required');
        setAlexStats(emptyAlex);
        return;
      }

      const alexPayload = await readJson<AlexPayload>(alexResponse);
      const [emailPayload, reviewsPayload, icebreakerPayload] = await Promise.all([
        fetch('/api/agents/email-scrapper', { cache: 'no-store' }).then((response) => readJson<EmailStatsPayload>(response)),
        fetch('/api/agents/google-reviews', { cache: 'no-store' }).then((response) => readJson<ReviewsStatsPayload>(response)),
        fetch('/api/agents/icebreaker', { cache: 'no-store' }).then((response) => readJson<IcebreakerStatsPayload>(response))
      ]);

      setAlexStats(alexPayload);
      setEmailStats(emailPayload);
      setReviewsStats(reviewsPayload);
      setIcebreakerStats(icebreakerPayload);
      setBundleState('active');
    } catch (error) {
      setBundleError(error instanceof Error ? error.message : copy.agents.loadError);
      setBundleState('error');
    }
  }, [copy.agents.loadError]);

  useEffect(() => {
    void loadBundleDashboard();
  }, [loadBundleDashboard]);

  async function runEmailScrapper() {
    if (!emailDomain.trim()) {
      showToast(copy.agents.domainRequired, 'error');
      return;
    }

    setActionLoading('email');
    try {
      const response = await fetch('/api/agents/email-scrapper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: emailDomain.trim(), maxResults: 100 })
      });
      const payload = await readJson<EmailStatsPayload & { emails?: Array<{ email: string }> }>(response);
      setEmailStats((current) => ({ ...current, ...payload, lastRunAt: new Date().toISOString() }));
      showToast(`Email Scrapper processou ${payload.count} emails.`);
      await loadBundleDashboard();
    } catch (error) {
      showToast(error instanceof Error ? error.message : copy.agents.emailScrapperError, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function runGoogleReviews() {
    if (!googleBusinessId.trim()) {
      showToast(copy.agents.businessIdRequired, 'error');
      return;
    }

    setActionLoading('reviews');
    try {
      const response = await fetch('/api/agents/google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: googleBusinessId.trim() })
      });
      const payload = await readJson<ReviewsStatsPayload>(response);
      setReviewsStats((current) => ({ ...current, ...payload, lastRunAt: new Date().toISOString() }));
      showToast(`Google Reviews respondeu ${payload.replied} avaliações.`);
      await loadBundleDashboard();
    } catch (error) {
      showToast(error instanceof Error ? error.message : copy.agents.reviewsError, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function runIcebreaker() {
    if (!icebreakerProspect.name.trim() || !icebreakerProspect.email.trim()) {
      showToast(copy.agents.prospectRequired, 'error');
      return;
    }

    setActionLoading('icebreaker');
    try {
      const response = await fetch('/api/agents/icebreaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect: {
            name: icebreakerProspect.name.trim(),
            email: icebreakerProspect.email.trim(),
            company: icebreakerProspect.company.trim() || undefined
          },
          channel: 'email'
        })
      });
      const payload = await readJson<IcebreakerStatsPayload & { result?: { messageGenerated?: string } }>(response);
      setIcebreakerStats((current) => ({ ...current, ...payload, lastRunAt: new Date().toISOString() }));
      if (payload.result?.messageGenerated) {
        setAlexReply(payload.result.messageGenerated);
      }
      showToast(copy.agents.icebreakerDone);
      await loadBundleDashboard();
    } catch (error) {
      showToast(error instanceof Error ? error.message : copy.agents.icebreakerError, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function askAlex() {
    if (!alexQuestion.trim()) {
      showToast(copy.agents.alexQuestionRequired, 'error');
      return;
    }

    setActionLoading('alex-chat');
    try {
      const response = await fetch('/api/agents/alex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', message: alexQuestion.trim() })
      });
      const payload = await readJson<{ reply: string }>(response);
      setAlexReply(payload.reply);
      showToast(copy.agents.alexReplied);
    } catch (error) {
      showToast(error instanceof Error ? error.message : copy.agents.alexChatError, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function generateAlexReport() {
    setActionLoading('alex-report');
    try {
      const response = await fetch('/api/agents/alex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'report' })
      });
      const payload = await readJson<{ report: { week: string; summaryText: string } }>(response);
      setAlexStats((current) => ({ ...current, weeklyReport: payload.report }));
      showToast(copy.agents.alexReportDone);
      await loadBundleDashboard();
    } catch (error) {
      showToast(error instanceof Error ? error.message : copy.agents.alexReportError, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function activateScaleBundle() {
    setActionLoading('activate-scale');
    try {
      const response = await fetch('/api/agents/scale/activate', {
        method: 'POST'
      });
      await readJson<{ ok: boolean }>(response);
      showToast(copy.agents.scaleActivated);
      await loadBundleDashboard();
    } catch (error) {
      showToast(error instanceof Error ? error.message : copy.agents.scaleActivateError, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  const totalRunsToday = useMemo(() => agentsApi.data.agents.reduce((sum, agent) => sum + agent.runsToday, 0), [agentsApi.data.agents]);

  return (
    <PageLayout
      title={copy.agents.title}
      badges={{ calls: totalRunsToday }}
      actions={
        <Link href="/agents/config" className="ds-button ds-button-secondary" style={{ fontSize: 13 }}>
          Configurações Alex (VAPI)
        </Link>
      }
    >
      {agentsApi.error ? <div className="ds-card ds-muted">Erro ao carregar agentes: {agentsApi.error}</div> : null}
      {bundleError ? <div className="ds-card ds-muted">Erro ao carregar bundle Scale: {bundleError}</div> : null}

      <section className="ds-card">
        <h2 className="ds-title">{copy.agents.bundleTitle}</h2>
        <p className="ds-subtitle">{copy.agents.bundleSubtitle}</p>
      </section>

      {bundleState === 'loading' ? (
        <section className="ds-grid ds-grid-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} height={150} />
          ))}
        </section>
      ) : null}

      {bundleState === 'upgrade_required' ? (
        <section className="ds-card" style={{ display: 'grid', gap: 14 }}>
          <div>
            <p className="ds-kpi-label">{copy.agents.planRequired}</p>
            <p className="ds-kpi-value" style={{ fontSize: 26 }}>
              Scale R$997/mês
            </p>
            <p className="ds-kpi-sub">O bundle premium é ativado apenas para clientes com acesso Scale provisionado.</p>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="ds-muted">Inclui Email Scrapper, Google Reviews, Icebreaker e ALEX Supervisor.</span>
            <span className="ds-muted">Quando a equipa ativar o seu plano, o dashboard completo aparecerá aqui.</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="ds-button ds-button-secondary" onClick={activateScaleBundle} disabled={actionLoading === 'activate-scale'}>
              {actionLoading === 'activate-scale' ? copy.agents.activating : copy.agents.activateBundle}
            </button>
            <Link href="/account/billing" className="ds-button ds-button-primary">
              {copy.agents.reviewBilling}
            </Link>
            <Link href="/pricing" className="ds-button ds-button-secondary">
              {copy.agents.viewPlans}
            </Link>
          </div>
        </section>
      ) : null}

      {bundleState === 'pending_activation' ? (
        <section className="ds-card" style={{ display: 'grid', gap: 10 }}>
          <p className="ds-kpi-label">{copy.agents.bundleStatusLabel}</p>
          <p className="ds-kpi-value" style={{ fontSize: 24 }}>
            {copy.agents.statusPending}
          </p>
          <p className="ds-subtitle">{copy.agents.pendingProvisionNote}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="ds-button ds-button-primary" onClick={activateScaleBundle} disabled={actionLoading === 'activate-scale'}>
              {actionLoading === 'activate-scale' ? copy.agents.activating : copy.agents.completeActivation}
            </button>
            <Link href="/account/billing" className="ds-button ds-button-secondary" style={{ display: 'inline-flex' }}>
              {copy.agents.openBilling}
            </Link>
          </div>
        </section>
      ) : null}

      {bundleState === 'active' ? (
        <>
          <section className="ds-grid ds-grid-4">
            <article className="ds-card">
              <p className="ds-kpi-label">{copy.agents.kpiEmailsValidated}</p>
              <p className="ds-kpi-value">{emailStats.count}</p>
              <p className="ds-kpi-sub">{emailStats.qualified} {copy.agents.qualified} · {formatPercent(emailStats.validationRate)}</p>
            </article>
            <article className="ds-card">
              <p className="ds-kpi-label">{copy.agents.kpiReviewsReplied}</p>
              <p className="ds-kpi-value">{reviewsStats.replied}</p>
              <p className="ds-kpi-sub">{reviewsStats.new} {copy.agents.newReviews} · {formatPercent(reviewsStats.replyRate)}</p>
            </article>
            <article className="ds-card">
              <p className="ds-kpi-label">{copy.agents.kpiIcebreakersSent}</p>
              <p className="ds-kpi-value">{icebreakerStats.sent}</p>
              <p className="ds-kpi-sub">{icebreakerStats.responses} {copy.agents.responses} · {formatPercent(icebreakerStats.responseRate)}</p>
            </article>
            <article className="ds-card">
              <p className="ds-kpi-label">{copy.agents.kpiAlexStatus}</p>
              <p className="ds-kpi-value" style={{ fontSize: 20 }}>
                {alexStats.status}
              </p>
              <p className="ds-kpi-sub">{alexStats.recommendations.length} {copy.agents.activeRecommendations}</p>
            </article>
          </section>

          <section className="ds-grid ds-grid-2">
            <article className="ds-card" style={{ display: 'grid', gap: 10 }}>
              <div>
                <p className="ds-kpi-label">Email Scrapper</p>
                <p className="ds-kpi-sub">{copy.agents.lastExecution}: {formatDateTime(emailStats.lastRunAt, copy.agents.noActivity)}</p>
              </div>
              <input className="ds-input" placeholder={copy.agents.domainLabel} value={emailDomain} onChange={(event) => setEmailDomain(event.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span className="ds-muted">{copy.agents.costPerLead}: {formatCurrency(emailStats.costPerLead)}</span>
                <button type="button" className="ds-button ds-button-primary" onClick={runEmailScrapper} disabled={actionLoading === 'email'}>
                  {actionLoading === 'email' ? copy.agents.launching : copy.agents.startScan}
                </button>
              </div>
            </article>

            <article className="ds-card" style={{ display: 'grid', gap: 10 }}>
              <div>
                <p className="ds-kpi-label">Google Reviews</p>
                <p className="ds-kpi-sub">{copy.agents.lastSync}: {formatDateTime(reviewsStats.lastRunAt, copy.agents.noActivity)}</p>
              </div>
              <input className="ds-input" placeholder={copy.agents.businessIdLabel} value={googleBusinessId} onChange={(event) => setGoogleBusinessId(event.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span className="ds-muted">{copy.agents.ratingChange}: {reviewsStats.ratingChange >= 0 ? '+' : ''}{reviewsStats.ratingChange}</span>
                <button type="button" className="ds-button ds-button-primary" onClick={runGoogleReviews} disabled={actionLoading === 'reviews'}>
                  {actionLoading === 'reviews' ? copy.agents.syncing : copy.agents.syncNow}
                </button>
              </div>
            </article>

            <article className="ds-card" style={{ display: 'grid', gap: 10 }}>
              <div>
                <p className="ds-kpi-label">Icebreaker</p>
                <p className="ds-kpi-sub">{copy.agents.lastOutreach}: {formatDateTime(icebreakerStats.lastRunAt, copy.agents.noActivity)}</p>
              </div>
              <input
                className="ds-input"
                placeholder={copy.agents.prospectNameLabel}
                value={icebreakerProspect.name}
                onChange={(event) => setIcebreakerProspect((current) => ({ ...current, name: event.target.value }))}
              />
              <input
                className="ds-input"
                placeholder={copy.agents.emailPlaceholder}
                value={icebreakerProspect.email}
                onChange={(event) => setIcebreakerProspect((current) => ({ ...current, email: event.target.value }))}
              />
              <input
                className="ds-input"
                placeholder={copy.agents.companyOptional}
                value={icebreakerProspect.company}
                onChange={(event) => setIcebreakerProspect((current) => ({ ...current, company: event.target.value }))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span className="ds-muted">{copy.agents.revenueAttr}: {formatCurrency(icebreakerStats.revenue)}</span>
                <button type="button" className="ds-button ds-button-primary" onClick={runIcebreaker} disabled={actionLoading === 'icebreaker'}>
                  {actionLoading === 'icebreaker' ? copy.agents.sending : copy.agents.sendIcebreaker}
                </button>
              </div>
            </article>

            <article className="ds-card" style={{ display: 'grid', gap: 10 }}>
              <div>
                <p className="ds-kpi-label">ALEX Supervisor</p>
                <p className="ds-kpi-sub">{copy.agents.alexSupervisorDesc}</p>
              </div>
              {alexStats.alerts.length > 0 ? (
                <div className="ds-card ds-muted" style={{ margin: 0 }}>
                  {alexStats.alerts.map((alert) => (
                    <p key={alert} style={{ margin: 0 }}>{alert}</p>
                  ))}
                </div>
              ) : (
                <div className="ds-card ds-muted" style={{ margin: 0 }}>
                  {copy.agents.noAlerts}
                </div>
              )}
              <textarea
                className="ds-input"
                style={{ minHeight: 90 }}
                placeholder={copy.agents.alexPlaceholder}
                value={alexQuestion}
                onChange={(event) => setAlexQuestion(event.target.value)}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="ds-button ds-button-secondary" onClick={generateAlexReport} disabled={actionLoading === 'alex-report'}>
                  {actionLoading === 'alex-report' ? copy.agents.generating : copy.agents.generateReport}
                </button>
                <button type="button" className="ds-button ds-button-primary" onClick={askAlex} disabled={actionLoading === 'alex-chat'}>
                  {actionLoading === 'alex-chat' ? copy.agents.thinking : copy.agents.askAlexBtn}
                </button>
              </div>
              {alexReply ? <div className="ds-card ds-muted" style={{ margin: 0 }}>{alexReply}</div> : null}
            </article>
          </section>

          <section className="ds-grid ds-grid-2">
            <article className="ds-card">
              <h2 className="ds-title">{copy.agents.recommendationsTitle}</h2>
              {alexStats.recommendations.length === 0 ? (
                <p className="ds-muted" style={{ marginTop: 10 }}>{copy.agents.noRecommendations}</p>
              ) : (
                <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                  {alexStats.recommendations.map((recommendation) => (
                    <div key={`${recommendation.agentType}-${recommendation.title}`} className="ds-card ds-muted" style={{ margin: 0 }}>
                      <p className="ds-kpi-label">{recommendation.title}</p>
                      <p style={{ margin: '6px 0 0' }}>{recommendation.description}</p>
                      <p className="ds-kpi-sub" style={{ marginTop: 8 }}>
                        {bundleAgentLabels[recommendation.agentType] ?? recommendation.agentType} · {copy.agents.impact} {recommendation.impactEstimate}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="ds-card">
              <h2 className="ds-title">{copy.agents.weeklyReportTitle}</h2>
              {alexStats.weeklyReport ? (
                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                  <p className="ds-kpi-label">{copy.agents.week}</p>
                  <p className="ds-kpi-value" style={{ fontSize: 20 }}>{alexStats.weeklyReport.week}</p>
                  <p className="ds-subtitle">{alexStats.weeklyReport.summaryText}</p>
                </div>
              ) : (
                <p className="ds-muted" style={{ marginTop: 10 }}>{copy.agents.noReport}</p>
              )}
            </article>
          </section>
        </>
      ) : null}

      <section className="ds-card">
        <h2 className="ds-title">{copy.agents.monitorTitle}</h2>
        <p className="ds-subtitle">{copy.agents.monitorSubtitle}</p>
      </section>

      <section className="ds-grid ds-grid-4">
        {agentsApi.loading
          ? [1, 2, 3, 4].map((item) => <Skeleton key={item} height={140} />)
          : agentsApi.data.agents.map((agent) => (
              <article key={agent.agent} className="ds-card">
                <p className="ds-kpi-label">{copy.agents.agentLabel}</p>
                <p className="ds-kpi-value" style={{ fontSize: 20 }}>
                  {formatAgentName(agent.agent, language)}
                </p>
                <p className="ds-kpi-sub">{copy.common.status}: {agent.active ? copy.agents.statusActive.toLowerCase() : copy.agents.statusInactive.toLowerCase()}</p>
                <div style={{ marginTop: 10, display: 'grid', gap: 4 }}>
                  <span style={{ fontWeight: 600 }}>{copy.agents.executionsToday}: {agent.runsToday}</span>
                  <span className="ds-muted">{copy.agents.successRate}: {agent.successRate}%</span>
                  <span className="ds-muted">{copy.agents.totalRuns}: {agent.totalRuns}</span>
                  <span className="ds-muted">{copy.agents.lastActivity}: {formatDateTime(agent.lastRunAt, copy.agents.noActivity)}</span>
                </div>
              </article>
            ))}
      </section>

      {!agentsApi.loading && agentsApi.data.agents.length === 0 ? <div className="ds-card ds-muted">{copy.agents.noAgents}</div> : null}
    </PageLayout>
  );
}
