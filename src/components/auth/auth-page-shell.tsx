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
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            {/* WhatsApp Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.672 13.882c-.236-.119-1.404-.694-1.621-.773-.216-.079-.374-.119-.531.119-.158.237-.609.773-.746.93-.138.159-.275.178-.511.06-.237-.119-1.001-.369-1.906-1.177-.706-.628-1.183-1.404-1.321-1.642-.137-.237-.014-.365.103-.484.106-.104.237-.259.356-.389.119-.13.158-.219.237-.365.079-.146.04-.275-.04-.385-.078-.119-.531-1.282-.729-1.756-.191-.45-.386-.389-.531-.396-.137-.007-.295-.007-.453-.007-.158 0-.413.06-.63.295-.216.237-.826.807-.826 1.968 0 1.162.846 2.282.964 2.44.119.158 1.676 2.561 4.062 3.587 1.751.758 2.438.825 3.313.695.537-.08 1.642-.671 1.873-1.321.23-.649.23-1.204.159-1.321-.071-.119-.229-.178-.472-.297z" fill="#00FF41"/>
              <path d="M12 0C5.385 0 0 5.385 0 12c0 2.129.547 4.237 1.59 6.099L0 24l6.199-1.546C9.773 23.407 11.852 24 12 24c6.615 0 12-5.385 12-12S18.615 0 12 0zm0 21.975c-1.949 0-3.861-.523-5.543-1.513l-.397-.236-4.107 1.025 1.042-4.017-.259-.41C2.497 15.61 2 13.841 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="#00FF41"/>
            </svg>

            <span style={{ color: '#ffffff' }}>Automatiza</span>
            <span style={{ color: '#00FF41' }}>Wpp</span>
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
