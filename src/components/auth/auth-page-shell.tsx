import Link from 'next/link';

type AuthPageShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthPageShell({ eyebrow, title, subtitle, children, footer }: AuthPageShellProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#111',
          border: '1px solid rgba(240,237,232,0.08)',
          borderRadius: 8,
          padding: 32,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
            textDecoration: 'none',
            color: '#f0ede8',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: 3,
              background: '#25D366',
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 16 }}>AutomatizaWPP</span>
        </Link>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            textTransform: 'uppercase',
            fontWeight: 600,
            color: 'rgba(240,237,232,0.6)',
            letterSpacing: '0.5px',
          }}
        >
          {eyebrow}
        </p>
        <h1 style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: '#f0ede8' }}>{title}</h1>
        <p style={{ marginTop: 6, fontSize: 14, color: 'rgba(240,237,232,0.7)' }}>{subtitle}</p>

        <div style={{ marginTop: 20 }}>{children}</div>

        {footer ? (
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid rgba(240,237,232,0.08)',
              fontSize: 13,
              color: '#f0ede8',
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
