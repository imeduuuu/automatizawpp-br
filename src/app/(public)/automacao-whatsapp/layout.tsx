import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Automação WhatsApp com IA — AutomatizaWPP',
  description: 'Chatbot WhatsApp com IA que qualifica leads e responde 24h. Implementação em 7 dias. Faça seu diagnóstico gratuito.',
  alternates: { canonical: 'https://www.automatizawpp.com/automacao-whatsapp' },
  openGraph: {
    title: 'Automação WhatsApp com IA — AutomatizaWPP',
    description: 'Chatbot WhatsApp com IA que qualifica leads e responde 24h. Implementação em 7 dias.',
    url: 'https://www.automatizawpp.com/automacao-whatsapp',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automação WhatsApp com IA — AutomatizaWPP',
    description: 'Chatbot WhatsApp com IA que qualifica leads e responde 24h.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
