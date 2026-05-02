'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/actions/auth-actions';
import { initialActionState } from '@/lib/actions/types';
import { SubmitButton } from '@/components/forms/submit-button';

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
  color: '#f0ede8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#0d0d0d',
  border: '1px solid rgba(240,237,232,0.08)',
  borderRadius: 6,
  color: '#f0ede8',
  fontSize: 14,
  boxSizing: 'border-box',
};

const errorStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 12,
  color: '#ff6b6b',
};

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState(loginAction, initialActionState);

  return (
    <form action={action} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
      <input type="hidden" name="callbackUrl" value={callbackUrl || '/dashboard'} />

      <div>
        <label htmlFor="email" style={labelStyle}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          style={inputStyle}
          placeholder="seu@empresa.com"
        />
        {state.fieldErrors?.email?.length ? <p style={errorStyle}>{state.fieldErrors.email[0]}</p> : null}
      </div>

      <div>
        <label htmlFor="password" style={labelStyle}>
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          style={inputStyle}
          placeholder="********"
        />
        {state.fieldErrors?.password?.length ? <p style={errorStyle}>{state.fieldErrors.password[0]}</p> : null}
      </div>

      {state.status !== 'idle' && state.message ? (
        <p
          style={{
            margin: 0,
            padding: 8,
            background: state.status === 'error' ? 'rgba(255,107,107,0.1)' : 'rgba(37,211,102,0.1)',
            border: `1px solid ${state.status === 'error' ? 'rgba(255,107,107,0.3)' : 'rgba(37,211,102,0.3)'}`,
            borderRadius: 6,
            color: '#f0ede8',
            fontSize: 13,
          }}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Entrar" pendingLabel="Entrando..." />
    </form>
  );
}
