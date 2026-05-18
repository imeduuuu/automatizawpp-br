import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teste Grátis 7 dias — AutomatizaWPP',
  description: 'Experimente a AutomatizaWPP grátis por 7 dias. Sem cartão. Configuramos sua automação WhatsApp e você vê resultados.',
  alternates: { canonical: 'https://www.automatizawpp.com/teste-gratis' },
  openGraph: {
    title: 'Teste Grátis 7 dias — AutomatizaWPP',
    description: 'Experimente a AutomatizaWPP grátis por 7 dias. Sem cartão. Resultados em 7 dias.',
    url: 'https://www.automatizawpp.com/teste-gratis',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teste Grátis 7 dias — AutomatizaWPP',
    description: 'Experimente a AutomatizaWPP grátis por 7 dias.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
