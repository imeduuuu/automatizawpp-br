'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Lenis from 'lenis';
import {
  MessageCircle, Bot, Headphones, Check, ArrowRight, ArrowDown, Sparkles,
  Stethoscope, Building2, UtensilsCrossed, ShoppingBag, Megaphone, GraduationCap,
  UserRound, Zap, CalendarCheck, BarChart3,
} from 'lucide-react';
import type { ScrollState } from '@/components/landing/MountainScene';

// La escena WebGL es client-only (sin SSR).
const MountainScene = dynamic(() => import('@/components/landing/MountainScene'), { ssr: false });

export default function LandingPage() {
  // Estado de scroll compartido con la escena WebGL (progreso 0..1 + velocidad).
  const scrollRef = useRef<ScrollState>({ progress: 0, velocity: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // ── Lenis: scroll suave que mueve la cámara ──
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    const onScroll = (e: { scroll: number; velocity: number }) => {
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current.progress = limit > 0 ? Math.min(Math.max(e.scroll / limit, 0), 1) : 0;
      scrollRef.current.velocity = e.velocity;
    };
    lenis.on('scroll', onScroll);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  // ── Reveal al hacer scroll ──
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.lp-reveal'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.transitionDelay =
              (e.target as HTMLElement).dataset.delay || '0ms';
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ── Contadores animados ──
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
    if (!els.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const target = parseFloat(el.dataset.count || '0');
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';
          const dur = 1700;
          let start: number | null = null;
          const step = (ts: number) => {
            if (start === null) start = ts;
            const p = Math.min((ts - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = prefix + Math.floor(eased * target).toLocaleString('es-ES') + suffix;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = prefix + target.toLocaleString('es-ES') + suffix;
          };
          requestAnimationFrame(step);
          io.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Escena WebGL en vivo + velo */}
      <MountainScene scrollRef={scrollRef} />
      <div className="lp-scene-veil" />

      {/* ── Header ── */}
      <header className="lp-header">
        <a href="#top" className="lp-logo" onClick={closeMenu}>
          <span className="lp-dot"><MessageCircle strokeWidth={2.4} /></span>
          AutomatizaWPP
        </a>
        <nav className="lp-nav">
          <a href="#solucion">Solución</a>
          <a href="#producto">Producto</a>
          <a href="#proceso">Proceso</a>
          <a href="#casos">Casos de uso</a>
        </nav>
        <a href="#cta" className="lp-btn lp-btn-primary lp-btn-sm lp-header-cta">Diagnóstico gratuito</a>
        <button
          type="button"
          className={`lp-burger${menuOpen ? ' open' : ''}`}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="lp-mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </header>

      {/* ── Menú móvil ── */}
      <nav id="lp-mobile-menu" className={`lp-mobile${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <a href="#solucion" onClick={closeMenu}>Solución</a>
        <a href="#producto" onClick={closeMenu}>Producto</a>
        <a href="#proceso" onClick={closeMenu}>Proceso</a>
        <a href="#casos" onClick={closeMenu}>Casos de uso</a>
        <a href="#cta" className="lp-btn lp-btn-primary" onClick={closeMenu}>Diagnóstico gratuito</a>
      </nav>

      <main className="lp-content" id="top">
        {/* ── 1. HERO ── */}
        <section className="lp-hero">
          <div className="lp-container">
            <div className="lp-hero-inner">
              <div className="lp-eyebrow lp-reveal"><Sparkles size={14} /> IA para WhatsApp · 24/7</div>
              <h1 className="lp-h1 lp-reveal" data-delay="80ms">
                Vende más, atiende mejor y <span className="lp-grad">crece en automático</span>.
              </h1>
              <p className="lp-lead lp-hero-sub lp-reveal" data-delay="160ms">
                Automatiza tu WhatsApp con IA para responder 24/7, cualificar leads y cerrar
                más ventas sin ampliar tu equipo.
              </p>
              <div className="lp-hero-actions lp-reveal" data-delay="240ms">
                <a href="#cta" className="lp-btn lp-btn-primary">Diagnóstico gratuito <ArrowRight size={18} /></a>
                <a href="#producto" className="lp-btn lp-btn-ghost">Ver panel en vivo</a>
              </div>
              <div className="lp-proof lp-reveal" data-delay="320ms">
                <span><b>+200</b>&nbsp;negocios automatizados</span>
                <span className="lp-tick"><Check size={16} /></span>
                <span><b>Listo en 14 días</b></span>
                <span className="lp-tick"><Check size={16} /></span>
                <span>IA entrenada en <b>castellano</b></span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. PROBLEMA ── */}
        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-section-head">
              <div className="lp-eyebrow lp-reveal">El problema</div>
              <h2 className="lp-h2 lp-reveal" data-delay="80ms">
                Tu WhatsApp está lleno de oportunidades que <span className="lp-grad">se enfrían</span>.
              </h2>
            </div>
            <div className="lp-problem-grid">
              {[
                'Leads sin respuesta fuera de horario.',
                'Preguntas repetidas que consumen horas.',
                'Clientes interesados que nadie cualifica.',
                'Seguimientos que se olvidan.',
                'Ventas que se pierden por responder tarde.',
              ].map((t, i) => (
                <div key={i} className="lp-problem lp-reveal" data-delay={`${i * 70}ms`}>
                  <span className="lp-x">✕</span>
                  <p>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. SOLUCIÓN ── */}
        <section className="lp-section" id="solucion">
          <div className="lp-container">
            <div className="lp-section-head">
              <div className="lp-eyebrow lp-reveal">La solución</div>
              <h2 className="lp-h2 lp-reveal" data-delay="80ms">
                Un sistema de <span className="lp-grad">IA dentro de tu WhatsApp</span>.
              </h2>
            </div>
            <div className="lp-sol-grid">
              {[
                { icon: <MessageCircle size={24} />, t: 'Automatización WhatsApp', d: 'Chatbot con IA que responde, cualifica y agenda 24/7.' },
                { icon: <Bot size={24} />, t: 'Automatización de ventas', d: 'Del primer mensaje al pago: seguimiento, propuesta y cierre automatizado.' },
                { icon: <Headphones size={24} />, t: 'Atención 24h', d: 'Soporte siempre activo con escalado humano cuando hace falta.' },
              ].map((s, i) => (
                <div key={i} className="lp-glass lp-sol lp-reveal" data-delay={`${i * 90}ms`}>
                  <div className="lp-icon">{s.icon}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. PRODUCTO (dashboard) ── */}
        <section className="lp-section" id="producto">
          <div className="lp-container">
            <div className="lp-section-head">
              <div className="lp-eyebrow lp-reveal">Producto</div>
              <h2 className="lp-h2 lp-reveal" data-delay="80ms">
                Tu centro de mando de <span className="lp-grad">conversaciones e ingresos</span>.
              </h2>
            </div>
            <div className="lp-glass lp-dash lp-reveal" data-delay="120ms">
              <div className="lp-dash-bar">
                <i style={{ background: '#ff5f57' }} /><i style={{ background: '#febc2e' }} /><i style={{ background: '#28c840' }} />
                <span className="lp-dash-title">AutomatizaWPP · Panel en vivo</span>
              </div>
              <div className="lp-dash-grid">
                <div className="lp-tile">
                  <h4>Conversaciones en vivo</h4>
                  <div className="lp-chat">
                    <div className="lp-msg in">Hola, ¿hacéis envíos a Madrid?</div>
                    <div className="lp-msg out">¡Hola! Sí 🚀 ¿Para cuándo lo necesitas? Te preparo una propuesta.</div>
                    <div className="lp-msg in">Esta semana si puede ser</div>
                    <div className="lp-msg out">Perfecto. ¿Te va bien reservar el martes a las 10:00?</div>
                  </div>
                </div>
                <div className="lp-tile">
                  <h4>Lead score</h4>
                  <div className="lp-score"><span className="v" data-count="92" data-suffix="">0</span><span style={{ color: 'var(--text-soft)' }}>/100</span></div>
                  <div className="lp-bar"><i style={{ width: '92%' }} /></div>
                  <div className="lp-row" style={{ marginTop: '1rem' }}><span>Intención</span><b>Alta</b></div>
                  <div className="lp-row"><span>Estado CRM</span><span className="lp-pill">Cualificado</span></div>
                </div>
                <div className="lp-tile">
                  <h4>Acciones</h4>
                  <div className="lp-row"><span><CalendarCheck size={15} style={{ verticalAlign: '-2px', color: 'var(--blue)' }} /> Cita</span><b>Mar 10:00</b></div>
                  <div className="lp-row"><span><BarChart3 size={15} style={{ verticalAlign: '-2px', color: 'var(--blue)' }} /> ROI mes</span><b>+3.4×</b></div>
                  <div className="lp-row"><span>Prioridad</span><span className="lp-pill warm">Caliente</span></div>
                  <a href="#cta" className="lp-btn lp-btn-ghost lp-btn-sm lp-handoff"><UserRound size={15} /> Pasar a humano</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. PROCESO ── */}
        <section className="lp-section" id="proceso">
          <div className="lp-container">
            <div className="lp-section-head">
              <div className="lp-eyebrow lp-reveal">Proceso</div>
              <h2 className="lp-h2 lp-reveal" data-delay="80ms">
                De tu WhatsApp actual a un sistema funcionando en <span className="lp-grad">14 días</span>.
              </h2>
            </div>
            <div className="lp-steps">
              {[
                { n: '01', t: 'Diagnóstico', d: 'Una llamada de 20 minutos para entender tu negocio.' },
                { n: '02', t: 'Diseño del flujo', d: 'Diseñamos la conversación que convierte.' },
                { n: '03', t: 'Entrenamiento IA', d: 'Entrenamos la IA con tu negocio y tu tono.' },
                { n: '04', t: 'Integración', d: 'WhatsApp Business, CRM y calendario conectados.' },
                { n: '05', t: 'Prueba real', d: '15 días funcionando en tu propio WhatsApp.' },
              ].map((s, i) => (
                <div key={i} className="lp-step lp-reveal" data-delay={`${i * 70}ms`}>
                  <span className="n">{s.n}</span>
                  <h4>{s.t}</h4>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. RESULTADOS ── */}
        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-section-head">
              <div className="lp-eyebrow lp-reveal">Resultados</div>
              <h2 className="lp-h2 lp-reveal" data-delay="80ms">Números que <span className="lp-grad">cambian el negocio</span>.</h2>
            </div>
            <div className="lp-results">
              <div className="lp-result lp-reveal">
                <div className="v"><span className="lp-grad" data-count="300" data-prefix="+" data-suffix="%">+0%</span></div>
                <p>leads cualificados</p>
              </div>
              <div className="lp-result lp-reveal" data-delay="80ms">
                <div className="v"><span className="lp-grad" data-count="65" data-prefix="-" data-suffix="%">-0%</span></div>
                <p>coste por venta</p>
              </div>
              <div className="lp-result lp-reveal" data-delay="160ms">
                <div className="v"><span className="lp-grad">24/7</span></div>
                <p>atención automática</p>
              </div>
              <div className="lp-result lp-reveal" data-delay="240ms">
                <div className="v"><span className="lp-grad" data-count="0" data-suffix="">0</span></div>
                <p>leads olvidados</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. CASOS DE USO ── */}
        <section className="lp-section" id="casos">
          <div className="lp-container">
            <div className="lp-section-head">
              <div className="lp-eyebrow lp-reveal">Casos de uso</div>
              <h2 className="lp-h2 lp-reveal" data-delay="80ms">Pensado para <span className="lp-grad">tu sector</span>.</h2>
            </div>
            <div className="lp-uses">
              {[
                { icon: <Stethoscope size={22} />, t: 'Clínicas', d: 'Agenda citas, envía recordatorios y reduce ausencias automáticamente.' },
                { icon: <Building2 size={22} />, t: 'Inmobiliarias', d: 'Cualifica compradores y coordina visitas sin perder ningún lead.' },
                { icon: <UtensilsCrossed size={22} />, t: 'Restaurantes', d: 'Gestiona reservas y pedidos 24/7 sin saturar al equipo.' },
                { icon: <ShoppingBag size={22} />, t: 'E-commerce', d: 'Recupera carritos, resuelve dudas y aumenta la conversión.' },
                { icon: <Megaphone size={22} />, t: 'Agencias', d: 'Atiende y cualifica los leads de tus campañas al instante.' },
                { icon: <GraduationCap size={22} />, t: 'Infoproductos', d: 'Responde, nutre y cierra ventas de tus cursos en automático.' },
              ].map((u, i) => (
                <div key={i} className="lp-glass lp-use lp-reveal" data-delay={`${(i % 3) * 80}ms`}>
                  <div className="lp-icon">{u.icon}</div>
                  <h4>{u.t}</h4>
                  <p>{u.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. CONFIANZA ── */}
        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-trust">
              <div>
                <div className="lp-eyebrow lp-reveal">Control humano</div>
                <h2 className="lp-h2 lp-reveal" data-delay="80ms" style={{ margin: '1.1rem 0' }}>
                  IA con <span className="lp-grad">control humano</span>.
                </h2>
                <p className="lp-lead lp-reveal" data-delay="160ms">
                  La IA responde automáticamente, pero cuando detecta una conversación sensible
                  o una oportunidad importante, pasa el contexto completo a una persona de tu
                  equipo. Nunca pierdes el control de lo que de verdad importa.
                </p>
              </div>
              <div className="lp-trust-flow lp-reveal" data-delay="120ms">
                <div className="lp-flow-node ai"><span className="ic"><Bot size={18} /></span> La IA responde y cualifica 24/7</div>
                <div className="lp-flow-arrow"><ArrowDown size={18} /></div>
                <div className="lp-flow-node ai"><span className="ic"><Zap size={18} /></span> Detecta señal sensible u oportunidad clave</div>
                <div className="lp-flow-arrow"><ArrowDown size={18} /></div>
                <div className="lp-flow-node human"><span className="ic"><UserRound size={18} /></span> Pasa el contexto completo a tu equipo</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 10. CTA FINAL ── */}
        <section className="lp-section" id="cta">
          <div className="lp-container">
            <div className="lp-glass lp-finalcta lp-reveal">
              <div className="lp-eyebrow" style={{ position: 'relative' }}><Sparkles size={14} /> Sin tarjeta</div>
              <h2 className="lp-h2">
                Ve la automatización funcionando en <span className="lp-grad">tu propio WhatsApp</span>.
              </h2>
              <p className="lp-lead">
                Agenda un diagnóstico gratuito y prueba el sistema durante 15 días sin tarjeta.
              </p>
              <a href="https://wa.me/34680365779?text=Quiero%20mi%20diagn%C3%B3stico%20gratuito" className="lp-btn lp-btn-primary" style={{ position: 'relative' }}>
                Quiero mi diagnóstico gratuito <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="lp-footer">
          <div className="lp-container lp-footer-grid">
            <a href="#top" className="lp-logo">
              <span className="lp-dot"><MessageCircle strokeWidth={2.4} /></span>
              AutomatizaWPP
            </a>
            <p>© {new Date().getFullYear()} AutomatizaWPP · IA para WhatsApp · España</p>
            <div className="lp-footer-links">
              <a href="/privacidade">Privacidad</a>
              <a href="/termos">Términos</a>
              <a href="/login">Entrar</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
