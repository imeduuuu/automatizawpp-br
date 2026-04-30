'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { EMAIL_TEMPLATES, type EmailTemplateKey } from '@/lib/email-templates';
import { showToast } from '@/lib/ui-toast';
import { useApi } from '@/components/ui/useApi';

type LeadsPayload = {
  leads: Array<{ id: string; fullName: string; email?: string | null; company?: string | null }>;
};

const emptyLeads: LeadsPayload = { leads: [] };

type Categoria = 'todos' | 'onboarding' | 'outreach' | 'follow_up' | 'demo' | 'trial' | 'objection' | 'closing' | 'retention';

const CATEGORIAS: { key: Categoria; label: string }[] = [
  { key: 'todos',     label: 'Todos' },
  { key: 'onboarding', label: 'Boas-vindas' },
  { key: 'outreach',   label: 'Prospecção' },
  { key: 'follow_up',  label: 'Follow-up' },
  { key: 'demo',       label: 'Demo' },
  { key: 'trial',      label: 'Trial' },
  { key: 'objection',  label: 'Objeções' },
  { key: 'closing',    label: 'Fechamento' },
  { key: 'retention',  label: 'Retenção' },
];

const CATEGORY_COLOR: Record<string, string> = {
  onboarding: '#25D366',
  outreach:   '#3b82f6',
  follow_up:  '#f59e0b',
  demo:       '#8b5cf6',
  trial:      '#06b6d4',
  objection:  '#f97316',
  closing:    '#ec4899',
  retention:  '#6b7280',
};

type ModalState = {
  templateKey: EmailTemplateKey;
  leadId: string;
  vars: Record<string, string>;
} | null;

export default function SequencesPage() {
  const [categoria, setCategoria] = useState<Categoria>('todos');
  const [modal, setModal] = useState<ModalState>(null);
  const [enviando, setEnviando] = useState(false);
  const [previewKey, setPreviewKey] = useState<EmailTemplateKey | null>(null);

  const leadsApi = useApi<LeadsPayload>('/api/leads?limit=200', emptyLeads);

  const templates = Object.values(EMAIL_TEMPLATES).filter(
    (t) => categoria === 'todos' || t.category === categoria
  );

  function abrirModal(key: EmailTemplateKey) {
    const template = EMAIL_TEMPLATES[key];
    const vars: Record<string, string> = {};
    for (const v of template.variables) vars[v] = '';
    setModal({ templateKey: key, leadId: '', vars });
  }

  function preencherVarsDoLead(leadId: string) {
    if (!modal) return;
    const lead = leadsApi.data.leads.find((l) => l.id === leadId);
    if (!lead) { setModal({ ...modal, leadId }); return; }

    const agora = new Date();
    const trialEnds = new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000)
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const autoVars: Record<string, string> = {
      name:         lead.fullName ?? '',
      businessName: lead.company ?? lead.fullName ?? '',
      trialEndsAt:  trialEnds,
      password:     '',
      appUrl:       'https://automatizawpp.com',
      plan:         'Pro',
      leadsProcessed: '0',
      roiEstimate:  'R$0',
      expiresAt:    new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    };

    const merged = { ...modal.vars };
    for (const v of Object.keys(merged)) {
      if (autoVars[v] && !merged[v]) merged[v] = autoVars[v];
    }

    setModal({ ...modal, leadId, vars: merged });
  }

  async function enviar() {
    if (!modal) return;
    const lead = leadsApi.data.leads.find((l) => l.id === modal.leadId);
    if (!lead?.email) { showToast('Lead sem email cadastrado', 'error'); return; }

    const faltando = Object.entries(modal.vars)
      .filter(([k, v]) => !v && k !== 'password' && k !== 'cc')
      .map(([k]) => k);
    if (faltando.length > 0) {
      showToast(`Preencha: ${faltando.join(', ')}`, 'error');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/sequences/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey: modal.templateKey,
          to: lead.email,
          vars: modal.vars,
          leadId: modal.leadId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Erro ao enviar');
      showToast(`Email "${modal.templateKey}" enviado via ${data.provider}`, 'success');
      setModal(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao enviar', 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PageLayout title="Sequências de Email" badges={{ leads: templates.length }}>
      {/* Abas de categoria */}
      <section className="ds-card">
        <div className="ds-tabs" style={{ flexWrap: 'wrap', gap: 4 }}>
          {CATEGORIAS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`ds-tab${categoria === c.key ? ' active' : ''}`}
              onClick={() => setCategoria(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid de templates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {templates.map((t) => {
          const cor = CATEGORY_COLOR[t.category] ?? '#888';
          return (
            <div key={t.key} className="ds-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-block', padding: '2px 9px', borderRadius: 20,
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
                  background: cor + '22', color: cor, border: `1px solid ${cor}44`
                }}>
                  {CATEGORIAS.find((c) => c.key === t.category)?.label ?? t.category}
                </span>
              </div>

              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>
                {t.subject.replace(/\{\{[^}]+\}\}/g, '…')}
              </p>

              <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
                {t.key}
              </p>

              {t.variables.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {t.variables.map((v) => (
                    <span key={v} style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      background: 'var(--surface)', color: 'var(--muted)', fontFamily: 'monospace'
                    }}>
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                <button
                  type="button"
                  className="ds-button ds-button-ghost"
                  style={{ flex: 1, fontSize: 12 }}
                  onClick={() => setPreviewKey(previewKey === t.key ? null : t.key)}
                >
                  {previewKey === t.key ? 'Fechar' : 'Pré-visualizar'}
                </button>
                <button
                  type="button"
                  className="ds-button ds-button-primary"
                  style={{ flex: 1, fontSize: 12 }}
                  onClick={() => abrirModal(t.key)}
                >
                  Disparar →
                </button>
              </div>

              {previewKey === t.key && (
                <div style={{
                  marginTop: 8, padding: 12, background: 'var(--surface)',
                  borderRadius: 8, fontSize: 12, color: 'var(--muted)',
                  maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap'
                }}>
                  {t.text.replace(/\{\{[^}]+\}\}/g, '[…]')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de disparo */}
      {modal && (() => {
        const template = EMAIL_TEMPLATES[modal.templateKey];
        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16
          }}>
            <div className="ds-card" style={{
              width: '100%', maxWidth: 480, maxHeight: '90vh',
              overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Disparar email</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {modal.templateKey}
                  </p>
                </div>
                <button type="button" onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              {/* Selecionar lead */}
              <div>
                <label className="ds-label">Lead destinatário</label>
                <select
                  className="ds-select"
                  value={modal.leadId}
                  onChange={(e) => preencherVarsDoLead(e.target.value)}
                >
                  <option value="">Selecionar lead…</option>
                  {leadsApi.data.leads
                    .filter((l) => l.email)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.fullName} — {l.email}
                      </option>
                    ))}
                </select>
              </div>

              {/* Variáveis */}
              {template.variables.map((v) => (
                <div key={v}>
                  <label className="ds-label" style={{ fontFamily: 'monospace' }}>{`{{${v}}}`}</label>
                  <input
                    className="ds-input"
                    value={modal.vars[v] ?? ''}
                    onChange={(e) => setModal({ ...modal, vars: { ...modal.vars, [v]: e.target.value } })}
                    placeholder={v === 'password' ? '(opcional)' : `Valor para ${v}`}
                  />
                </div>
              ))}

              {/* Pré-visualização do assunto */}
              {modal.leadId && (
                <div style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Assunto: </span>
                  <span style={{ fontWeight: 600 }}>
                    {template.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => modal.vars[k] || `{{${k}}}`)}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="ds-button ds-button-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setModal(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="ds-button ds-button-primary"
                  style={{ flex: 2 }}
                  onClick={enviar}
                  disabled={enviando || !modal.leadId}
                >
                  {enviando ? 'Enviando…' : 'Enviar email'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </PageLayout>
  );
}
