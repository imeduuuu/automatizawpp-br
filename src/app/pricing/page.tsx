'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;

      cardsRef.current.forEach((card) => {
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;

        const distX = clientX - cardCenterX;
        const distY = clientY - cardCenterY;

        const rotateX = (distY / rect.height) * 15;
        const rotateY = (distX / rect.width) * -15;

        const glowX = (distX / rect.width) * 100;
        const glowY = (distY / rect.height) * 100;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        card.style.setProperty('--glow-x', `${50 + glowX * 0.1}%`);
        card.style.setProperty('--glow-y', `${50 + glowY * 0.1}%`);
      });
    };

    const handleMouseLeave = () => {
      cardsRef.current.forEach((card) => {
        if (!card) return;
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const plans = [
    {
      name: 'Starter',
      price: '197',
      description: 'Perfeito para começar',
      features: [
        'CRM com até 500 conversas/mês',
        '1 número WhatsApp Business',
        'Respostas automáticas 24h',
        'Email scraper até 100 leads/mês',
        'Suporte por e-mail',
        'Trial 14 dias grátis'
      ],
      cta: 'Começar grátis',
      highlighted: false,
      link: '/automacao-whatsapp#diagnostico'
    },
    {
      name: 'Pro',
      price: '497',
      description: 'Mais vendas, menos trabalho',
      features: [
        'Até 2.000 conversas/mês',
        '3 números WhatsApp Business',
        'Automação avançada com IA',
        'Templates personalizados',
        'Email scraper ilimitado',
        'Google Reviews monitoring',
        'Suporte por WhatsApp',
        'Trial 14 dias grátis'
      ],
      cta: 'Ativar Pro',
      highlighted: true,
      link: '/automacao-whatsapp#diagnostico'
    },
    {
      name: 'Scale',
      price: '997',
      description: 'Automação total de vendas',
      features: [
        'Conversas ilimitadas',
        'Números WhatsApp ilimitados',
        'Todos os recursos do Pro',
        'IA avançada (Claude 4)',
        'Sentinel — monitoramento 24h',
        'Chamadas automáticas (Alex)',
        'API customizável',
        'Account manager dedicado',
        'Trial 14 dias grátis'
      ],
      cta: 'Ativar Scale',
      highlighted: false,
      link: '/automacao-whatsapp#diagnostico'
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-[#080808] via-[#0a0a0a] to-[#0f0f0f] overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

        :root {
          --glow-x: 50%;
          --glow-y: 50%;
        }

        * {
          font-family: 'Inter', sans-serif;
        }

        .pricing-card {
          transition: transform 0.1s ease-out;
          position: relative;
        }

        .pricing-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at var(--glow-x) var(--glow-y),
            rgba(37, 211, 102, 0.15) 0%,
            rgba(37, 211, 102, 0) 50%
          );
          pointer-events: none;
          border-radius: 16px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .pricing-card:hover::before {
          opacity: 1;
        }

        .pricing-card:hover {
          box-shadow:
            0 20px 60px rgba(37, 211, 102, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .pricing-card.highlighted {
          border-color: #25D366;
          background: linear-gradient(135deg, rgba(37, 211, 102, 0.05) 0%, rgba(37, 211, 102, 0) 100%);
        }

        .pricing-card.highlighted::after {
          content: 'MAIS POPULAR';
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #25D366;
          color: #054a1e;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          z-index: 10;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0;
          animation: slideIn 0.6s ease forwards;
        }

        .feature-item:nth-child(1) { animation-delay: 0.1s; }
        .feature-item:nth-child(2) { animation-delay: 0.15s; }
        .feature-item:nth-child(3) { animation-delay: 0.2s; }
        .feature-item:nth-child(4) { animation-delay: 0.25s; }
        .feature-item:nth-child(5) { animation-delay: 0.3s; }
        .feature-item:nth-child(6) { animation-delay: 0.35s; }
        .feature-item:nth-child(7) { animation-delay: 0.4s; }
        .feature-item:nth-child(8) { animation-delay: 0.45s; }
        .feature-item:nth-child(9) { animation-delay: 0.5s; }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .price-number {
          animation: fadeInScale 0.8s ease forwards;
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .cta-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .cta-button:hover::before {
          left: 100%;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(37, 211, 102, 0.3);
        }

        .header-text {
          animation: fadeInUp 0.8s ease forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header */}
      <div className="pt-32 pb-20 text-center">
        <div className="header-text">
          <h1 className="text-6xl font-900 text-white mb-4 tracking-tight">
            Planos Transparentes
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Sem surpresas. Sem contratos de longa duração. Cancele quando quiser.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCiclo('mensal')}
              className={`px-6 py-2 rounded-lg text-sm font-600 transition ${ciclo === 'mensal' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setCiclo('anual')}
              className={`px-6 py-2 rounded-lg text-sm font-600 transition ${ciclo === 'anual' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">-20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              ref={(el) => {
                if (el) cardsRef.current[index] = el;
              }}
              className={`pricing-card relative rounded-2xl border p-8 backdrop-blur-sm transition-all duration-300 ${
                plan.highlighted
                  ? 'border-green-500/50 md:scale-105'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Card Content */}
              <div className="relative z-20">
                <h3 className="text-2xl font-700 text-white mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="price-number text-5xl font-900 text-white">
                      R$ {plan.price}
                    </span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Faturado mensalmente • Trial 14 dias grátis
                  </p>
                </div>

                {/* CTA Button */}
                <Link
                  href={plan.link}
                  className={`cta-button w-full py-3 rounded-xl font-600 mb-8 transition-all duration-300 flex items-center justify-center ${
                    plan.highlighted
                      ? 'bg-green-500 text-black hover:bg-green-400'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="border-t border-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-700 text-white mb-4">Dúvidas sobre os planos?</h2>
          <p className="text-gray-400 mb-8">
            Fale com a gente por e-mail ou agende uma demo de 15 minutos sem compromisso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:contato@automatizawpp.com"
              className="px-6 py-3 rounded-xl bg-green-500 text-black font-600 hover:bg-green-400 transition"
            >
              Falar por e-mail
            </a>
            <Link
              href="/automacao-whatsapp#diagnostico"
              className="px-6 py-3 rounded-xl border border-gray-700 text-white hover:border-gray-600 transition"
            >
              Agendar demo grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
