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
    <div className="ds-auth-wrap">
      <div className="ds-auth-card">
        <Link href="/" className="ds-logo" style={{ marginBottom: 10 }}>
          <span className="ds-logo-mark" />
          <span className="ds-logo-text">AutomatizaWPP</span>
        </Link>
        <p className="ds-muted" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
          {eyebrow}
        </p>
        <h1 style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{title}</h1>
        <p className="ds-subtitle" style={{ marginTop: 6 }}>
          {subtitle}
        </p>

        <div style={{ marginTop: 12 }}>{children}</div>

        {footer ? (
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1.5px solid var(--border)', fontSize: 13, color: 'var(--text)' }}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
