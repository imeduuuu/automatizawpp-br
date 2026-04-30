'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type OnboardingFlowProps = {
  trialDaysRemaining: number;
  businessName?: string | null;
};

export function OnboardingFlow({ trialDaysRemaining, businessName }: OnboardingFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [botName, setBotName] = useState(`Assistente de ${businessName?.trim() || 'seu negócio'}`);
  const [welcomeMessage, setWelcomeMessage] = useState('Olá, sou o assistente do AutomatizaWPP. Como posso ajudar você hoje?');
  const [businessHours, setBusinessHours] = useState('Segunda a Sexta 9h-18h');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const progress = useMemo(() => {
    if (step === 1) return 33;
    if (step === 2) return 67;
    return 100;
  }, [step]);

  async function saveBotConfig() {
    setError('');
    setSaving(true);

    try {
      const response = await fetch('/api/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName,
          welcomeMessage,
          businessHours
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || 'Não foi possível salvar a configuração.');
        return;
      }

      setStep(3);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ds-auth-wrap" style={{ padding: 24 }}>
      <div className="ds-auth-card" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="ds-muted" style={{ fontSize: 12 }}>
              Onboarding
            </span>
            <span className="ds-muted" style={{ fontSize: 12 }}>
              Passo {step} de 3
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 8, background: 'var(--bg)' }}>
            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 8, background: 'var(--green)', transition: 'width 220ms ease' }} />
          </div>
        </div>

        {step === 1 ? (
          <section className="onb-step" style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--green-light)',
                border: '1.5px solid var(--green)',
                color: 'var(--green-dark)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                fontWeight: 700
              }}
            >
              ✓
            </div>
            <h1 style={{ margin: 0, fontSize: 30, color: 'var(--text)' }}>Bem-vindo ao AutomatizaWPP</h1>
            <p className="ds-subtitle" style={{ marginTop: 0 }}>
              Sua conta está pronta
            </p>
            <p className="ds-subtitle" style={{ marginTop: 0 }}>
              Seu teste de 14 dias começou
            </p>
            <p className="ds-card" style={{ margin: 0, background: 'var(--green-light)', borderColor: 'var(--green)', color: 'var(--green-dark)', fontWeight: 700 }}>
              Restam {trialDaysRemaining} dias
            </p>
            <button type="button" className="ds-button ds-button-primary" onClick={() => setStep(2)}>
              Configurar meu bot →
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="onb-step" style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 28, color: 'var(--text)' }}>Personalize seu assistente</h1>

            <div>
              <label htmlFor="botName" className="ds-label">
                Nome do bot
              </label>
              <input id="botName" className="ds-input" value={botName} onChange={(event) => setBotName(event.target.value)} />
            </div>

            <div>
              <label htmlFor="welcomeMessage" className="ds-label">
                Mensagem de boas-vindas
              </label>
              <textarea
                id="welcomeMessage"
                className="ds-textarea"
                value={welcomeMessage}
                onChange={(event) => setWelcomeMessage(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="businessHours" className="ds-label">
                Horário de atendimento
              </label>
              <input id="businessHours" className="ds-input" value={businessHours} onChange={(event) => setBusinessHours(event.target.value)} />
            </div>

            {error ? (
              <p className="ds-card" style={{ margin: 0, padding: 8, borderColor: '#f0b3b3', background: '#fff5f5', color: '#a63b3b' }}>
                {error}
              </p>
            ) : null}

            <button type="button" className="ds-button ds-button-primary" onClick={saveBotConfig} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar e continuar →'}
            </button>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="onb-step" style={{ display: 'grid', gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 28, color: 'var(--text)' }}>Tudo pronto! Vamos ligar em menos de 24h para ativar seu WhatsApp</h1>
            <div className="ds-card" style={{ display: 'grid', gap: 8 }}>
              <div style={{ color: 'var(--green-dark)', fontWeight: 700 }}>✓ Conta criada</div>
              <div style={{ color: 'var(--green-dark)', fontWeight: 700 }}>✓ Bot configurado</div>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>→ Ligação de ativação (pendente)</div>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>→ WhatsApp conectado (pendente)</div>
            </div>

            <Link href="/dashboard" className="ds-button ds-button-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              Ir para meu dashboard →
            </Link>
          </section>
        ) : null}
      </div>

      <style jsx>{`
        .onb-step {
          animation: onboardingFade 220ms ease;
        }

        @keyframes onboardingFade {
          from {
            opacity: 0;
            transform: translateY(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
