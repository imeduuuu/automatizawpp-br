'use client';

import { useActionState, useState } from 'react';
import { loginAction } from '@/lib/actions/auth-actions';
import { initialActionState } from '@/lib/actions/types';
import { SubmitButton } from '@/components/forms/submit-button';

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#ffffff',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const inputWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 12px 12px 36px',
  background: 'rgba(0, 255, 65, 0.03)',
  border: '1px solid rgba(0, 255, 65, 0.3)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  boxSizing: 'border-box',
  transition: 'all 0.2s',
  outline: 'none',
};

const iconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '12px',
  fontSize: '16px',
  pointerEvents: 'none',
  color: '#00FF41',
};

const eyeIconStyle: React.CSSProperties = {
  position: 'absolute',
  right: '12px',
  fontSize: '16px',
  cursor: 'pointer',
  color: '#00FF41',
};

const errorStyle: React.CSSProperties = {
  margin: '6px 0 0 0',
  fontSize: '12px',
  color: '#FF4444',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const errorMessageStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  margin: '16px 0',
  padding: '10px 12px',
  background: 'rgba(255, 68, 68, 0.1)',
  border: '1px solid rgba(255, 68, 68, 0.3)',
  borderRadius: '8px',
  color: '#FF4444',
  fontSize: '12px',
};

const submitButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: '#00FF41',
  border: 'none',
  borderRadius: '8px',
  color: '#000000',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'all 0.2s',
  boxShadow: '0 0 20px rgba(0, 255, 65, 0.4)',
};

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState(loginAction, initialActionState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
      <input type="hidden" name="callbackUrl" value={callbackUrl || '/dashboard'} />

      {/* Email */}
      <div>
        <label htmlFor="email" style={labelStyle}>
          E-mail
        </label>
        <div style={inputWrapperStyle}>
          <span style={iconStyle}>✉️</span>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            style={inputStyle}
            placeholder="seu@empresa.com"
          />
        </div>
        {state.fieldErrors?.email?.length ? <p style={errorStyle}>{state.fieldErrors.email[0]}</p> : null}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" style={labelStyle}>
          Senha
        </label>
        <div style={inputWrapperStyle}>
          <span style={iconStyle}>🔒</span>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            style={inputStyle}
            placeholder="••••••••"
          />
          <span
            style={eyeIconStyle}
            onClick={() => setShowPassword(!showPassword)}
            role="button"
            tabIndex={0}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </span>
        </div>
        {state.fieldErrors?.password?.length ? <p style={errorStyle}>{state.fieldErrors.password[0]}</p> : null}
      </div>

      {/* Error Message */}
      {state.status !== 'idle' && state.message && state.status === 'error' ? (
        <div style={errorMessageStyle}>
          <span>⚠️</span>
          {state.message}
        </div>
      ) : null}

      {/* Submit Button */}
      <button type="submit" style={submitButtonStyle}>
        Entrar <span>→</span>
      </button>
    </form>
  );
}
