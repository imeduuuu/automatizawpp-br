import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Atendimento WhatsApp 24h com IA — AutomatizaWPP',
  description: 'Suporte ao cliente 24/7 no WhatsApp sem aumentar equipe. Reduza custos em 60% e aumente satisfação em 45%.',
  alternates: { canonical: 'https://www.automatizawpp.com/automacao-atendimento' },
  openGraph: {
    title: 'Atendimento WhatsApp 24h com IA — AutomatizaWPP',
    description: 'Suporte ao cliente 24/7 no WhatsApp sem aumentar equipe.',
    url: 'https://www.automatizawpp.com/automacao-atendimento',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atendimento WhatsApp 24h com IA — AutomatizaWPP',
    description: 'Suporte ao cliente 24/7 no WhatsApp sem aumentar equipe.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
