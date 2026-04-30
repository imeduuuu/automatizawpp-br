'use client';

import type { ReactNode } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopBar } from '@/components/ui/TopBar';
import { ToastHost } from '@/components/ui/ToastHost';
import { useTranslatedTitle } from '@/components/ui/UiLanguageProvider';

type PageLayoutProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  badges?: Partial<Record<string, number>>;
};

export function PageLayout({ title, actions, children, badges }: PageLayoutProps) {
  const translatedTitle = useTranslatedTitle(title);

  return (
    <div className="ds-layout">
      <ToastHost />
      <Sidebar badges={badges} />
      <div className="ds-main">
        <TopBar title={translatedTitle} actions={actions} />
        <main className="ds-content">{children}</main>
      </div>
    </div>
  );
}
