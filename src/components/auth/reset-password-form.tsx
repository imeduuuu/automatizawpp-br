'use client';

import { useActionState } from 'react';
import { resetPasswordAction } from '@/lib/actions/auth-actions';
import { initialActionState } from '@/lib/actions/types';
import { SubmitButton } from '@/components/forms/submit-button';

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initialActionState);

  return (
    <form action={action} style={{ display: 'grid', gap: 10 }}>
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="password" className="ds-label">
          Nova senha
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" required className="ds-input" placeholder="Mínimo 8 caracteres" />
        {state.fieldErrors?.password?.length ? <p className="ds-muted">{state.fieldErrors.password[0]}</p> : null}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="ds-label">
          Confirmar senha
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className="ds-input" placeholder="Repetir senha" />
        {state.fieldErrors?.confirmPassword?.length ? <p className="ds-muted">{state.fieldErrors.confirmPassword[0]}</p> : null}
      </div>

      {state.status !== 'idle' && state.message ? (
        <p className="ds-card" style={{ margin: 0, padding: 8, background: state.status === 'error' ? 'var(--bg)' : 'var(--green-light)', color: 'var(--text)' }}>
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Atualizar senha" pendingLabel="Atualizando..." className="ds-button ds-button-primary" />
    </form>
  );
}
