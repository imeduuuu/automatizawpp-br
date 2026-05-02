'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Email ou senha incorretos.');
        setLoading(false);
        return;
      }

      setLoading(false);
      setTimeout(() => {
        window.location.href = callbackUrl || '/dashboard';
      }, 100);
    } catch (err) {
      console.error('[LoginForm]', err);
      setError('Erro ao entrar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>

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
      </div>

      {/* Error Message */}
      {error ? (
        <div style={errorMessageStyle}>
          <span>⚠️</span>
          {error}
        </div>
      ) : null}

      {/* Submit Button */}
      <button type="submit" style={submitButtonStyle} disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'} <span>→</span>
      </button>
    </form>
  );
}
