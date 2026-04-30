import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { UiLanguageProvider } from '@/components/ui/UiLanguageProvider';
import { SentinelBridge } from '@/components/sentinel/SentinelBridge';

export const metadata: Metadata = {
  title: 'AutomatizaWPP — Área do cliente',
  description: 'Área privada para clientes dos serviços AutomatizaWPP'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="text-base">
        <UiLanguageProvider>
          <SentinelBridge />
          {children}
        </UiLanguageProvider>
      </body>
    </html>
  );
}
