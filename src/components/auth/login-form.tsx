'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/actions/auth-actions';
import { initialActionState } from '@/lib/actions/types';
import { SubmitButton } from '@/components/forms/submit-button';

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState(loginAction, initialActionState);

  return (
    <form action={action} style={{ display: 'grid', gap: 10 }}>
      <input type="hidden" name="callbackUrl" value={callbackUrl || '/dashboard'} />

      <div>
        <label htmlFor="email" className="ds-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="ds-input" placeholder="seu@empresa.com" />
        {state.fieldErrors?.email?.length ? <p className="ds-muted">{state.fieldErrors.email[0]}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="ds-label">
          Senha
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="ds-input" placeholder="********" />
        {state.fieldErrors?.password?.length ? <p className="ds-muted">{state.fieldErrors.password[0]}</p> : null}
      </div>

      {state.status !== 'idle' && state.message ? (
        <p className="ds-card" style={{ margin: 0, padding: 8, background: state.status === 'error' ? 'var(--bg)' : 'var(--green-light)', color: 'var(--text)' }}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Entrar" pendingLabel="Entrando..." className="ds-button ds-button-primary" />
    </form>
  );
}
