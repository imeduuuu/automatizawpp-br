import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — AutomatizaWPP',
  description: 'Conteúdo sobre automação WhatsApp, vendas com IA, atendimento ao cliente e estratégias para negócios brasileiros.',
  alternates: { canonical: 'https://www.automatizawpp.com/blog' },
  openGraph: {
    title: 'Blog — AutomatizaWPP',
    description: 'Conteúdo sobre automação WhatsApp, vendas com IA e estratégias para negócios brasileiros.',
    url: 'https://www.automatizawpp.com/blog',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — AutomatizaWPP',
    description: 'Conteúdo sobre automação WhatsApp e vendas com IA.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
