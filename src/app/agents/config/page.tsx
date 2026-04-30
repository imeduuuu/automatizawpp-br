'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { showToast } from '@/lib/ui-toast';

type AssistantModel = {
  provider?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  emotionRecognitionEnabled?: boolean;
};

type AssistantVoice = {
  provider?: string;
  voiceId?: string;
  speed?: number;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
};

type AssistantConfig = {
  firstMessage?: string | null;
  model?: AssistantModel | null;
  voice?: AssistantVoice | null;
  maxDurationSeconds?: number | null;
  endCallMessage?: string | null;
  backgroundSound?: string | null;
  backgroundDenoisingEnabled?: boolean | null;
  silenceTimeoutSeconds?: number | null;
  responseDelaySeconds?: number | null;
  llmRequestDelaySeconds?: number | null;
  numWordsToInterruptAssistant?: number | null;
};

type ConfigPayload = {
  assistantId: string;
  phoneNumberId: string;
  testPhone: string;
  assistant: Record<string, unknown>;
};

const AI_PROVIDERS = ['openai', 'anthropic', 'together-ai', 'groq', 'anyscale', 'custom-llm'];
const AI_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-3.5-turbo'],
  anthropic: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022'],
  'together-ai': ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
  groq: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'],
  anyscale: [],
  'custom-llm': []
};
const VOICE_PROVIDERS = ['11labs', 'azure', 'openai', 'deepgram', 'cartesia', 'rime-ai'];
const BACKGROUND_SOUNDS = ['off', 'office', 'nature', 'rain', 'music'];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary, #9ca3af)' }}>{label}</label>
      {children}
      {hint ? <span style={{ fontSize: 11, color: 'var(--color-text-muted, #6b7280)' }}>{hint}</span> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ds-card" style={{ display: 'grid', gap: 16 }}>
      <h2 className="ds-title" style={{ marginBottom: 4 }}>{title}</h2>
      {children}
    </section>
  );
}

function NumInput({ value, onChange, min, max, step = 1 }: { value: number | null | undefined; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      className="ds-input"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      style={{ width: '100%' }}
    />
  );
}

export default function AlexConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<Record<string, unknown>>({});
  const [meta, setMeta] = useState({ assistantId: '', phoneNumberId: '', testPhone: '' });
  const [cfg, setCfg] = useState<AssistantConfig>({});

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/alex/config');
      const data = (await res.json()) as ConfigPayload & { error?: string };
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : `Error ${res.status}`);
        return;
      }
      const a = data.assistant as AssistantConfig & Record<string, unknown>;
      setRaw(data.assistant);
      setMeta({ assistantId: data.assistantId, phoneNumberId: data.phoneNumberId, testPhone: data.testPhone });
      setCfg({
        firstMessage: a.firstMessage ?? '',
        endCallMessage: a.endCallMessage ?? '',
        maxDurationSeconds: (a.maxDurationSeconds as number) ?? 600,
        backgroundSound: (a.backgroundSound as string) ?? 'off',
        backgroundDenoisingEnabled: (a.backgroundDenoisingEnabled as boolean) ?? false,
        silenceTimeoutSeconds: (a.silenceTimeoutSeconds as number) ?? 30,
        responseDelaySeconds: (a.responseDelaySeconds as number) ?? 0,
        llmRequestDelaySeconds: (a.llmRequestDelaySeconds as number) ?? 0,
        numWordsToInterruptAssistant: (a.numWordsToInterruptAssistant as number) ?? 3,
        model: {
          provider: ((a.model as AssistantModel)?.provider) ?? 'openai',
          model: ((a.model as AssistantModel)?.model) ?? '',
          systemPrompt: ((a.model as AssistantModel)?.systemPrompt) ?? '',
          temperature: ((a.model as AssistantModel)?.temperature) ?? 0.3,
          maxTokens: ((a.model as AssistantModel)?.maxTokens) ?? 1024,
          emotionRecognitionEnabled: ((a.model as AssistantModel)?.emotionRecognitionEnabled) ?? false,
        },
        voice: {
          provider: ((a.voice as AssistantVoice)?.provider) ?? '11labs',
          voiceId: ((a.voice as AssistantVoice)?.voiceId) ?? '',
          speed: ((a.voice as AssistantVoice)?.speed) ?? 1.0,
          stability: ((a.voice as AssistantVoice)?.stability) ?? 0.5,
          similarityBoost: ((a.voice as AssistantVoice)?.similarityBoost) ?? 0.75,
          style: ((a.voice as AssistantVoice)?.style) ?? 0,
          useSpeakerBoost: ((a.voice as AssistantVoice)?.useSpeakerBoost) ?? true,
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  }

  function setModel(patch: Partial<AssistantModel>) {
    setCfg((prev) => ({ ...prev, model: { ...prev.model, ...patch } }));
  }

  function setVoice(patch: Partial<AssistantVoice>) {
    setCfg((prev) => ({ ...prev, voice: { ...prev.voice, ...patch } }));
  }

  async function save() {
    setSaving(true);
    try {
      const mergedAssistant = {
        ...raw,
        firstMessage: cfg.firstMessage,
        endCallMessage: cfg.endCallMessage,
        maxDurationSeconds: cfg.maxDurationSeconds,
        backgroundSound: cfg.backgroundSound,
        backgroundDenoisingEnabled: cfg.backgroundDenoisingEnabled,
        silenceTimeoutSeconds: cfg.silenceTimeoutSeconds,
        responseDelaySeconds: cfg.responseDelaySeconds,
        llmRequestDelaySeconds: cfg.llmRequestDelaySeconds,
        numWordsToInterruptAssistant: cfg.numWordsToInterruptAssistant,
        model: { ...(raw.model as Record<string, unknown> ?? {}), ...cfg.model },
        voice: { ...(raw.voice as Record<string, unknown> ?? {}), ...cfg.voice },
      };

      const res = await fetch('/api/alex/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistant: mergedAssistant })
      });
      const data = (await res.json()) as { ok?: boolean; error?: unknown };
      if (!res.ok) {
        showToast('Erro ao salvar: ' + JSON.stringify(data.error), 'error');
        return;
      }
      showToast('Configuração salva no VAPI');
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  }

  const modelProvider = cfg.model?.provider ?? 'openai';
  const modelOptions = AI_MODELS[modelProvider] ?? [];

  return (
    <PageLayout title="Alex — Configuração VAPI">
      <div style={{ marginBottom: 8 }}>
        <Link href="/agents" className="ds-muted" style={{ fontSize: 13, textDecoration: 'none' }}>
          ← Voltar para Agentes
        </Link>
      </div>

      {error ? (
        <section className="ds-card ds-muted">
          <p style={{ color: '#f87171' }}>{error}</p>
          {error.includes('VAPI_API_KEY') ? (
            <p style={{ marginTop: 8, fontSize: 12 }}>
              Adicione <code>VAPI_API_KEY=...</code> ao <code>.env</code> do servidor e reinicie o container.
            </p>
          ) : null}
        </section>
      ) : null}

      {loading ? (
        <section className="ds-card ds-muted">Carregando configuração do assistente...</section>
      ) : !error ? (
        <>
          <section className="ds-card" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12, color: '#6b7280' }}>
            <span>ID assistente: <code style={{ color: '#9ca3af' }}>{meta.assistantId}</code></span>
            <span>ID telefone: <code style={{ color: '#9ca3af' }}>{meta.phoneNumberId}</code></span>
            <span>Test phone: <code style={{ color: '#9ca3af' }}>{meta.testPhone}</code></span>
          </section>

          {/* MODELO DE IA */}
          <Section title="Modelo de IA">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Provedor">
                <select
                  className="ds-input"
                  value={modelProvider}
                  onChange={(e) => setModel({ provider: e.target.value, model: AI_MODELS[e.target.value]?.[0] ?? '' })}
                >
                  {AI_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Modelo">
                {modelOptions.length > 0 ? (
                  <select
                    className="ds-input"
                    value={cfg.model?.model ?? ''}
                    onChange={(e) => setModel({ model: e.target.value })}
                  >
                    {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input
                    className="ds-input"
                    placeholder="Nome do modelo"
                    value={cfg.model?.model ?? ''}
                    onChange={(e) => setModel({ model: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Temperatura" hint="0 = determinista · 1 = criativo">
                <NumInput value={cfg.model?.temperature} onChange={(v) => setModel({ temperature: v })} min={0} max={2} step={0.05} />
              </Field>
              <Field label="Max tokens">
                <NumInput value={cfg.model?.maxTokens} onChange={(v) => setModel({ maxTokens: v })} min={64} max={8192} />
              </Field>
            </div>
            <Field label="Reconhecimento de emoções">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={cfg.model?.emotionRecognitionEnabled ?? false}
                  onChange={(e) => setModel({ emotionRecognitionEnabled: e.target.checked })}
                />
                Ativar análise de emoções durante a ligação
              </label>
            </Field>
            <Field label="System Prompt" hint="Use {{COMPANY_NAME}}, {{SECTOR}}, {{CONTACT_PHONE}}, {{TODAY_DATE}} como variáveis">
              <textarea
                className="ds-input"
                style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5 }}
                value={cfg.model?.systemPrompt ?? ''}
                onChange={(e) => setModel({ systemPrompt: e.target.value })}
              />
            </Field>
          </Section>

          {/* VOZ */}
          <Section title="Voz">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Provedor de voz">
                <select
                  className="ds-input"
                  value={cfg.voice?.provider ?? '11labs'}
                  onChange={(e) => setVoice({ provider: e.target.value })}
                >
                  {VOICE_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Voice ID" hint="ID do modelo de voz no provedor selecionado">
                <input
                  className="ds-input"
                  placeholder="ej: pNInz6obpgDQGcFmaJgB"
                  value={cfg.voice?.voiceId ?? ''}
                  onChange={(e) => setVoice({ voiceId: e.target.value })}
                />
              </Field>
              <Field label="Velocidade" hint="0.5 – 2.0 (1.0 = normal)">
                <NumInput value={cfg.voice?.speed} onChange={(v) => setVoice({ speed: v })} min={0.5} max={2} step={0.05} />
              </Field>
              <Field label="Estabilidade" hint="0 – 1 (11labs: maior = mais uniforme)">
                <NumInput value={cfg.voice?.stability} onChange={(v) => setVoice({ stability: v })} min={0} max={1} step={0.05} />
              </Field>
              <Field label="Similarity Boost" hint="0 – 1 (11labs)">
                <NumInput value={cfg.voice?.similarityBoost} onChange={(v) => setVoice({ similarityBoost: v })} min={0} max={1} step={0.05} />
              </Field>
              <Field label="Style" hint="0 – 1 (11labs: expressividade)">
                <NumInput value={cfg.voice?.style} onChange={(v) => setVoice({ style: v })} min={0} max={1} step={0.05} />
              </Field>
            </div>
            <Field label="Speaker Boost (11labs)">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={cfg.voice?.useSpeakerBoost ?? true}
                  onChange={(e) => setVoice({ useSpeakerBoost: e.target.checked })}
                />
                Ativar Speaker Boost para maior clareza vocal
              </label>
            </Field>
          </Section>

          {/* COMPORTAMENTO DA LIGAÇÃO */}
          <Section title="Comportamento da ligação">
            <Field label="Mensagem inicial" hint="O que Alex diz ao iniciar cada ligação. Aceita variáveis de template.">
              <textarea
                className="ds-input"
                style={{ minHeight: 80 }}
                value={cfg.firstMessage ?? ''}
                onChange={(e) => setCfg((prev) => ({ ...prev, firstMessage: e.target.value }))}
              />
            </Field>
            <Field label="Mensagem de fim de ligação" hint="O que Alex diz logo antes de desligar.">
              <textarea
                className="ds-input"
                style={{ minHeight: 60 }}
                value={cfg.endCallMessage ?? ''}
                onChange={(e) => setCfg((prev) => ({ ...prev, endCallMessage: e.target.value }))}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Duración máxima (segundos)" hint="ej: 600 = 10 minutos">
                <NumInput value={cfg.maxDurationSeconds} onChange={(v) => setCfg((prev) => ({ ...prev, maxDurationSeconds: v }))} min={30} max={3600} />
              </Field>
              <Field label="Som de fundo">
                <select
                  className="ds-input"
                  value={cfg.backgroundSound ?? 'off'}
                  onChange={(e) => setCfg((prev) => ({ ...prev, backgroundSound: e.target.value }))}
                >
                  {BACKGROUND_SOUNDS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Redução de ruído">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={cfg.backgroundDenoisingEnabled ?? false}
                  onChange={(e) => setCfg((prev) => ({ ...prev, backgroundDenoisingEnabled: e.target.checked }))}
                />
                Ativar redução de ruído de fundo para melhorar qualidade de áudio
              </label>
            </Field>
          </Section>

          {/* LATÊNCIA */}
          <Section title="Latência e interrupções">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Silêncio até desligar (segundos)" hint="Tempo de silêncio do usuário antes de Alex desligar">
                <NumInput value={cfg.silenceTimeoutSeconds} onChange={(v) => setCfg((prev) => ({ ...prev, silenceTimeoutSeconds: v }))} min={5} max={120} />
              </Field>
              <Field label="Atraso de resposta (segundos)" hint="Tempo que Alex aguarda antes de responder">
                <NumInput value={cfg.responseDelaySeconds} onChange={(v) => setCfg((prev) => ({ ...prev, responseDelaySeconds: v }))} min={0} max={5} step={0.1} />
              </Field>
              <Field label="Atraso LLM (segundos)" hint="Tempo extra antes de enviar texto ao modelo de IA">
                <NumInput value={cfg.llmRequestDelaySeconds} onChange={(v) => setCfg((prev) => ({ ...prev, llmRequestDelaySeconds: v }))} min={0} max={5} step={0.1} />
              </Field>
              <Field label="Palavras para interromper Alex" hint="Quantas palavras o usuário deve dizer para Alex parar de falar">
                <NumInput value={cfg.numWordsToInterruptAssistant} onChange={(v) => setCfg((prev) => ({ ...prev, numWordsToInterruptAssistant: v }))} min={1} max={20} />
              </Field>
            </div>
          </Section>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 32 }}>
            <button type="button" className="ds-button ds-button-secondary" onClick={() => void load()} disabled={loading}>
              Descartar alterações
            </button>
            <button type="button" className="ds-button ds-button-primary" onClick={() => void save()} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar no VAPI'}
            </button>
          </div>
        </>
      ) : null}
    </PageLayout>
  );
}
