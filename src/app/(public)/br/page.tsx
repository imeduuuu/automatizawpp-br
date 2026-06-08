'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center', gap: '4rem' }}>
            <div>
              <div className="hero-tag reveal">
                <span style={{ color: 'var(--neon)' }}>●</span> IA para WhatsApp · 24/7
              </div>
              <h1 className="hero-title reveal">
                Venda mais no WhatsApp com{' '}
                <span className="highlight">
                  <span className="typewriter" data-text="IA trabalhando 24h" suppressHydrationWarning>IA trabalhando 24h</span>
                </span>
              </h1>
              <p className="hero-sub reveal">
                Plataforma de automação WhatsApp com IA para negócios brasileiros. Qualifique leads, responda 24h e feche mais vendas — sem aumentar equipe.
              </p>
              <div className="hero-actions reveal">
                <Link href="/automacao-whatsapp#diagnostico" className="btn-primary">Diagnóstico Gratuito</Link>
                <Link href="/casos-sucesso" className="btn-secondary">Ver Cases</Link>
              </div>
            </div>

            {/* Terminal */}
            <div className="terminal reveal">
              <div className="terminal-bar">
                <span className="t-dot t-red" />
                <span className="t-dot t-yellow" />
                <span className="t-dot t-green" />
                <span className="terminal-title">AutomatizaWPP · Sistema ativo</span>
              </div>
              <div className="terminal-body">
                <div className="t-line t-system">{'// leads qualificados hoje'}</div>
                <br />
                <div className="t-line"><span className="t-prompt">leads:</span><span className="t-bot"> 47 qualificados ✅</span></div>
                <div className="t-line"><span className="t-prompt">conversas:</span><span className="t-bot"> 312 respondidas ⚡</span></div>
                <div className="t-line"><span className="t-prompt">conversões:</span><span className="t-bot"> 12 vendas fechadas 💰</span></div>
                <div className="t-line"><span className="t-prompt">status:</span><span className="t-bot"> 24/7 ativo <span className="t-cursor" /></span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {[
              { num: '200+', label: 'negócios automatizados' },
              { num: '+300%', label: 'aumento médio de leads' },
              { num: '24/7', label: 'atendimento sem parar' },
              { num: '7 dias', label: 'para implementar' },
            ].map((s, i) => (
              <div key={i} className="stat-item reveal" style={{ textAlign: 'center' }}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUÇÕES ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag reveal">Soluções</div>
            <h2 className="section-title reveal">
              Tudo para seu negócio <span className="highlight">crescer</span>
            </h2>
            <p className="section-sub reveal" style={{ margin: '0 auto' }}>
              Três pilares que transformam o seu WhatsApp em uma máquina de vendas.
            </p>
          </div>
          <div className="services-grid">
            {[
              {
                icon: '💬',
                title: 'Automação WhatsApp',
                desc: 'Chatbot com IA que responde, qualifica leads e vende automaticamente. Atende 24h sem intervenção humana.',
                link: '/automacao-whatsapp',
              },
              {
                icon: '💰',
                title: 'Automação de Vendas',
                desc: 'Funil de vendas completo no automático: qualificação, proposta, follow-up e fechamento via WhatsApp.',
                link: '/automacao-vendas',
              },
              {
                icon: '🎧',
                title: 'Atendimento 24h',
                desc: 'Suporte ao cliente 24/7 sem aumentar equipe. Reduza custos em 60% e aumente satisfação em 45%.',
                link: '/automacao-atendimento',
              },
            ].map((s, i) => (
              <Link key={i} href={s.link} className="service-card reveal" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="service-icon">{s.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.1rem' }}>{s.title}</h3>
                <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1rem' }}>{s.desc}</p>
                <span className="text-accent" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Saiba mais →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── COMO FUNCIONA ── */}
      <section className="section">
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center', gap: '4rem' }}>
            <div className="timeline reveal">
              {[
                { n: 'Passo 01', t: 'Diagnóstico gratuito', d: 'Analisamos seu negócio e mapeamos as oportunidades de automação em 15 minutos.' },
                { n: 'Passo 02', t: 'Configuração personalizada', d: 'Treinamos a IA com o perfil do seu negócio, tom de voz e produtos.' },
                { n: 'Passo 03', t: 'Ativação em 7 dias', d: 'Go live! Sua automação entra em operação e começa a gerar leads qualificados.' },
                { n: 'Passo 04', t: 'Crescimento contínuo', d: 'Acompanhamento e otimizações semanais para maximizar resultados.' },
              ].map((tl, i) => (
                <div key={i} className="tl-item">
                  <div className="tl-num">{tl.n}</div>
                  <div className="tl-title">{tl.t}</div>
                  <div className="tl-desc">{tl.d}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="section-tag reveal">Como Funciona</div>
              <h2 className="section-title reveal">
                Do diagnóstico ao <span className="highlight">primeiro lead</span> em 7 dias
              </h2>
              <p className="section-sub reveal">
                Processo simples, implementação guiada e resultados desde a primeira semana. Sem necessidade de equipe técnica.
              </p>
              <div style={{ marginTop: '2rem' }} className="reveal">
                <Link href="/automacao-whatsapp#diagnostico" className="btn-primary">Começar agora</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── DEPOIMENTOS ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag reveal">Depoimentos</div>
            <h2 className="section-title reveal">O que nossos <span className="highlight">clientes</span> dizem</h2>
          </div>
          <div className="testimonials-track">
            {[
              { stars: '★★★★★', text: '"Em 30 dias triplicamos o número de leads qualificados. A IA atende melhor do que eu conseguia atender manualmente."', name: 'Mariana Costa', role: 'CEO · Clínica Estética MS', emoji: '👩‍⚕️' },
              { stars: '★★★★★', text: '"Paramos de perder clientes por demora no atendimento. A automação paga o investimento de um ano só no primeiro mês."', name: 'Rafael Mendes', role: 'Diretor · Horizonte Imóveis', emoji: '👨‍💼' },
              { stars: '★★★★★', text: '"Implementação em 7 dias, suporte incrível e resultado desde o primeiro dia. Melhor decisão de negócio que tomei."', name: 'Juliana Ferreira', role: 'Founder · EduTech Brasil', emoji: '👩‍💻' },
            ].map((t, i) => (
              <div key={i} className="testimonial reveal">
                <div className="t-stars">{t.stars}</div>
                <p className="t-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.emoji}</div>
                  <div>
                    <div className="t-author">{t.name}</div>
                    <div className="t-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }} className="reveal">
            <Link href="/casos-sucesso" className="btn-secondary">Ver todos os cases →</Link>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="cta-section">
        <div className="container">
          <div className="section-tag reveal" style={{ display: 'inline-block' }}>Grátis · Sem cartão</div>
          <h2 className="section-title reveal" style={{ margin: '1rem auto' }}>
            Comece a automatizar <span className="highlight">hoje</span>
          </h2>
          <p className="section-sub reveal" style={{ margin: '0 auto 2rem' }}>
            Diagnóstico gratuito em 15 minutos. Implementação em 7 dias. Resultados desde a primeira semana.
          </p>
          <div className="hero-actions reveal" style={{ justifyContent: 'center' }}>
            <Link href="/automacao-whatsapp#diagnostico" className="btn-primary">Diagnóstico Gratuito</Link>
            <Link href="/casos-sucesso" className="btn-secondary">Ver Cases de Sucesso</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
