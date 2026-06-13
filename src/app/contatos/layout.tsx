import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contato — AutomatizaWPP',
  description: 'Fale com o time da AutomatizaWPP. Diagnóstico gratuito, suporte técnico e parcerias para negócios brasileiros.',
  alternates: { canonical: 'https://www.automatizawpp.com/contatos' },
  openGraph: {
    title: 'Contato — AutomatizaWPP',
    description: 'Fale com o time da AutomatizaWPP. Diagnóstico gratuito, suporte e parcerias.',
    url: 'https://www.automatizawpp.com/contatos',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contato — AutomatizaWPP',
    description: 'Fale com o time da AutomatizaWPP.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
