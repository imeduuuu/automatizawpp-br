'use client';

import { useActionState } from 'react';
import { signupAction } from '@/lib/actions/auth-actions';
import { initialActionState } from '@/lib/actions/types';
import { SubmitButton } from '@/components/forms/submit-button';

export function SignupForm() {
  const [state, action] = useActionState(signupAction, initialActionState);

  return (
    <form action={action} style={{ display: 'grid', gap: 10 }}>
      <div>
        <label htmlFor="name" className="ds-label">
          Nome
        </label>
        <input id="name" name="name" type="text" autoComplete="name" required className="ds-input" placeholder="Nome completo" />
        {state.fieldErrors?.name?.length ? <p className="ds-muted">{state.fieldErrors.name[0]}</p> : null}
      </div>

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

      <SubmitButton label="Criar conta" pendingLabel="Criando..." className="ds-button ds-button-primary" />
    </form>
  );
}
