'use client';

import Link from 'next/link';
import { useState } from 'react';
import postsGerados from './generated-posts.json';

// Tipo para posts (estáticos e gerados)
interface PostLista {
  slug: string;
  emoji: string;
  tag: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
}

const POSTS_ESTATICOS: PostLista[] = [
  {
    slug: 'como-automatizar-whatsapp-pequeno-negocio',
    emoji: '🤖',
    tag: 'Guia',
    title: 'Como Automatizar WhatsApp para Pequeno Negócio — Guia Completo 2026',
    excerpt: '7 passos práticos para implementar automação no WhatsApp sem precisar de programação ou time técnico. Do zero ao primeiro lead em 7 dias.',
    date: '30 Abr 2026',
    readTime: '8 min',
  },
  {
    slug: 'ia-no-atendimento-ao-cliente-2026',
    emoji: '💬',
    tag: 'Tendências',
    title: 'IA no Atendimento ao Cliente — O que Muda em 2026',
    excerpt: 'Como a inteligência artificial está revolucionando o suporte ao cliente no Brasil. Melhore satisfação em 45% e reduza custos em 60%.',
    date: '29 Abr 2026',
    readTime: '6 min',
  },
  {
    slug: 'aumento-vendas-whatsapp-automacao',
    emoji: '📈',
    tag: 'Casos Reais',
    title: 'Como Empresas Brasileiras Aumentaram Vendas em 300% com Automação WhatsApp',
    excerpt: 'Números reais de clientes que implementaram automação WhatsApp. Veja metodologia, resultados e o que você pode replicar no seu negócio.',
    date: '28 Abr 2026',
    readTime: '10 min',
  },
  {
    slug: 'melhor-chatbot-whatsapp-brasil-2026',
    emoji: '🏆',
    tag: 'Comparativo',
    title: 'Qual é o Melhor Chatbot WhatsApp do Brasil em 2026? Comparamos 8 Opções',
    excerpt: 'Testamos as 8 principais plataformas de chatbot WhatsApp do mercado brasileiro. Veja qual entrega mais resultado pelo menor custo.',
    date: '27 Abr 2026',
    readTime: '12 min',
  },
  {
    slug: 'qualificacao-leads-whatsapp-automatica',
    emoji: '🎯',
    tag: 'Estratégia',
    title: 'Qualificação de Leads no WhatsApp: Como a IA Separa os Prontos para Comprar',
    excerpt: 'Descubra o método que usamos para qualificar leads com IA antes de passar para o vendedor. Taxa de conversão 3x maior que abordagem manual.',
    date: '26 Abr 2026',
    readTime: '7 min',
  },
  {
    slug: 'tendencias-automacao-negocios-2026',
    emoji: '🚀',
    tag: 'Futuro',
    title: 'Tendências de Automação para Negócios Brasileiros em 2026',
    excerpt: 'O que esperar de IA, automação e WhatsApp nos próximos 12 meses. Prepare seu negócio agora para não ficar para trás.',
    date: '25 Abr 2026',
    readTime: '9 min',
  },
];

// Mescla: posts gerados primeiro (mais recentes), depois estáticos
const POSTS: PostLista[] = [
  ...(postsGerados as PostLista[]),
  ...POSTS_ESTATICOS,
];

export default function BlogPage() {
  const [inscrito, setInscrito] = useState(false);
  const [erro, setErro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [email, setEmail] = useState('');

  async function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(false);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      setInscrito(true);
      setEmail('');
      setTimeout(() => setInscrito(false), 6000);
    } catch {
      setErro(true);
      setTimeout(() => setErro(false), 5000);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main>
      <style>{`
        .blog-toast {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 9999;
          background: #0a0a0a;
          border: 1px solid #25D366;
          border-radius: 12px;
          padding: 16px 22px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 0 32px rgba(37,211,102,0.25);
          animation: slideUp .3s ease;
          max-width: 340px;
        }
        .blog-toast-icon {
          width: 36px;
          height: 36px;
          background: rgba(37,211,102,0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1rem;
        }
        .blog-toast-title {
          color: #fff;
          font-weight: 700;
          font-size: .9rem;
          margin: 0 0 2px;
        }
        .blog-toast-sub {
          color: #888;
          font-size: .78rem;
          margin: 0;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Toast de confirmação */}
      {inscrito && (
        <div className="blog-toast">
          <div className="blog-toast-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="blog-toast-title">Inscrito com sucesso!</p>
            <p className="blog-toast-sub">Verifique seu email — enviamos uma confirmação.</p>
          </div>
        </div>
      )}

      {/* Toast de erro */}
      {erro && (
        <div className="blog-toast" style={{ borderColor: '#ef4444', boxShadow: '0 0 32px rgba(239,68,68,0.2)' }}>
          <div className="blog-toast-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <p className="blog-toast-title" style={{ color: '#ef4444' }}>Erro ao inscrever</p>
            <p className="blog-toast-sub">Tente novamente em instantes.</p>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ padding: '8rem 0 5rem', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top, rgba(0,255,65,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div className="hero-tag reveal" style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
            <span style={{ color: 'var(--neon)' }}>●</span>&nbsp;Blog
          </div>
          <h1 className="hero-title reveal" style={{ maxWidth: '700px', marginTop: '0' }}>
            Dicas de automação para <span className="highlight">negócios brasileiros</span>
          </h1>
          <p className="hero-sub reveal">
            Estratégias práticas, cases reais e tendências sobre automação WhatsApp, IA e vendas para empresas do Brasil.
          </p>
        </div>
      </section>

      {/* ── POSTS GRID ── */}
      <section className="section">
        <div className="container">
          {/* Post em destaque */}
          <div className="reveal" style={{ marginBottom: '3rem' }}>
            <Link
              href={`/blog/${POSTS[0].slug}`}
              className="blog-card"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}
            >
              <div className="blog-img" style={{ height: '100%', minHeight: '220px', fontSize: '4rem' }}>
                {POSTS[0].emoji}
              </div>
              <div className="blog-body" style={{ padding: '2.5rem' }}>
                <div className="blog-tag">
                  <span className="tag">{POSTS[0].tag}</span>
                </div>
                <h2 className="blog-title" style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{POSTS[0].title}</h2>
                <p className="blog-excerpt" style={{ fontSize: '0.95rem' }}>{POSTS[0].excerpt}</p>
                <div className="blog-meta">
                  <span>{POSTS[0].date}</span>
                  <span>·</span>
                  <span>{POSTS[0].readTime} de leitura</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Grid dos demais posts */}
          <div className="grid-3">
            {POSTS.slice(1).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card reveal">
                <div className="blog-img">{post.emoji}</div>
                <div className="blog-body">
                  <div className="blog-tag">
                    <span className="tag">{post.tag}</span>
                  </div>
                  <h2 className="blog-title">{post.title}</h2>
                  <p className="blog-excerpt">{post.excerpt}</p>
                  <div className="blog-meta">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── NEWSLETTER ── */}
      <section className="cta-section">
        <div className="container">
          <div className="section-tag reveal" style={{ display: 'inline-block' }}>Newsletter</div>
          <h2 className="section-title reveal" style={{ margin: '1rem auto' }}>
            Não perca nenhuma <span className="highlight">dica</span>
          </h2>
          <p className="section-sub reveal" style={{ margin: '0 auto 2rem' }}>
            Receba artigos novos, cases e estratégias de automação direto no seu email.
          </p>
          <form
            className="reveal"
            onSubmit={handleNewsletter}
            style={{ display: 'flex', gap: '0.75rem', maxWidth: '460px', margin: '0 auto', flexWrap: 'wrap' }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="form-input"
              required
              style={{ flex: 1, minWidth: '200px' }}
            />
            <button type="submit" className="btn-primary" disabled={enviando} style={{ opacity: enviando ? 0.7 : 1 }}>
              {enviando ? 'Enviando…' : 'Inscrever-se'}
            </button>
          </form>
          <p className="text-muted reveal" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
            Sem spam. Cancelamento fácil a qualquer momento.
          </p>
        </div>
      </section>
    </main>
  );
}
