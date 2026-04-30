'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="ds-auth-wrap">
      <div className="ds-auth-card" style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Erro no sistema</h2>
        <p className="ds-subtitle" style={{ marginTop: 8 }}>
          {error.message || 'Não foi possível carregar esta página.'}
        </p>
        <button type="button" className="ds-button ds-button-primary" style={{ marginTop: 12 }} onClick={reset}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
