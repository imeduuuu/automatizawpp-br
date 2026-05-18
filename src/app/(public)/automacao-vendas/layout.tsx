import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Automação de Vendas no WhatsApp — AutomatizaWPP',
  description: 'Funil de vendas automático no WhatsApp: qualificação, proposta, follow-up e fechamento. Aumente conversão em até 300%.',
  alternates: { canonical: 'https://www.automatizawpp.com/automacao-vendas' },
  openGraph: {
    title: 'Automação de Vendas no WhatsApp — AutomatizaWPP',
    description: 'Funil de vendas automático no WhatsApp: qualificação, proposta, follow-up e fechamento.',
    url: 'https://www.automatizawpp.com/automacao-vendas',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automação de Vendas no WhatsApp — AutomatizaWPP',
    description: 'Funil de vendas automático no WhatsApp com IA.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
