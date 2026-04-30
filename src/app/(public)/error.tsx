'use client';

export default function PublicError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
        Algo deu errado
      </h2>
      <p style={{ color: '#888', marginBottom: '2rem', maxWidth: '400px' }}>
        {error.message || 'Erro inesperado. Tente recarregar a página.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '0.75rem 1.75rem',
          background: '#25D366',
          color: '#000',
          fontWeight: 700,
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.95rem',
        }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
