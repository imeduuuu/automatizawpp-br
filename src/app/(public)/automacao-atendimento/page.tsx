'use client';

import Link from 'next/link';

export default function AutomacaoAtendimentoPage() {
  return (
    <main>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="container">
          <div style={{ maxWidth: '720px' }}>
            <div className="hero-tag reveal">
              <span style={{ color: 'var(--neon)' }}>●</span> Atendimento Automático
            </div>
            <h1 className="hero-title reveal">
              Atendimento <span className="highlight">24h</span> sem aumentar equipe
            </h1>
            <p className="hero-sub reveal">
              Suporte ao cliente que nunca dorme. Nossa IA resolve 80% das dúvidas instantaneamente e encaminha casos complexos para o humano certo.
            </p>
            <div className="hero-actions reveal">
              <Link href="/automacao-whatsapp#diagnostico" className="btn-primary">Começar Agora</Link>
              <Link href="/casos-sucesso" className="btn-secondary">Ver Cases</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {[
              { num: '60%', label: 'redução em custos de atendimento' },
              { num: '80%', label: 'de problemas resolvidos pela IA' },
              { num: '+45%', label: 'aumento na satisfação do cliente' },
              { num: '<5s', label: 'tempo médio de resposta' },
            ].map((s, i) => (
              <div key={i} className="stat-item reveal" style={{ textAlign: 'center' }}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag reveal">Funcionalidades</div>
            <h2 className="section-title reveal">Suporte que <span className="highlight">impressiona</span> os clientes</h2>
            <p className="section-sub reveal" style={{ margin: '0 auto' }}>
              Cada feature pensada para reduzir custos e aumentar satisfação ao mesmo tempo.
            </p>
          </div>
          <div className="services-grid">
            {[
              { icon: '⚡', title: 'Resposta Instantânea', desc: 'Seu cliente recebe resposta em segundos, mesmo fora do horário comercial, finais de semana e feriados.' },
              { icon: '🔀', title: 'Roteamento Inteligente', desc: 'A IA identifica o tipo de dúvida e encaminha automaticamente ao departamento ou atendente certo.' },
              { icon: '📚', title: 'Base de Conhecimento IA', desc: 'A IA aprende com seu conteúdo: FAQs, manuais, políticas — e responde com precisão de especialista.' },
              { icon: '🎫', title: 'Gestão de Tickets', desc: 'Abertura e rastreamento automático de tickets. Cliente recebe atualizações sem precisar perguntar.' },
              { icon: '🌐', title: 'Multicanal', desc: 'WhatsApp, Instagram DM e email em um único painel. Atenda todos os canais de forma unificada.' },
              { icon: '😊', title: 'Pesquisa de Satisfação', desc: 'CSAT automático após cada atendimento. Meça satisfação em tempo real e identifique pontos de melhoria.' },
            ].map((s, i) => (
              <div key={i} className="service-card reveal">
                <div className="service-icon">{s.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.05rem' }}>{s.title}</h3>
                <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── CASES ATENDIMENTO ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag reveal">Cases Reais</div>
            <h2 className="section-title reveal">Resultados <span className="highlight">comprovados</span></h2>
          </div>
          <div className="grid-3">
            {[
              {
                tag: 'Clínica Estética',
                title: '-65% de custos com atendimento',
                bullets: [
                  'IA agenda consultas automaticamente',
                  'Lembretes de confirmação automáticos',
                  'Dúvidas pós-procedimento respondidas 24h',
                ],
                metric: '-65%',
                metricLabel: 'custo operacional',
              },
              {
                tag: 'E-commerce',
                title: '98% de satisfação no suporte',
                bullets: [
                  'Rastreamento de pedidos automático',
                  'Trocas e devoluções sem fila',
                  'Resposta em menos de 10 segundos',
                ],
                metric: '98%',
                metricLabel: 'satisfação dos clientes',
              },
              {
                tag: 'Escola Online',
                title: '+200% de retenção de alunos',
                bullets: [
                  'Suporte pedagógico 24h',
                  'Renovações automatizadas',
                  'Engajamento proativo com alunos inativos',
                ],
                metric: '+200%',
                metricLabel: 'retenção de alunos',
              },
            ].map((c, i) => (
              <div key={i} className="card reveal">
                <span className="tag" style={{ marginBottom: '1rem', display: 'inline-block' }}>{c.tag}</span>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>{c.title}</h3>
                <div style={{ marginBottom: '1.25rem' }}>
                  {c.bullets.map((b, j) => (
                    <div key={j} className="plan-feature">
                      <span className="check">✓</span>
                      <span className="text-muted" style={{ fontSize: '0.875rem' }}>{b}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div className="stat-num" style={{ fontSize: '2rem' }}>{c.metric}</div>
                  <div className="stat-label">{c.metricLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── COMPARATIVO ── */}
      <section className="section">
        <div className="container" style={{ maxWidth: '780px' }}>
          <div className="section-header">
            <div className="section-tag reveal">Comparativo</div>
            <h2 className="section-title reveal">Antes vs <span className="highlight">Depois</span></h2>
          </div>
          <div className="grid-2 reveal">
            <div className="card" style={{ borderColor: 'rgba(255,80,80,0.3)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#ff6b6b', fontSize: '1.1rem' }}>
                Sem AutomatizaWPP
              </h3>
              {[
                'Clientes esperando horas por resposta',
                'Equipe sobrecarregada com dúvidas repetitivas',
                'Atendimento encerrado fora do horário comercial',
                'Sem controle de satisfação dos clientes',
                'Custos crescendo com time de suporte',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem', color: 'var(--text-soft)', fontSize: '0.875rem' }}>
                  <span style={{ color: '#ff6b6b' }}>✗</span> {item}
                </div>
              ))}
            </div>
            <div className="card" style={{ borderColor: 'var(--neon)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--neon)', fontSize: '1.1rem' }}>
                Com AutomatizaWPP
              </h3>
              {[
                'Resposta em menos de 5 segundos',
                'IA resolve 80% sem intervenção humana',
                'Atendimento 24h, 7 dias por semana',
                'CSAT automático após cada atendimento',
                'Redução de 60% nos custos de suporte',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem', color: 'var(--text-soft)', fontSize: '0.875rem' }}>
                  <span className="check">✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <div className="section-tag reveal" style={{ display: 'inline-block' }}>Grátis por 7 dias</div>
          <h2 className="section-title reveal" style={{ margin: '1rem auto' }}>
            Transforme seu <span className="highlight">atendimento</span> hoje
          </h2>
          <p className="section-sub reveal" style={{ margin: '0 auto 2rem' }}>
            Clientes mais felizes, equipe mais produtiva, custos menores. Tudo junto.
          </p>
          <div className="hero-actions reveal" style={{ justifyContent: 'center' }}>
            <Link href="/automacao-whatsapp#diagnostico" className="btn-primary">Diagnóstico Gratuito</Link>
            <a href="mailto:contato@automatizawpp.com" className="btn-secondary">Falar com time</a>
          </div>
        </div>
      </section>
    </main>
  );
}
