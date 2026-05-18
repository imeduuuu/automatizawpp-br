import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cases de Sucesso — AutomatizaWPP',
  description: 'Histórias reais de empresas brasileiras que aumentaram vendas com automação WhatsApp IA. Resultados em 7 dias.',
  alternates: { canonical: 'https://www.automatizawpp.com/casos-sucesso' },
  openGraph: {
    title: 'Cases de Sucesso — AutomatizaWPP',
    description: 'Histórias reais de empresas brasileiras que aumentaram vendas com automação WhatsApp IA.',
    url: 'https://www.automatizawpp.com/casos-sucesso',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cases de Sucesso — AutomatizaWPP',
    description: 'Histórias reais de empresas brasileiras com automação WhatsApp IA.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
