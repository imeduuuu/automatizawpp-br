import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { CookieBanner } from '@/components/CookieBanner';

// Metadados SEO para todas as páginas públicas de marketing
export const metadata: Metadata = {
  title: 'AutomatizaWPP — Automação WhatsApp com IA para Vendas',
  description: 'Plataforma de automação WhatsApp com IA para negócios brasileiros. Qualifique leads, atenda 24h e feche mais vendas — sem aumentar equipe.',
  keywords: 'automação WhatsApp, chatbot WhatsApp, bot IA, automação vendas, automação atendimento',
  metadataBase: new URL('https://www.automatizawpp.com'),
  openGraph: {
    title: 'AutomatizaWPP — Automação WhatsApp com IA para Vendas',
    description: 'Plataforma de automação WhatsApp com IA para negócios brasileiros. Qualifique leads, atenda 24h e feche mais vendas.',
    type: 'website',
    url: 'https://www.automatizawpp.com',
    images: [
      {
        url: 'https://www.automatizawpp.com/og-image-1200x630.jpg',
        width: 1200,
        height: 630,
        alt: 'AutomatizaWPP',
      },
    ],
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutomatizaWPP — Automação WhatsApp com IA para Vendas',
    description: 'Plataforma de automação WhatsApp com IA para negócios brasileiros. Qualifique leads, atenda 24h e feche mais vendas.',
    images: ['https://www.automatizawpp.com/og-image-1200x630.jpg'],
  },
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  alternates: {
    canonical: 'https://www.automatizawpp.com',
    languages: {
      'pt-BR': 'https://www.automatizawpp.com',
      'x-default': 'https://www.automatizawpp.com',
    },
  },
  verification: {
    google: 'hIaQ7EFhJG96-UfmQwP81-AeOSDNZiA4ys6BLGnstWI',
  },
};

/**
 * Layout público de marketing.
 *
 * IMPORTANTE: As tags <html> e <body> foram REMOVIDAS deste arquivo.
 * O root layout (src/app/layout.tsx) já fornece o wrapper HTML completo.
 * Este layout apenas adiciona estilos, header, footer e scripts de interação
 * específicos das páginas públicas, dentro do <body> do root layout.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* ─── Fontes do Google (preconnect + stylesheet) ─── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      {/* ─── Schema.org JSON-LD (organização) ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'AutomatizaWPP',
            url: 'https://www.automatizawpp.com',
            logo: 'https://www.automatizawpp.com/logo.png',
            description: 'Plataforma de automação WhatsApp com IA para aumentar vendas',
            sameAs: [
              'https://www.instagram.com/automatizawpp',
              'https://www.linkedin.com/company/automatizawpp',
              'https://www.youtube.com/@automatizawpp',
            ],
            address: { '@type': 'PostalAddress', addressCountry: 'BR' },
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Sales',
              email: 'inbox@automatizawpp.com',
            },
          }),
        }}
      />


      {/* ─── Schema.org JSON-LD (SoftwareApplication) ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'AutomatizaWPP',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, iOS, Android',
            description: 'Plataforma de automação WhatsApp com IA. Qualifique leads, atenda 24h e feche mais vendas — sem aumentar equipe.',
            url: 'https://www.automatizawpp.com',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'BRL',
              description: '7 dias grátis, sem cartão de crédito',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '47',
              bestRating: '5',
              worstRating: '1',
            },
            featureList: [
              'Atendimento automático 24/7 com IA',
              'Qualificação automática de leads',
              'Integração WhatsApp Business API',
              'CRM integrado',
              'Relatórios em tempo real',
              'Follow-up automático',
            ],
          }),
        }}
      />

      {/* ─── Schema.org JSON-LD (FAQPage) ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Como funciona a automação WhatsApp com IA?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'A IA recebe as mensagens dos seus clientes 24h, responde dúvidas frequentes, qualifica o interesse de compra e só passa para um humano os leads prontos. Tudo integrado ao WhatsApp Business API.',
                },
              },
              {
                '@type': 'Question',
                name: 'Preciso ter WhatsApp Business para usar?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Sim. A AutomatizaWPP usa a API oficial do WhatsApp Business, que é gratuita. Nós ajudamos no processo de cadastro e verificação junto à Meta.',
                },
              },
              {
                '@type': 'Question',
                name: 'Quanto custa o plano mensal?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Oferecemos 7 dias grátis sem cartão de crédito. Depois, planos a partir de R$ 197/mês conforme o volume de conversas. Consulte planos atualizados em /pricing.',
                },
              },
              {
                '@type': 'Question',
                name: 'Quanto tempo demora para implementar?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Em média 7 dias do cadastro à automação ativa, incluindo aprovação Meta, configuração de fluxos e treinamento da IA com seus dados.',
                },
              },
              {
                '@type': 'Question',
                name: 'A IA realmente entende português brasileiro?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Sim. Usamos modelos de linguagem treinados especificamente em conversas brasileiras, incluindo gírias, regionalismos e expressões comerciais comuns no Brasil.',
                },
              },
              {
                '@type': 'Question',
                name: 'Posso cancelar a qualquer momento?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Sim. Sem fidelidade, sem multa. Você cancela direto no painel quando quiser e exporta todos os seus dados.',
                },
              },
            ],
          }),
        }}
      />

      {/* ─── Design tokens e estilos globais das páginas públicas ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── DESIGN TOKENS ─── */
        :root {
          --bg: #000000;
          --neon: #00FF41;
          --neon-soft: #00CC33;
          --neon-glow: rgba(0, 255, 65, 0.5);
          --text: #FFFFFF;
          --text-soft: #B0B0B0;
          --border: rgba(0, 255, 65, 0.2);
          --card-bg: rgba(0, 255, 65, 0.03);

          /* aliases legados para compatibilidade com páginas existentes */
          --accent: var(--neon);
          --accent-dim: rgba(0, 255, 65, 0.12);
          --accent-glow: var(--neon-glow);
          --muted: var(--text-soft);
          --surface: #080808;
          --surface2: #0d0d0d;
          --font-body: 'Inter', system-ui, sans-serif;
          --font-display: 'Inter', system-ui, sans-serif;
          --font-mono: 'JetBrains Mono', 'Courier New', monospace;
        }

        /* ─── RESET ─── */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, 'Helvetica Neue', sans-serif;
          overflow-x: hidden;
          cursor: default;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          line-height: 1.6;
        }

        /* ─── GRID OVERLAY ─── */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 0;
          pointer-events: none;
        }

        /* ─── RADIAL GLOW ─── */
        body::after {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at 50% 0%, rgba(0, 255, 65, 0.08), transparent 60%);
          z-index: 0;
          pointer-events: none;
        }

        /* ─── SCROLL PROGRESS ─── */
        .scroll-progress {
          position: fixed;
          top: 0;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--neon), var(--neon-soft));
          z-index: 9999;
          width: 0%;
          transition: width 0.1s linear;
          box-shadow: 0 0 8px var(--neon-glow);
        }

        /* ─── HEADER ─── */
        header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 0 2rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          transition: background 0.3s, border-color 0.3s;
        }
        header.scrolled {
          background: rgba(0, 0, 0, 0.97);
          border-bottom-color: rgba(0, 255, 65, 0.3);
        }

        /* ─── LOGO ─── */
        .logo {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--text);
          text-decoration: none;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 0;
        }
        .logo strong {
          color: var(--neon);
          font-weight: 800;
        }

        /* ─── NAV ─── */
        nav {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        nav a {
          color: var(--text-soft);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.5rem 0.9rem;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
        }
        nav a:hover {
          color: var(--neon);
          background: rgba(0, 255, 65, 0.06);
        }

        /* ─── CTA HEADER ─── */
        .cta-header {
          padding: 0.5rem 1.25rem;
          background: var(--neon);
          color: #000 !important;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.2s;
          margin-left: 0.5rem;
        }
        .cta-header:hover {
          box-shadow: 0 0 24px var(--neon-glow);
          transform: translateY(-1px);
          background: var(--neon) !important;
          color: #000 !important;
        }

        /* ─── HAMBURGER ─── */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 6px;
          background: none;
          border: none;
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--neon);
          border-radius: 2px;
          transition: all 0.3s;
        }
        .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ─── MOBILE MENU ─── */
        .mobile-menu {
          display: none;
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.98);
          border-bottom: 1px solid var(--border);
          padding: 1.5rem 2rem;
          z-index: 999;
          flex-direction: column;
          gap: 0.25rem;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          color: var(--text-soft);
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
          padding: 0.7rem 0;
          border-bottom: 1px solid var(--border);
          transition: color 0.2s;
        }
        .mobile-menu a:hover { color: var(--neon); }
        .mobile-menu a:last-child { border-bottom: none; }
        .mobile-menu .mobile-cta {
          margin-top: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: var(--neon);
          color: #000 !important;
          text-align: center;
          border-radius: 6px;
          font-weight: 700;
          border: none;
        }

        /* ─── HERO ─── */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 6rem 0;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80vw;
          height: 80vh;
          background: radial-gradient(ellipse, rgba(0, 255, 65, 0.06) 0%, transparent 65%);
          pointer-events: none;
        }
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          border: 1px solid var(--border);
          border-radius: 99px;
          color: var(--neon);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          background: var(--card-bg);
        }
        .hero h1 {
          font-size: clamp(2.4rem, 5.5vw, 4.2rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.04em;
          margin-bottom: 1.5rem;
        }
        .highlight { color: var(--neon); }
        .typewriter {
          border-right: 2px solid var(--neon);
          white-space: nowrap;
          overflow: hidden;
          animation: typewriter 3s steps(30) 1s both, blink-caret 0.8s step-end infinite;
          display: inline-block;
          max-width: 100%;
        }
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes blink-caret {
          50% { border-color: transparent; }
        }

        /* ─── BUTTONS ─── */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.85rem 2rem;
          background: var(--neon);
          color: #000;
          font-weight: 700;
          font-size: 0.95rem;
          border-radius: 8px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .btn-primary:hover {
          box-shadow: 0 0 32px var(--neon-glow);
          transform: translateY(-2px);
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.85rem 2rem;
          background: transparent;
          color: var(--neon);
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 8px;
          text-decoration: none;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .btn-secondary:hover {
          background: rgba(0, 255, 65, 0.08);
          border-color: var(--neon);
          box-shadow: 0 0 16px rgba(0, 255, 65, 0.2);
        }

        /* aliases legados de btn */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.75rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
        }
        .btn-outline {
          background: transparent;
          color: var(--neon);
          border: 1px solid var(--border);
        }
        .btn-outline:hover {
          background: rgba(0, 255, 65, 0.08);
          border-color: var(--neon);
          box-shadow: 0 0 16px rgba(0, 255, 65, 0.2);
        }

        /* ─── SECTIONS ─── */
        section { padding: 6rem 0; position: relative; z-index: 1; }
        .section { padding: 6rem 0; }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }
        .section-tag {
          display: inline-block;
          padding: 0.35rem 1rem;
          border: 1px solid var(--border);
          border-radius: 99px;
          color: var(--neon);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 1.25rem;
          background: var(--card-bg);
        }
        .section-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.03em;
          margin-bottom: 1rem;
        }
        .section-sub {
          color: var(--text-soft);
          font-size: 1.1rem;
          max-width: 600px;
          line-height: 1.7;
        }

        /* ─── SERVICES GRID ─── */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .service-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .service-card:hover {
          border-color: rgba(0, 255, 65, 0.5);
          box-shadow: 0 0 32px rgba(0, 255, 65, 0.08);
          transform: translateY(-3px);
        }
        .service-icon {
          width: 48px;
          height: 48px;
          background: rgba(0, 255, 65, 0.1);
          border: 1px solid var(--border);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          margin-bottom: 1rem;
        }

        /* ─── STATS ─── */
        .stats { padding: 4rem 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: rgba(0,255,65,0.01); }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          text-align: center;
        }
        .stat-item {}
        .stat-num {
          font-size: 2.75rem;
          font-weight: 800;
          color: var(--neon);
          line-height: 1;
          letter-spacing: -0.03em;
        }
        .stat-label { color: var(--text-soft); font-size: 0.875rem; margin-top: 0.4rem; }

        /* ─── TESTIMONIALS ─── */
        .testimonials-track {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .testimonial {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }
        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 255, 65, 0.15);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }

        /* ─── COMPANIES ─── */
        .companies-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          justify-content: center;
          align-items: center;
        }
        .company-logo {
          padding: 1rem 2rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-soft);
          font-size: 0.85rem;
          font-weight: 600;
          background: var(--card-bg);
        }

        /* ─── CTA SECTION ─── */
        .cta-section {
          padding: 6rem 0;
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        .cta-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, rgba(0, 255, 65, 0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-form {
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* ─── FOOTER ─── */
        footer {
          background: #030303;
          border-top: 1px solid var(--border);
          padding: 5rem 2rem 2.5rem;
          position: relative;
          z-index: 1;
        }
        .footer-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }
        .footer-brand {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 0.75rem;
        }
        .footer-brand strong { color: var(--neon); }
        .footer-col h4 {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 1.25rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 0.7rem; }
        .footer-col ul a {
          color: var(--text-soft);
          font-size: 0.875rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-col ul a:hover { color: var(--neon); }
        .footer-bottom {
          max-width: 1100px;
          margin: 0 auto;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .footer-bottom p { color: var(--text-soft); font-size: 0.8rem; }
        .footer-bottom-links { display: flex; gap: 1.5rem; }
        .footer-bottom-links a { color: var(--text-soft); font-size: 0.8rem; text-decoration: none; transition: color 0.2s; }
        .footer-bottom-links a:hover { color: var(--neon); }

        /* ─── REVEAL ANIMATION ─── */
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ─── UTILITIES ─── */
        .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
        .page-wrap { padding-top: 64px; position: relative; z-index: 1; }
        .text-accent { color: var(--neon); }
        .text-muted { color: var(--text-soft); }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border), transparent);
          margin: 0;
          position: relative;
          z-index: 1;
        }

        /* ─── CARD ─── */
        .card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.75rem;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .card:hover {
          border-color: rgba(0, 255, 65, 0.5);
          box-shadow: 0 0 32px rgba(0, 255, 65, 0.08);
          transform: translateY(-3px);
        }

        /* ─── ICON BOX ─── */
        .icon-box {
          width: 48px;
          height: 48px;
          background: rgba(0, 255, 65, 0.1);
          border: 1px solid var(--border);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          margin-bottom: 1rem;
        }

        /* ─── HERO ACTIONS ─── */
        .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }

        /* ─── GRID HELPERS ─── */
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }

        /* ─── HERO SUB ─── */
        .hero-sub {
          color: var(--text-soft);
          font-size: clamp(1rem, 2vw, 1.2rem);
          line-height: 1.7;
          margin-bottom: 2.5rem;
          max-width: 540px;
        }
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.04em;
          margin-bottom: 1.5rem;
        }

        /* ─── TESTIMONIAL CARD ─── */
        .t-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
        }
        .t-stars { color: var(--neon); margin-bottom: 1rem; font-size: 1rem; }
        .t-text { color: var(--text-soft); font-style: italic; line-height: 1.7; margin-bottom: 1.25rem; font-size: 0.9rem; }
        .t-author { font-weight: 700; font-size: 0.9rem; }
        .t-role { color: var(--text-soft); font-size: 0.8rem; margin-top: 0.2rem; }

        /* ─── TAG BADGE ─── */
        .tag {
          display: inline-block;
          padding: 0.2rem 0.75rem;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(0, 255, 65, 0.08);
          color: var(--neon);
          border: 1px solid var(--border);
        }

        /* ─── TERMINAL ─── */
        .terminal {
          background: #050505;
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          font-family: var(--font-mono);
        }
        .terminal-bar {
          background: #111;
          padding: 0.65rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid var(--border);
        }
        .t-dot { width: 10px; height: 10px; border-radius: 50%; }
        .t-red { background: #ff5f57; }
        .t-yellow { background: #febc2e; }
        .t-green { background: #28c840; }
        .terminal-title { color: var(--text-soft); font-size: 0.75rem; margin-left: 0.5rem; }
        .terminal-body { padding: 1.5rem; font-size: 0.83rem; }
        .t-line { margin-bottom: 0.5rem; line-height: 1.6; }
        .t-system { color: var(--text-soft); }
        .t-user { color: #4fc3f7; }
        .t-bot { color: var(--neon); }
        .t-prompt { color: var(--text-soft); margin-right: 0.5rem; }
        .t-cursor {
          display: inline-block;
          width: 8px;
          height: 14px;
          background: var(--neon);
          animation: blink 1s step-end infinite;
          vertical-align: middle;
        }
        @keyframes blink { 50% { opacity: 0; } }

        /* ─── PLAN CARD ─── */
        .plan-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2.5rem 2rem;
          position: relative;
          transition: all 0.25s;
        }
        .plan-card.featured {
          border-color: var(--neon);
          box-shadow: 0 0 40px rgba(0, 255, 65, 0.1);
        }
        .plan-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--neon);
          color: #000;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.9rem;
          border-radius: 99px;
          white-space: nowrap;
        }
        .plan-name {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .plan-price {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--neon);
          line-height: 1;
          margin: 1rem 0 0.25rem;
        }
        .plan-period { color: var(--text-soft); font-size: 0.875rem; margin-bottom: 1.5rem; }
        .plan-feature {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: var(--text-soft);
          font-size: 0.875rem;
          margin-bottom: 0.6rem;
        }
        .plan-feature .check { color: var(--neon); font-weight: 700; }
        .check { color: var(--neon); font-weight: 700; }

        /* ─── TIMELINE ─── */
        .timeline { position: relative; padding-left: 2rem; }
        .timeline::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: var(--border);
        }
        .tl-item { position: relative; margin-bottom: 2.5rem; }
        .tl-item::before {
          content: '';
          position: absolute;
          left: -2.4rem;
          top: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--neon);
          box-shadow: 0 0 10px var(--neon-glow);
        }
        .tl-num {
          color: var(--neon);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
        }
        .tl-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; }
        .tl-desc { color: var(--text-soft); font-size: 0.9rem; line-height: 1.6; }

        /* ─── FAQ ─── */
        .faq-item {
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-bottom: 0.75rem;
          overflow: hidden;
        }
        .faq-q {
          width: 100%;
          background: var(--card-bg);
          border: none;
          color: var(--text);
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          text-align: left;
          padding: 1.1rem 1.5rem;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: color 0.2s;
        }
        .faq-q:hover { color: var(--neon); }
        .faq-q .arrow { color: var(--neon); font-size: 1.1rem; transition: transform 0.3s; }
        .faq-q.open .arrow { transform: rotate(180deg); }
        .faq-a {
          display: none;
          padding: 0 1.5rem 1.25rem;
          color: var(--text-soft);
          font-size: 0.9rem;
          line-height: 1.7;
          background: var(--card-bg);
        }
        .faq-a.open { display: block; }

        /* ─── BLOG CARD ─── */
        .blog-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .blog-card:hover {
          border-color: rgba(0, 255, 65, 0.5);
          box-shadow: 0 0 32px rgba(0, 255, 65, 0.08);
          transform: translateY(-3px);
        }
        .blog-img {
          height: 160px;
          background: linear-gradient(135deg, #0a1500, #002200);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          border-bottom: 1px solid var(--border);
        }
        .blog-body { padding: 1.5rem; }
        .blog-tag { margin-bottom: 0.75rem; }
        .blog-title {
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 0.65rem;
        }
        .blog-excerpt { color: var(--text-soft); font-size: 0.85rem; line-height: 1.6; }
        .blog-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
          color: var(--text-soft);
          font-size: 0.75rem;
        }

        /* ─── FORM ─── */
        .form-group { margin-bottom: 1rem; }
        .form-label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.4rem; color: var(--text-soft); }
        .form-input {
          width: 100%;
          background: rgba(0, 255, 65, 0.03);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-family: inherit;
          font-size: 0.95rem;
          padding: 0.75rem 1rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus {
          border-color: var(--neon);
          box-shadow: 0 0 0 3px rgba(0, 255, 65, 0.1);
        }
        .form-input::placeholder { color: #444; }
        select.form-input { cursor: pointer; }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          nav { display: none; }
          .hamburger { display: flex; }
          .grid-2 { grid-template-columns: 1fr; }
          .grid-3 { grid-template-columns: 1fr; }
          .services-grid { grid-template-columns: 1fr; }
          .testimonials-track { grid-template-columns: 1fr; }
          .hero { padding: 5rem 0 3rem; min-height: auto; }
          header { padding: 0 1.25rem; }
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr; gap: 2rem; }
          .grid-4 { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-bottom { flex-direction: column; text-align: center; }
          .hero-actions { flex-direction: column; }
          .btn-primary, .btn-secondary { justify-content: center; }
        }
      ` }} />

      {/* Barra de progresso de scroll */}
      <div className="scroll-progress" id="scrollProgress" />

      {/* Header de navegação */}
      <header id="mainHeader">
        <Link href="/" className="logo">
          Automatiza<strong>Wpp</strong>
        </Link>

        <nav>
          <Link href="/">Início</Link>
          <Link href="/automacao-whatsapp">Serviços</Link>
          <Link href="/casos-sucesso">Cases</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/login" style={{ fontWeight: 600, color: 'var(--text-muted, rgba(255,255,255,0.7))' }}>Entrar</Link>
          <Link href="/automacao-whatsapp" className="cta-header">Quero automatizar</Link>
        </nav>

        <button className="hamburger" id="hamburger" aria-label="Abrir menu">
          <span /><span /><span />
        </button>
      </header>

      {/* Menu mobile */}
      <div className="mobile-menu" id="mobileMenu">
        <Link href="/">Início</Link>
        <Link href="/automacao-whatsapp">Serviços</Link>
        <Link href="/automacao-vendas">Automação de Vendas</Link>
        <Link href="/automacao-atendimento">Atendimento 24h</Link>
        <Link href="/casos-sucesso">Cases</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/login" className="mobile-cta" style={{ background: 'transparent', border: '1px solid var(--neon, #25D366)', color: 'var(--neon, #25D366)' }}>Entrar na plataforma</Link>
        <Link href="/automacao-whatsapp" className="mobile-cta">Quero automatizar</Link>
      </div>

      {/* Conteúdo da página */}
      <div className="page-wrap">
        {children}
      </div>

      {/* Footer */}
      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Automatiza<strong>Wpp</strong></div>
            <p style={{ color: 'var(--text-soft)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: '280px' }}>
              Plataforma de automação WhatsApp com IA para negócios brasileiros. Venda mais, atenda melhor e cresça no automático.
            </p>
            <a href="mailto:inbox@automatizawpp.com" style={{ color: 'var(--neon)', fontSize: '0.875rem', textDecoration: 'none' }}>
              inbox@automatizawpp.com
            </a>
          </div>

          <div className="footer-col">
            <h4>Soluções</h4>
            <ul>
              <li><Link href="/automacao-whatsapp">Automação WhatsApp</Link></li>
              <li><Link href="/automacao-vendas">Automação de Vendas</Link></li>
              <li><Link href="/automacao-atendimento">Atendimento 24h</Link></li>
              <li><Link href="/automacao-whatsapp#diagnostico">Teste Grátis</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Empresa</h4>
            <ul>
              <li><Link href="/casos-sucesso">Cases de Sucesso</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/automacao-whatsapp#diagnostico">Diagnóstico Gratuito</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contato</h4>
            <ul>
              <li><a href="mailto:inbox@automatizawpp.com">E-mail</a></li>
              <li><a href="https://instagram.com/automatizawpp" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://linkedin.com/company/automatizawpp" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 AutomatizaWPP. Todos os direitos reservados.</p>
          <div className="footer-bottom-links">
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/politica-de-cookies">Política de Cookies</Link>
          </div>
        </div>
      </footer>
      <CookieBanner />

      {/* Google Analytics */}
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{
        __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');`
      }} />

      {/* JavaScript de interações do site (hamburger, scroll, reveal, FAQ) */}
      <Script id="site-interactions" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
        (function() {
          // ── Barra de progresso de scroll ──
          var bar = document.getElementById('scrollProgress');
          if (bar) {
            window.addEventListener('scroll', function() {
              var d = document.documentElement;
              var s = d.scrollTop || document.body.scrollTop;
              var h = d.scrollHeight - d.clientHeight;
              bar.style.width = (h > 0 ? (s / h) * 100 : 0) + '%';
            }, { passive: true });
          }

          // ── Header com classe scrolled ao rolar ──
          var header = document.getElementById('mainHeader');
          var lastY = 0;
          if (header) {
            window.addEventListener('scroll', function() {
              var y = window.scrollY;
              header.classList.toggle('scrolled', y > 40);
              lastY = y;
            }, { passive: true });
          }

          // ── Toggle do menu mobile ──
          var hb = document.getElementById('hamburger');
          var mm = document.getElementById('mobileMenu');
          if (hb && mm) {
            hb.addEventListener('click', function() {
              hb.classList.toggle('open');
              mm.classList.toggle('open');
            });
            // Fecha ao clicar em qualquer link do menu
            mm.querySelectorAll('a').forEach(function(a) {
              a.addEventListener('click', function() {
                hb.classList.remove('open');
                mm.classList.remove('open');
              });
            });
          }

          // ── Animação reveal via IntersectionObserver ──
          var reveals = document.querySelectorAll('.reveal');
          if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function(entries) {
              entries.forEach(function(e) {
                if (e.isIntersecting) {
                  e.target.classList.add('visible');
                  io.unobserve(e.target);
                }
              });
            }, { threshold: 0.1 });
            reveals.forEach(function(el) { io.observe(el); });
          } else {
            reveals.forEach(function(el) { el.classList.add('visible'); });
          }

          // ── Contadores animados (data-target) ──
          var counters = document.querySelectorAll('[data-target]');
          if (counters.length && 'IntersectionObserver' in window) {
            var counterIO = new IntersectionObserver(function(entries) {
              entries.forEach(function(e) {
                if (!e.isIntersecting) return;
                var el = e.target;
                var target = parseFloat(el.getAttribute('data-target'));
                var duration = 1800;
                var start = null;
                function step(ts) {
                  if (!start) start = ts;
                  var progress = Math.min((ts - start) / duration, 1);
                  el.textContent = Math.floor(progress * target);
                  if (progress < 1) requestAnimationFrame(step);
                  else el.textContent = target;
                }
                requestAnimationFrame(step);
                counterIO.unobserve(el);
              });
            }, { threshold: 0.5 });
            counters.forEach(function(el) { counterIO.observe(el); });
          }

          // ── Efeito de typewriter (apenas no hero) ──
          var tw = document.querySelector('.typewriter');
          if (tw) {
            var text = tw.getAttribute('data-text') || tw.textContent;
            tw.setAttribute('data-text', text);
            tw.textContent = '';
            var i = 0;
            function type() {
              if (i <= text.length) {
                tw.textContent = text.slice(0, i);
                i++;
                setTimeout(type, 55);
              }
            }
            setTimeout(type, 800);
          }

          // ── Toggle de FAQ ──
          document.addEventListener('click', function(e) {
            var btn = e.target.closest && e.target.closest('.faq-q');
            if (!btn) return;
            var isOpen = btn.classList.contains('open');
            document.querySelectorAll('.faq-q.open').forEach(function(b) {
              b.classList.remove('open');
              var a = b.nextElementSibling;
              if (a) a.classList.remove('open');
            });
            if (!isOpen) {
              btn.classList.add('open');
              var ans = btn.nextElementSibling;
              if (ans) ans.classList.add('open');
            }
          });

          // ── Handler de formulários com classe auto-form ──
          document.addEventListener('submit', function(e) {
            var form = e.target;
            if (!form || !form.classList.contains('auto-form')) return;
            e.preventDefault();
            var btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.textContent = 'Enviando...'; btn.disabled = true; }
            setTimeout(function() {
              if (btn) { btn.textContent = 'Enviado! Em breve entramos em contato.'; }
            }, 1200);
          });
        })();
      ` }} />
    </>
  );
}
