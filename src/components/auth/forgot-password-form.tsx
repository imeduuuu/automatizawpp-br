'use client';

import { useActionState } from 'react';
import { forgotPasswordAction } from '@/lib/actions/auth-actions';
import { initialActionState } from '@/lib/actions/types';
import { SubmitButton } from '@/components/forms/submit-button';

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initialActionState);

  return (
    <form action={action} style={{ display: 'grid', gap: 10 }}>
      <div>
        <label htmlFor="email" className="ds-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="ds-input" placeholder="voce@empresa.com" />
        {state.fieldErrors?.email?.length ? <p className="ds-muted">{state.fieldErrors.email[0]}</p> : null}
      </div>

      {state.status !== 'idle' && state.message ? (
        <p className="ds-card" style={{ margin: 0, padding: 8, background: state.status === 'error' ? 'var(--bg)' : 'var(--green-light)', color: 'var(--text)' }}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Enviar link" pendingLabel="Enviando..." className="ds-button ds-button-primary" />
    </form>
  );
}
