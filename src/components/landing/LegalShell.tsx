import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * Estructura común para las páginas legales en español (privacidad, términos,
 * cookies). Usa el sistema de estilos .lp-* del grupo de rutas (home), así que
 * hereda el tema navy. Sin escena WebGL (las legales no la necesitan).
 */
export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <header className="lp-header">
        <Link href="/" className="lp-logo">
          <span className="lp-dot" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8z" />
            </svg>
          </span>
          AutomatizaWPP
        </Link>
        <Link href="/" className="lp-btn lp-btn-ghost lp-btn-sm">← Volver al inicio</Link>
      </header>

      <main className="lp-content">
        <section className="lp-section">
          <div className="lp-container lp-legal">
            <div className="lp-eyebrow">Legal</div>
            <h1 className="lp-h2" style={{ margin: '1.1rem 0 0.4rem' }}>{title}</h1>
            <p className="lp-legal-updated">Última actualización: {updated}</p>
            {children}
          </div>
        </section>

        <footer className="lp-footer">
          <div className="lp-container lp-footer-grid">
            <Link href="/" className="lp-logo">
              <span className="lp-dot" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8z" />
                </svg>
              </span>
              AutomatizaWPP
            </Link>
            <p>© {new Date().getFullYear()} AutomatizaWPP · IA para WhatsApp · España</p>
            <div className="lp-footer-links">
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos</Link>
              <Link href="/cookies">Cookies</Link>
              <Link href="/login">Entrar</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
