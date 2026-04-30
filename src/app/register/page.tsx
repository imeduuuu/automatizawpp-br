'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';

const sectorOptions = ['Restaurante', 'Clínica/Saúde', 'Salão de beleza', 'Imobiliária', 'E-commerce', 'Outro'] as const;

type RegisterPayload = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  sector: (typeof sectorOptions)[number];
  password: string;
  acceptRgpd: boolean;
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterPayload>({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    sector: 'Restaurante' as (typeof sectorOptions)[number],
    password: '',
    acceptRgpd: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!form.acceptRgpd) {
      setError('Você precisa aceitar a política de privacidade para continuar.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !data?.ok) {
        setError(data?.error || 'Não foi possível criar a conta agora.');
        return;
      }

      const loginResult = await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false
      });

      if (loginResult?.error) {
        window.location.href = '/login';
        return;
      }

      window.location.href = '/onboarding';
    } catch {
      setError('Erro ao enviar o formulário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ds-auth-wrap" style={{ padding: 24 }}>
      <div className="ds-auth-card" style={{ maxWidth: 480 }}>
        <Link href="/" className="ds-logo" style={{ marginBottom: 10 }}>
          <span className="ds-logo-mark" />
          <span className="ds-logo-text">AutomatizaWPP</span>
        </Link>

        <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>Comece seu teste gratuito de 14 dias</h1>
        <p className="ds-subtitle" style={{ marginTop: 6 }}>
          Sem cartão de crédito. Ativação em 48h.
        </p>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          <div>
            <label htmlFor="fullName" className="ds-label">
              Nome completo *
            </label>
            <input
              id="fullName"
              type="text"
              required
              className="ds-input"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="businessName" className="ds-label">
              Nome do negócio *
            </label>
            <input
              id="businessName"
              type="text"
              required
              className="ds-input"
              value={form.businessName}
              onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="email" className="ds-label">
              Email *
            </label>
            <input
              id="email"
              type="email"
              required
              className="ds-input"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="phone" className="ds-label">
              Telefone *
            </label>
            <input
              id="phone"
              type="tel"
              required
              className="ds-input"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="sector" className="ds-label">
              Setor
            </label>
            <select
              id="sector"
              className="ds-select"
              value={form.sector}
              onChange={(event) => setForm((current) => ({ ...current, sector: event.target.value as RegisterPayload['sector'] }))}
            >
              {sectorOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="password" className="ds-label">
              Senha *
            </label>
            <input
              id="password"
              type="password"
              minLength={8}
              required
              className="ds-input"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={form.acceptRgpd}
              onChange={(event) => setForm((current) => ({ ...current, acceptRgpd: event.target.checked }))}
              required
              style={{ marginTop: 2 }}
            />
            Aceito a política de privacidade e o tratamento dos meus dados para criar minha conta.
          </label>

          {error ? (
            <p
              className="ds-card"
              style={{
                margin: 0,
                padding: 8,
                borderColor: '#f0b3b3',
                background: '#fff5f5',
                color: '#a63b3b'
              }}
            >
              {error}
            </p>
          ) : null}

          <button type="submit" className="ds-button ds-button-primary" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar minha conta grátis →'}
          </button>
        </form>

        <p style={{ marginTop: 14, fontSize: 13 }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ fontWeight: 700, textDecoration: 'underline' }}>
            Entrar →
          </Link>
        </p>
      </div>
    </div>
  );
}
