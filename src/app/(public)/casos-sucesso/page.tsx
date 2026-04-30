'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function CasosSucessoPage() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.16 }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .page-hero{padding:130px 20px 70px;border-bottom:1px solid var(--border);background:radial-gradient(circle at 50% 0,rgba(0,255,65,.15),transparent 42%)}
        .page-hero h1{font-size:clamp(2.35rem,7vw,5.9rem);line-height:.92;letter-spacing:-.08em;margin-bottom:22px}
        .kicker{color:var(--neon);text-transform:uppercase;letter-spacing:.16em;font-weight:900;font-size:.78rem;margin-bottom:14px}
        .lead{font-size:clamp(1.02rem,2vw,1.25rem);color:var(--muted);max-width:680px}
        .wrap{max-width:1160px;margin:auto}
        .section-cs{padding:92px 20px;position:relative}
        .grid-cards{display:grid;gap:22px;grid-template-columns:repeat(3,1fr)}
        .grid-two{display:grid;gap:22px;grid-template-columns:repeat(2,1fr)}
        .card-cs{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.015));border:1px solid var(--border);border-radius:24px;padding:26px;transition:.3s;position:relative;overflow:hidden}
        .card-cs:hover{transform:translateY(-8px);border-color:rgba(0,255,65,.65);box-shadow:0 0 36px rgba(0,255,65,.16)}
        .icon-cs{width:48px;height:48px;border:1px solid var(--border);border-radius:16px;display:grid;place-items:center;font-size:1.45rem;background:rgba(0,255,65,.06);box-shadow:0 0 18px rgba(0,255,65,.16);margin-bottom:18px}
        .card-cs h3{font-size:1.2rem;margin-bottom:10px;color:#fff}
        .card-cs p{color:var(--muted);margin-bottom:8px}
        .price-cs{font-size:2.4rem;color:var(--neon);font-weight:900;margin:12px 0;text-shadow:0 0 24px rgba(0,255,65,.35)}
        .section-head{display:flex;justify-content:space-between;gap:22px;align-items:end;margin-bottom:36px}
        .section-cs h2{font-size:clamp(2rem,5vw,3.8rem);letter-spacing:-.06em;line-height:1;margin-bottom:16px}
        .testimonial-cs{padding:30px;border:1px solid var(--border);border-radius:24px;background:#050505}
        .quote-cs{font-size:1.18rem;color:#e9e9e9;font-style:italic}
        .person-cs{margin-top:18px;color:var(--neon);font-weight:800}
        .cta-cs{border:1px solid var(--border);border-radius:32px;padding:34px;background:linear-gradient(135deg,rgba(0,255,65,.12),rgba(255,255,255,.02));box-shadow:0 0 50px rgba(0,255,65,.11);text-align:center}
        .cta-cs h2{font-size:clamp(1.8rem,4vw,3rem);letter-spacing:-.06em;margin-bottom:12px}
        .cta-cs p{color:var(--muted);margin-bottom:22px}
        .btn-neon{display:inline-flex;align-items:center;gap:10px;border-radius:999px;padding:13px 24px;border:1px solid var(--neon);background:var(--neon);color:#001406;font-weight:800;box-shadow:0 0 24px rgba(0,255,65,.35);transition:.3s}
        .btn-neon:hover{background:#00cc33;transform:translateY(-2px) scale(1.02);box-shadow:0 0 34px rgba(0,255,65,.55)}
        .reveal{opacity:0;transform:translateY(34px);transition:opacity .7s ease,transform .7s ease}
        .reveal.in{opacity:1;transform:none}
        @media(max-width:850px){.grid-cards,.grid-two{grid-template-columns:1fr}.section-head{display:block}.section-cs{padding:70px 18px}}
      `}</style>

      <main style={{ paddingTop: '76px' }}>
        {/* ── PAGE HERO ── */}
        <section className="page-hero">
          <div className="wrap reveal">
            <p className="kicker">Cases</p>
            <h1>Resultados reais com IA no atendimento e vendas.</h1>
            <p className="lead">Exemplos de como empresas brasileiras ganharam velocidade, previsibilidade e escala.</p>
          </div>
        </section>

        {/* ── CASES CARDS ── */}
        <section className="section-cs">
          <div className="wrap">
            <div className="grid-cards">
              {[
                { icon: '🏥', title: 'Clínica estética', desc: 'Automatização de triagem, agendamento e confirmação. Redução de faltas e aumento de consultas marcadas.', metric: '+37%', label: 'em agendamentos qualificados' },
                { icon: '🏫', title: 'Escola online', desc: 'Funil de WhatsApp com qualificação, objeções, envio de proposta e aviso para o time comercial.', metric: '2,8x', label: 'mais reuniões comerciais' },
                { icon: '🏠', title: 'Imobiliária', desc: 'Captação de preferências, envio de imóveis compatíveis e registro automático no CRM.', metric: '-54%', label: 'menos tempo em tarefas manuais' },
              ].map((c, i) => (
                <article key={i} className="card-cs reveal">
                  <div className="icon-cs">{c.icon}</div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <p className="price-cs">{c.metric}</p>
                  <p>{c.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEPOIMENTOS ── */}
        <section className="section-cs">
          <div className="wrap">
            <div className="section-head reveal">
              <div>
                <p className="kicker">Depoimentos</p>
                <h2>O que mudou depois da IA.</h2>
              </div>
            </div>
            <div className="grid-two">
              {[
                { quote: '"Antes perdíamos mensagens no pico. Agora a IA atende, organiza e prioriza tudo."', person: 'Bruno Azevedo, operação comercial' },
                { quote: '"O time parou de repetir resposta básica e passou a focar em fechamento."', person: 'Fernanda Lima, marketing e vendas' },
              ].map((t, i) => (
                <div key={i} className="testimonial-cs reveal">
                  <p className="quote-cs">{t.quote}</p>
                  <p className="person-cs">{t.person}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section-cs">
          <div className="wrap">
            <div className="cta-cs reveal">
              <h2>Seu case pode ser o próximo.</h2>
              <p>Vamos mapear gargalos e mostrar onde a IA pode gerar impacto imediato.</p>
              <Link href="/automacao-whatsapp#diagnostico" className="btn-neon">Criar meu projeto</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
