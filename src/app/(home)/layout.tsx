import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'AutomatizaWPP — Vende más, atiende mejor y crece en automático',
  description:
    'Automatiza tu WhatsApp con IA para responder 24/7, cualificar leads y cerrar más ventas sin ampliar tu equipo. Diagnóstico gratuito y prueba de 15 días.',
  keywords:
    'automatización WhatsApp, IA WhatsApp, chatbot IA, cualificar leads, ventas automáticas, atención 24h, WhatsApp Business España',
  metadataBase: new URL('https://www.automatizawpp.com'),
  alternates: { canonical: 'https://www.automatizawpp.com' },
  openGraph: {
    title: 'AutomatizaWPP — Vende más, atiende mejor y crece en automático',
    description:
      'IA dentro de tu WhatsApp: responde 24/7, cualifica leads y cierra más ventas sin ampliar tu equipo.',
    type: 'website',
    url: 'https://www.automatizawpp.com',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutomatizaWPP — Vende más, atiende mejor y crece en automático',
    description:
      'IA dentro de tu WhatsApp: responde 24/7, cualifica leads y cierra más ventas sin ampliar tu equipo.',
  },
  robots: 'index, follow, max-snippet:-1, max-image-preview:large',
};

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div lang="es" className="lp-root">
      {/* Fuentes */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'AutomatizaWPP',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description:
              'Plataforma de automatización de WhatsApp con IA para empresas en España. Responde 24/7, cualifica leads y cierra más ventas.',
            url: 'https://www.automatizawpp.com',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', description: 'Diagnóstico gratuito + prueba de 15 días' },
          }),
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: LP_CSS }} />
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Estilos de la landing. Todo bajo .lp-root para no contaminar el resto del
 * sitio. Mientras esta ruta está montada, neutralizamos el tema verde global.
 * ────────────────────────────────────────────────────────────────────────── */
const LP_CSS = `
/* Neutraliza el tema global (verde) solo en esta ruta */
body { background: #07111F !important; }
body::before, body::after { display: none !important; }

.lp-root {
  --navy: #07111F;
  --navy-2: #0a1830;
  --blue: #38BDF8;
  --blue-soft: rgba(56, 189, 248, 0.14);
  --blue-line: rgba(56, 189, 248, 0.22);
  --text: #f4f8ff;
  --text-soft: #9fb2cc;
  --glass: rgba(15, 28, 50, 0.45);
  --glass-border: rgba(120, 170, 230, 0.16);
  --font: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Space Grotesk', 'Inter', system-ui, sans-serif;

  color: var(--text);
  font-family: var(--font);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: relative;
}
.lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; }
.lp-root ::selection { background: rgba(56, 189, 248, 0.3); color: #fff; }

/* ── Lienzo WebGL de fondo (fijo, detrás de todo) ── */
.lp-webgl {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  /* Fallback si WebGL no inicia */
  background:
    radial-gradient(120% 80% at 50% 12%, rgba(56,189,248,0.10), transparent 55%),
    linear-gradient(180deg, #07111F 0%, #0a1830 60%, #07111F 100%);
}
.lp-webgl canvas { display: block; }

/* Velo para legibilidad sobre la escena (refuerza contraste WCAG) */
.lp-scene-veil {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(7,17,31,0.55) 0%, transparent 18%, transparent 66%, rgba(7,17,31,0.62) 100%),
    radial-gradient(120% 95% at 50% 45%, transparent 22%, rgba(7,17,31,0.5) 68%, rgba(7,17,31,0.82) 100%);
}

.lp-content { position: relative; z-index: 2; }
.lp-container { max-width: 1180px; margin: 0 auto; padding: 0 1.5rem; }

/* ── Header ── */
.lp-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  height: 70px; padding: 0 1.8rem;
  background: rgba(7, 17, 31, 0.55);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--glass-border);
}
.lp-logo { display: flex; align-items: center; gap: 0.55rem; font-family: var(--font-display); font-weight: 700; font-size: 1.18rem; color: var(--text); text-decoration: none; letter-spacing: -0.02em; }
.lp-logo .lp-dot { width: 26px; height: 26px; border-radius: 7px; background: linear-gradient(135deg, var(--blue), #0a6fb0); display: grid; place-items: center; box-shadow: 0 0 18px rgba(56,189,248,0.45); }
.lp-logo .lp-dot svg { width: 15px; height: 15px; }
.lp-nav { display: flex; align-items: center; gap: 0.3rem; }
.lp-nav a { color: var(--text-soft); text-decoration: none; font-size: 0.9rem; font-weight: 500; padding: 0.5rem 0.85rem; border-radius: 8px; transition: color .2s, background .2s; }
.lp-nav a:hover { color: var(--text); background: rgba(56,189,248,0.08); }

/* ── Hamburguesa + menú móvil ── */
.lp-burger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; margin-left: 0.4rem; }
.lp-burger span { display: block; width: 23px; height: 2px; background: var(--text); border-radius: 2px; transition: transform .3s, opacity .3s; }
.lp-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.lp-burger.open span:nth-child(2) { opacity: 0; }
.lp-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
.lp-mobile {
  position: fixed; top: 70px; left: 0; right: 0; z-index: 49;
  display: flex; flex-direction: column; gap: 0.2rem;
  padding: 1.1rem 1.5rem 1.4rem;
  background: rgba(7, 17, 31, 0.97);
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--glass-border);
  transform: translateY(-12px); opacity: 0; pointer-events: none;
  transition: transform .25s ease, opacity .25s ease;
}
.lp-mobile.open { transform: none; opacity: 1; pointer-events: auto; }
.lp-mobile a { color: var(--text); text-decoration: none; font-size: 1rem; font-weight: 500; padding: 0.85rem 0.3rem; border-bottom: 1px solid var(--glass-border); }
.lp-mobile a:hover { color: var(--blue); }
.lp-mobile .lp-btn { margin-top: 0.8rem; justify-content: center; border-bottom: none; }

/* ── Botones ── */
.lp-btn { display: inline-flex; align-items: center; gap: 0.55rem; padding: 0.85rem 1.6rem; border-radius: 10px; font-weight: 600; font-size: 0.95rem; text-decoration: none; cursor: pointer; border: none; transition: transform .2s, box-shadow .3s, background .2s; }
.lp-btn-primary { background: linear-gradient(135deg, #38BDF8, #0ea5e9); color: #04101f; box-shadow: 0 0 0 rgba(56,189,248,0); }
.lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 38px rgba(56,189,248,0.45); }
.lp-btn-ghost { background: rgba(255,255,255,0.04); color: var(--text); border: 1px solid var(--glass-border); }
.lp-btn-ghost:hover { transform: translateY(-2px); border-color: var(--blue); box-shadow: 0 0 24px rgba(56,189,248,0.18); }
.lp-btn-sm { padding: 0.6rem 1.1rem; font-size: 0.88rem; }

/* ── Accesibilidad: foco de teclado visible ── */
.lp-root a:focus-visible,
.lp-root button:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 3px;
  border-radius: 8px;
}

/* ── Tipografía de secciones ── */
.lp-eyebrow { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.76rem; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--blue); padding: 0.4rem 0.9rem; border: 1px solid var(--blue-line); border-radius: 99px; background: var(--blue-soft); }
.lp-h1 { font-family: var(--font-display); font-weight: 700; font-size: clamp(2.4rem, 6vw, 4.6rem); line-height: 1.05; letter-spacing: -0.03em; }
.lp-h2 { font-family: var(--font-display); font-weight: 700; font-size: clamp(1.9rem, 4vw, 3rem); line-height: 1.1; letter-spacing: -0.025em; }
.lp-grad { background: linear-gradient(120deg, #7dd3fc, #38BDF8 55%, #0ea5e9); -webkit-background-clip: text; background-clip: text; color: transparent; }
.lp-lead { color: var(--text-soft); font-size: clamp(1rem, 1.6vw, 1.18rem); line-height: 1.7; }

.lp-section { position: relative; padding: 6rem 0; }
.lp-section-head { max-width: 720px; margin: 0 auto 3rem; text-align: center; }
.lp-section-head .lp-h2 { margin: 1.1rem 0 0.9rem; }

/* ── Glass cards ── */
.lp-glass { background: var(--glass); border: 1px solid var(--glass-border); border-radius: 18px; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); transition: transform .35s cubic-bezier(.2,.7,.2,1), border-color .3s, box-shadow .3s; }
.lp-glass:hover { transform: translateY(-6px); border-color: rgba(56,189,248,0.4); box-shadow: 0 18px 60px rgba(3,12,28,0.55), 0 0 30px rgba(56,189,248,0.1); }

/* Hero */
.lp-hero { min-height: 100vh; display: flex; align-items: center; padding: 9rem 0 5rem; }
.lp-hero-inner { max-width: 880px; }
.lp-hero .lp-h1 { margin: 1.6rem 0; text-shadow: 0 2px 30px rgba(3,10,22,0.55); }
.lp-hero-sub { max-width: 620px; margin-bottom: 2.4rem; color: #b8c6dc; text-shadow: 0 1px 18px rgba(3,10,22,0.6); }
.lp-hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
.lp-proof { display: flex; flex-wrap: wrap; gap: 1.8rem; margin-top: 3rem; color: var(--text-soft); font-size: 0.92rem; }
.lp-proof span { display: inline-flex; align-items: center; gap: 0.5rem; }
.lp-proof b { color: var(--text); font-weight: 600; }
.lp-proof .lp-tick { color: var(--blue); }

/* Problem cards */
.lp-problem-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.1rem; }
.lp-problem { padding: 1.6rem; border-radius: 14px; background: rgba(15,28,50,0.4); border: 1px solid var(--glass-border); display: flex; gap: 0.9rem; align-items: flex-start; }
.lp-problem .lp-x { flex-shrink: 0; width: 26px; height: 26px; border-radius: 8px; background: rgba(248,113,113,0.12); color: #fca5a5; display: grid; place-items: center; font-size: 0.85rem; }
.lp-problem p { color: var(--text-soft); font-size: 0.95rem; }

/* Solution cards */
.lp-sol-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.lp-sol { padding: 2.2rem; }
.lp-sol .lp-icon { width: 52px; height: 52px; border-radius: 13px; background: var(--blue-soft); border: 1px solid var(--blue-line); display: grid; place-items: center; margin-bottom: 1.3rem; color: var(--blue); }
.lp-sol h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 600; margin-bottom: 0.6rem; }
.lp-sol p { color: var(--text-soft); font-size: 0.95rem; }

/* Dashboard mockup */
.lp-dash { padding: 1.2rem; border-radius: 20px; }
.lp-dash-bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.7rem 0.9rem; border-bottom: 1px solid var(--glass-border); margin-bottom: 1rem; }
.lp-dash-bar i { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
.lp-dash-title { margin-left: 0.6rem; font-size: 0.8rem; color: var(--text-soft); font-family: var(--font-display); }
.lp-dash-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 0.9rem; }
.lp-tile { background: rgba(9,20,38,0.6); border: 1px solid var(--glass-border); border-radius: 14px; padding: 1.1rem; }
.lp-tile h4 { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-soft); margin-bottom: 0.8rem; font-weight: 600; }
.lp-chat { display: flex; flex-direction: column; gap: 0.55rem; }
.lp-msg { max-width: 82%; padding: 0.55rem 0.8rem; border-radius: 12px; font-size: 0.82rem; line-height: 1.45; }
.lp-msg.in { align-self: flex-start; background: rgba(255,255,255,0.06); border-bottom-left-radius: 4px; }
.lp-msg.out { align-self: flex-end; background: linear-gradient(135deg, rgba(56,189,248,0.9), rgba(14,165,233,0.9)); color: #04101f; border-bottom-right-radius: 4px; }
.lp-score { display: flex; align-items: baseline; gap: 0.3rem; }
.lp-score .v { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--blue); }
.lp-bar { height: 6px; border-radius: 99px; background: rgba(255,255,255,0.08); overflow: hidden; margin-top: 0.7rem; }
.lp-bar i { display: block; height: 100%; background: linear-gradient(90deg, #38BDF8, #0ea5e9); border-radius: 99px; }
.lp-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.84rem; padding: 0.4rem 0; color: var(--text-soft); }
.lp-row b { color: var(--text); font-weight: 600; }
.lp-pill { font-size: 0.7rem; padding: 0.15rem 0.6rem; border-radius: 99px; background: var(--blue-soft); color: var(--blue); border: 1px solid var(--blue-line); }
.lp-pill.warm { background: rgba(250,204,21,0.12); color: #fde047; border-color: rgba(250,204,21,0.25); }
.lp-handoff { margin-top: 0.9rem; width: 100%; justify-content: center; }

/* Process steps */
.lp-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.1rem; counter-reset: step; }
.lp-step { padding: 1.7rem 1.4rem; border-radius: 14px; background: rgba(15,28,50,0.4); border: 1px solid var(--glass-border); position: relative; }
.lp-step .n { font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; color: var(--blue); opacity: 0.85; }
.lp-step h4 { font-size: 1rem; margin: 0.6rem 0 0.4rem; font-weight: 600; }
.lp-step p { color: var(--text-soft); font-size: 0.88rem; }

/* Results counters */
.lp-results { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; text-align: center; }
.lp-result .v { font-family: var(--font-display); font-size: clamp(2.4rem, 5vw, 3.4rem); font-weight: 700; line-height: 1; color: var(--text); }
.lp-result .v .lp-grad { font-family: inherit; }
.lp-result p { color: var(--text-soft); font-size: 0.92rem; margin-top: 0.6rem; }

/* Use cases */
.lp-uses { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.3rem; }
.lp-use { padding: 1.8rem; }
.lp-use .lp-icon { width: 46px; height: 46px; border-radius: 12px; background: var(--blue-soft); border: 1px solid var(--blue-line); display: grid; place-items: center; margin-bottom: 1rem; color: var(--blue); }
.lp-use h4 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 600; margin-bottom: 0.4rem; }
.lp-use p { color: var(--text-soft); font-size: 0.9rem; }

/* Trust */
.lp-trust { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
.lp-trust-flow { display: flex; flex-direction: column; gap: 0.8rem; }
.lp-flow-node { display: flex; align-items: center; gap: 0.9rem; padding: 1rem 1.2rem; border-radius: 12px; background: rgba(15,28,50,0.45); border: 1px solid var(--glass-border); font-size: 0.92rem; }
.lp-flow-node .ic { width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; flex-shrink: 0; }
.lp-flow-node.ai .ic { background: var(--blue-soft); color: var(--blue); border: 1px solid var(--blue-line); }
.lp-flow-node.human .ic { background: rgba(167,139,250,0.14); color: #c4b5fd; border: 1px solid rgba(167,139,250,0.25); }
.lp-flow-arrow { text-align: center; color: var(--blue); opacity: 0.6; }

/* Final CTA */
.lp-finalcta { text-align: center; padding: 5rem 2.5rem; border-radius: 26px; overflow: hidden; position: relative; }
.lp-finalcta::before { content: ''; position: absolute; inset: 0; background: radial-gradient(80% 120% at 50% 0%, rgba(56,189,248,0.18), transparent 60%); pointer-events: none; }
.lp-finalcta .lp-h2 { margin: 1rem auto; max-width: 720px; }
.lp-finalcta .lp-lead { max-width: 560px; margin: 0 auto 2.2rem; }

/* Footer */
.lp-footer { border-top: 1px solid var(--glass-border); padding: 3.5rem 0 2.5rem; margin-top: 2rem; }
.lp-footer-grid { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 2rem; align-items: center; }
.lp-footer p { color: var(--text-soft); font-size: 0.85rem; }
.lp-footer-links { display: flex; gap: 1.4rem; }
.lp-footer-links a { color: var(--text-soft); font-size: 0.85rem; text-decoration: none; transition: color .2s; }
.lp-footer-links a:hover { color: var(--blue); }

/* ── Reveal on scroll ── */
.lp-reveal { opacity: 0; transform: translateY(34px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); }
.lp-reveal.in { opacity: 1; transform: none; }

/* ── Responsive ── */
@media (max-width: 920px) {
  .lp-sol-grid, .lp-uses { grid-template-columns: 1fr 1fr; }
  .lp-dash-grid { grid-template-columns: 1fr 1fr; }
  .lp-results { grid-template-columns: 1fr 1fr; }
  .lp-trust { grid-template-columns: 1fr; gap: 2rem; }
}
@media (max-width: 680px) {
  .lp-nav { display: none; }
  .lp-header-cta { display: none; }
  .lp-burger { display: flex; }
  .lp-section { padding: 5rem 0; }
  .lp-sol-grid, .lp-uses, .lp-dash-grid { grid-template-columns: 1fr; }
  .lp-results { grid-template-columns: 1fr 1fr; }
  .lp-hero-actions { flex-direction: column; align-items: stretch; }
  .lp-btn { justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .lp-reveal { opacity: 1; transform: none; transition: none; }
}
`;
