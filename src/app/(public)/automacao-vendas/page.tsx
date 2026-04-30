'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AutomacaoVendasPage() {
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
        .page-hero{padding:130px 20px 70px;border-bottom:1px solid var(--line);background:radial-gradient(circle at 50% 0,rgba(0,255,65,.15),transparent 42%)}
        .page-hero h1{font-size:clamp(2.35rem,7vw,5.9rem);line-height:.92;letter-spacing:-.08em;margin-bottom:22px}
        .kicker{color:var(--neon);text-transform:uppercase;letter-spacing:.16em;font-weight:900;font-size:.78rem;margin-bottom:14px}
        .lead{font-size:clamp(1.02rem,2vw,1.25rem);color:var(--muted);max-width:680px}
        .wrap{max-width:1160px;margin:auto}
        .section-sv{padding:92px 20px;position:relative}
        .grid-cards{display:grid;gap:22px;grid-template-columns:repeat(3,1fr)}
        .grid-two{display:grid;gap:22px;grid-template-columns:repeat(2,1fr)}
        .card-sv{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.015));border:1px solid var(--line);border-radius:24px;padding:26px;transition:.3s;position:relative;overflow:hidden}
        .card-sv:hover{transform:translateY(-8px);border-color:rgba(0,255,65,.65);box-shadow:0 0 36px rgba(0,255,65,.16)}
        .icon-sv{width:48px;height:48px;border:1px solid var(--line);border-radius:16px;display:grid;place-items:center;color:var(--neon);font-size:1.45rem;background:rgba(0,255,65,.06);box-shadow:0 0 18px rgba(0,255,65,.16);margin-bottom:18px}
        .card-sv h3{font-size:1.2rem;margin-bottom:10px;color:#fff}
        .card-sv p{color:var(--muted)}
        .pill-sv{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:8px 12px;color:var(--neon);background:rgba(0,255,65,.06);font-weight:800;font-size:.82rem;margin:6px 6px 0 0}
        .section-head{display:flex;justify-content:space-between;gap:22px;align-items:end;margin-bottom:36px}
        .section-head p{color:var(--muted);max-width:560px}
        .section-sv h2{font-size:clamp(2rem,5vw,3.8rem);letter-spacing:-.06em;line-height:1;margin-bottom:16px}
        .timeline-sv{border-left:1px solid var(--line);padding-left:24px}
        .step-sv{position:relative;margin-bottom:26px}
        .step-sv:before{content:"";position:absolute;left:-32px;top:6px;width:14px;height:14px;border-radius:50%;background:var(--neon);box-shadow:0 0 24px rgba(0,255,65,.35)}
        .step-sv h3{font-size:1.1rem;margin-bottom:6px;color:#fff}
        .step-sv p{color:var(--muted)}
        .cta-sv{border:1px solid var(--line);border-radius:32px;padding:34px;background:linear-gradient(135deg,rgba(0,255,65,.12),rgba(255,255,255,.02));box-shadow:0 0 50px rgba(0,255,65,.11);text-align:center}
        .cta-sv h2{font-size:clamp(1.8rem,4vw,3rem);letter-spacing:-.06em;margin-bottom:12px}
        .cta-sv p{color:var(--muted);margin-bottom:22px}
        .actions-sv{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:22px}
        .btn-neon{display:inline-flex;align-items:center;gap:10px;border-radius:999px;padding:13px 24px;border:1px solid var(--neon);background:var(--neon);color:#001406;font-weight:800;box-shadow:0 0 24px rgba(0,255,65,.35);transition:.3s}
        .btn-neon:hover{background:#00cc33;transform:translateY(-2px) scale(1.02);box-shadow:0 0 34px rgba(0,255,65,.55)}
        .btn-ghost{display:inline-flex;align-items:center;gap:10px;border-radius:999px;padding:13px 24px;border:1px solid var(--neon);background:transparent;color:var(--neon);font-weight:800;transition:.3s}
        .btn-ghost:hover{background:rgba(0,255,65,.1)}
        .reveal{opacity:0;transform:translateY(34px);transition:opacity .7s ease,transform .7s ease}
        .reveal.in{opacity:1;transform:none}
        @media(max-width:850px){.grid-cards,.grid-two{grid-template-columns:1fr}.section-head{display:block}.section-sv{padding:70px 18px}}
      `}</style>

      <main style={{ paddingTop: '76px' }}>
        {/* ── PAGE HERO ── */}
        <section className="page-hero">
          <div className="wrap reveal">
            <p className="kicker">Serviços</p>
            <h1>IA aplicada para vender, atender e operar melhor.</h1>
            <p className="lead">Soluções sob medida para empresas que querem reduzir trabalho manual e aumentar conversões no WhatsApp e em outros canais.</p>
          </div>
        </section>

        {/* ── CARDS DE SERVIÇOS ── */}
        <section className="section-sv">
          <div className="wrap">
            <div className="grid-cards">
              {[
                { icon: '✦', id: 'whatsapp', title: 'IA para WhatsApp', desc: 'Chatbots inteligentes para atendimento automático, vendas consultivas, recuperação de leads, envio de propostas e suporte em tempo real.', pill: 'Mais conversão' },
                { icon: '⚙', id: 'processos', title: 'Automação de processos', desc: 'Fluxos automáticos para planilhas, e-mails, documentos, notificações, cadastros e tarefas internas.', pill: 'Menos retrabalho' },
                { icon: '🤖', id: 'agentes', title: 'Agentes de IA personalizados', desc: 'Agentes treinados com seus produtos, políticas, perguntas frequentes e estilo de comunicação da marca.', pill: 'Sob medida' },
                { icon: '⌁', id: 'crm', title: 'Integração com CRM', desc: 'Conectamos WhatsApp, formulários e atendimento ao CRM para registrar leads, etapas e histórico automaticamente.', pill: 'Pipeline limpo' },
                { icon: '◈', id: 'dados', title: 'Análise de dados com IA', desc: 'Dashboards, relatórios e leitura inteligente de dados para encontrar gargalos e oportunidades.', pill: 'Decisão rápida' },
                { icon: '↗', id: 'outros', title: 'Consultoria e crescimento', desc: 'Mapeamento de funil, prompts, scripts comerciais e otimização contínua dos pontos de contato.', pill: 'Crescimento' },
              ].map((s) => (
                <article key={s.id} id={s.id} className="card-sv reveal">
                  <div className="icon-sv">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <span className="pill-sv">{s.pill}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA ── */}
        <section className="section-sv">
          <div className="wrap">
            <div className="section-head reveal">
              <div>
                <p className="kicker">Como funciona</p>
                <h2>Implementação sem complicação.</h2>
              </div>
              <p>Mapeamos seu cenário, criamos a solução, integramos com suas ferramentas e acompanhamos os resultados.</p>
            </div>
            <div className="timeline-sv reveal">
              {[
                { n: '1', title: 'Diagnóstico', desc: 'Entendemos atendimento, vendas, volume de mensagens e ferramentas atuais.' },
                { n: '2', title: 'Desenho do fluxo', desc: 'Criamos jornadas, regras de negócio, respostas e gatilhos de automação.' },
                { n: '3', title: 'Integração', desc: 'Conectamos WhatsApp, CRM, planilhas, agendas e sistemas internos.' },
                { n: '4', title: 'Otimização', desc: 'Acompanhamos métricas e melhoramos o agente para vender mais.' },
              ].map((step) => (
                <div key={step.n} className="step-sv">
                  <h3>{step.n}. {step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section-sv">
          <div className="wrap">
            <div className="cta-sv reveal">
              <h2>Quer ver uma demo no seu nicho?</h2>
              <p>Receba uma simulação com mensagens reais do seu mercado.</p>
              <div className="actions-sv">
                <Link href="/automacao-whatsapp#diagnostico" className="btn-neon">Solicitar demo</Link>
                <Link href="/automacao-whatsapp" className="btn-ghost">Ver planos</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
