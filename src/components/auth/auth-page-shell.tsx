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
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at 50% 0%, rgba(0, 255, 65, 0.08), transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '380px',
        }}
      >
        {/* Card */}
        <div
          style={{
            background: 'rgba(0, 20, 10, 0.6)',
            border: '1px solid rgba(0, 255, 65, 0.3)',
            borderRadius: '16px',
            padding: '40px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 30px rgba(0, 255, 65, 0.1)',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
              textDecoration: 'none',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: '20px' }}>😊</span>
            <span>AutomatizaWPP</span>
          </Link>

          {/* Separator */}
          <div
            style={{
              height: '2px',
              width: '40px',
              background: '#00FF41',
              marginBottom: '24px',
              borderRadius: '1px',
            }}
          />

          {/* Title & subtitle */}
          <h1
            style={{
              margin: '0 0 12px 0',
              fontSize: '32px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: '0 0 28px 0',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: '1.5',
            }}
          >
            {subtitle}
          </p>

          {/* Form */}
          <div style={{ marginBottom: '24px' }}>{children}</div>

          {/* Footer */}
          {footer ? (
            <div
              style={{
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(0, 255, 65, 0.2)',
                fontSize: '13px',
                color: '#ffffff',
              }}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
