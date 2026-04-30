'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AutomacaoWhatsAppPage() {
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroForm, setErroForm] = useState(false);
  const [nomeEnviado, setNomeEnviado] = useState('');

  async function handleDiagnostico(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErroForm(false);
    const fd = new FormData(e.currentTarget);
    const nome = fd.get('nome') as string;
    const whatsapp = fd.get('whatsapp') as string;
    const negocio = fd.get('negocio') as string;
    const atendimentos = fd.get('atendimentos') as string;

    try {
      const res = await fetch('/api/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, whatsapp, negocio, atendimentos }),
      });
      if (!res.ok) throw new Error('erro');
      setNomeEnviado(nome);
      setEnviado(true);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setEnviado(false), 8000);
    } catch {
      setErroForm(true);
      setTimeout(() => setErroForm(false), 5000);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main>
      <style>{`
        .diag-toast {
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
          animation: slideUpDiag .3s ease;
          max-width: 360px;
        }
        .diag-toast.erro { border-color: #ef4444; box-shadow: 0 0 32px rgba(239,68,68,0.2); }
        .diag-toast-icon {
          width: 36px; height: 36px;
          background: rgba(37,211,102,0.15);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 1rem;
        }
        .diag-toast.erro .diag-toast-icon { background: rgba(239,68,68,0.15); }
        .diag-toast-title { color: #fff; font-weight: 700; font-size: .9rem; margin: 0 0 2px; }
        .diag-toast.erro .diag-toast-title { color: #ef4444; }
        .diag-toast-sub { color: #888; font-size: .78rem; margin: 0; }
        @keyframes slideUpDiag {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Toast de sucesso */}
      {enviado && (
        <div className="diag-toast">
          <div className="diag-toast-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="diag-toast-title">Obrigado, {nomeEnviado}!</p>
            <p className="diag-toast-sub">Nossa equipe entra em contato em até 2h.</p>
          </div>
        </div>
      )}

      {/* Toast de erro */}
      {erroForm && (
        <div className="diag-toast erro">
          <div className="diag-toast-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <p className="diag-toast-title">Erro ao enviar</p>
            <p className="diag-toast-sub">Tente novamente em instantes.</p>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="hero">
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center', gap: '4rem' }}>
            <div>
              <div className="hero-tag reveal">
                <span style={{ color: 'var(--neon)' }}>●</span> IA para WhatsApp
              </div>
              <h1 className="hero-title reveal">
                IA para WhatsApp que vende{' '}
                <span className="highlight">24/7</span>
              </h1>
              <p className="hero-sub reveal">
                Automatize respostas, qualifique leads e feche vendas enquanto você dorme. Nossa IA atende seus clientes no WhatsApp com naturalidade humana.
              </p>
              <div className="hero-actions reveal">
                <a href="#diagnostico" className="btn-primary">Diagnóstico Gratuito</a>
                <Link href="/casos-sucesso" className="btn-secondary">Ver Cases</Link>
              </div>
            </div>

            {/* Terminal animado */}
            <div className="terminal reveal">
              <div className="terminal-bar">
                <span className="t-dot t-red" />
                <span className="t-dot t-yellow" />
                <span className="t-dot t-green" />
                <span className="terminal-title">WhatsApp · AutomatizaWPP IA</span>
              </div>
              <div className="terminal-body">
                <div className="t-line t-system">{'// conversa em tempo real'}</div>
                <br />
                <div className="t-line">
                  <span className="t-prompt">cliente:</span>
                  <span className="t-user"> Oi, quero saber mais sobre o produto</span>
                </div>
                <div className="t-line">
                  <span className="t-prompt">IA:</span>
                  <span className="t-bot"> Olá! 😊 Claro! Qual produto te interessa? Temos promoção especial hoje.</span>
                </div>
                <div className="t-line">
                  <span className="t-prompt">cliente:</span>
                  <span className="t-user"> O plano mensal. Qual o preço?</span>
                </div>
                <div className="t-line">
                  <span className="t-prompt">IA:</span>
                  <span className="t-bot"> R$297/mês com 7 dias grátis. Posso enviar mais detalhes? 🚀</span>
                </div>
                <div className="t-line">
                  <span className="t-prompt">cliente:</span>
                  <span className="t-user"> Sim! Quero testar.</span>
                </div>
                <div className="t-line">
                  <span className="t-prompt">IA:</span>
                  <span className="t-bot"> Perfeito! Enviando o link agora. Lead qualificado ✅ <span className="t-cursor" /></span>
                </div>
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
              { num: '+300%', label: 'aumento de leads qualificados' },
              { num: '24/7', label: 'atendimento ativo sem parar' },
              { num: '-70%', label: 'tempo gasto em atendimento manual' },
              { num: '7 dias', label: 'para implementação completa' },
            ].map((s, i) => (
              <div key={i} className="stat-item reveal" style={{ textAlign: 'center' }}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVIÇOS ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag reveal">Funcionalidades</div>
            <h2 className="section-title reveal">Tudo que você precisa para <span className="highlight">automatizar</span></h2>
            <p className="section-sub reveal" style={{ margin: '0 auto' }}>
              Da qualificação ao fechamento, nossa IA cuida de cada etapa do processo de vendas no WhatsApp.
            </p>
          </div>
          <div className="services-grid">
            {[
              { icon: '🤖', title: 'IA para WhatsApp', desc: 'Chatbot com IA avançada que conversa naturalmente, entende contexto e qualifica leads automaticamente.' },
              { icon: '🎯', title: 'Qualificação de Leads', desc: 'Perguntas inteligentes que identificam o perfil do cliente e separam quem está pronto para comprar.' },
              { icon: '⚡', title: 'Respostas em Segundos', desc: 'Nenhum cliente fica esperando. A IA responde imediatamente, 24h por dia, até nos feriados.' },
              { icon: '🔗', title: 'Integração com CRM', desc: 'Sincroniza com seu CRM automaticamente. Todos os leads e conversas organizados em um lugar.' },
              { icon: '📊', title: 'Relatórios em Tempo Real', desc: 'Dashboard com taxa de resposta, leads gerados, conversões e ROI da automação em tempo real.' },
              { icon: '💰', title: 'Automação de Vendas', desc: 'Funil completo: apresentação, proposta, follow-up e fechamento automatizados no WhatsApp.' },
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

      {/* ── COMO FUNCIONA ── */}
      <section className="section">
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center', gap: '4rem' }}>
            <div>
              <div className="section-tag reveal">Como Funciona</div>
              <h2 className="section-title reveal">Em <span className="highlight">7 dias</span> sua automação está ativa</h2>
              <p className="section-sub reveal">Processo simples e guiado. Nossa equipe cuida da implementação completa.</p>
            </div>
            <div className="timeline reveal">
              {[
                { n: 'Dia 01', t: 'Diagnóstico gratuito', d: 'Analisamos seu processo de vendas e mapeamos as oportunidades de automação.' },
                { n: 'Dia 02–03', t: 'Configuração da IA', d: 'Treinamos a IA com o perfil do seu negócio, produtos e tom de voz da sua marca.' },
                { n: 'Dia 04–05', t: 'Testes e ajustes', d: 'Simulamos conversas reais e refinamos as respostas até ficarem perfeitas.' },
                { n: 'Dia 06–07', t: 'Go live!', d: 'Ativamos a automação. Você começa a receber leads qualificados automaticamente.' },
              ].map((tl, i) => (
                <div key={i} className="tl-item">
                  <div className="tl-num">{tl.n}</div>
                  <div className="tl-title">{tl.t}</div>
                  <div className="tl-desc">{tl.d}</div>
                </div>
              ))}
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
              { stars: '★★★★★', text: '"Aumentamos em 4x o número de leads qualificados no primeiro mês. A IA responde melhor do que alguns vendedores humanos."', name: 'Mariana Costa', role: 'CEO · Clínica Estética MS', emoji: '👩‍⚕️' },
              { stars: '★★★★★', text: '"Antes perdíamos 60% dos leads por demora no atendimento. Hoje a IA responde em segundos e já marca a reunião de venda."', name: 'Rafael Mendes', role: 'Diretor Comercial · Imobiliária Horizonte', emoji: '👨‍💼' },
              { stars: '★★★★★', text: '"Implementamos em uma semana. No segundo mês já tínhamos pago o investimento de um ano só com os leads que a IA gerou."', name: 'Juliana Ferreira', role: 'Founder · Escola Online EduTech', emoji: '👩‍💻' },
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
        </div>
      </section>

      <div className="divider" />

      {/* ── FORMULÁRIO DIAGNÓSTICO ── */}
      <section id="diagnostico" className="cta-section">
        <div className="container">
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="section-tag reveal">100% Gratuito</div>
            <h2 className="section-title reveal">
              Faça seu <span className="highlight">diagnóstico gratuito</span>
            </h2>
            <p className="section-sub reveal" style={{ margin: '0 auto' }}>
              Em 15 minutos descobrimos quanto você pode aumentar suas vendas com automação WhatsApp.
            </p>
          </div>
          <div className="card reveal" style={{ maxWidth: '560px', margin: '0 auto' }}>
            <form onSubmit={handleDiagnostico}>
              <div className="form-group">
                <label className="form-label">Seu nome *</label>
                <input name="nome" className="form-input" type="text" placeholder="João Silva" required />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp *</label>
                <input name="whatsapp" className="form-input" type="tel" placeholder="(11) 99999-9999" required />
              </div>
              <div className="form-group">
                <label className="form-label">Seu negócio *</label>
                <input name="negocio" className="form-input" type="text" placeholder="Ex: clínica, imobiliária, e-commerce..." required />
              </div>
              <div className="form-group">
                <label className="form-label">Atendimentos por dia?</label>
                <select name="atendimentos" className="form-input">
                  <option value="">Selecione</option>
                  <option>Menos de 10</option>
                  <option>10 a 50</option>
                  <option>50 a 200</option>
                  <option>Mais de 200</option>
                </select>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={enviando}
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: enviando ? 0.7 : 1 }}
              >
                {enviando ? 'Enviando...' : 'Quero meu diagnóstico gratuito'}
              </button>
              <p className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>
                Sem compromisso. Nossa equipe responde em até 2h.
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
