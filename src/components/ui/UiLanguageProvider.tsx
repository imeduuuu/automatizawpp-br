'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { UI_LANGUAGE_COOKIE, getUiCopy, resolveUiLanguage, translateAppTitle, type UiLanguage } from '@/lib/ui-language';

type UiLanguageContextValue = {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
};

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

function readCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>('pt');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(UI_LANGUAGE_COOKIE) : null;
    const cookie = readCookie(UI_LANGUAGE_COOKIE);
    const nextLanguage = resolveUiLanguage(stored ?? cookie);
    setLanguageState(nextLanguage);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLanguage;
    }
  }, []);

  const value = useMemo<UiLanguageContextValue>(
    () => ({
      language,
      setLanguage: (nextLanguage) => {
        const resolved = resolveUiLanguage(nextLanguage);
        setLanguageState(resolved);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(UI_LANGUAGE_COOKIE, resolved);
        }
        writeCookie(UI_LANGUAGE_COOKIE, resolved);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = resolved;
        }
      }
    }),
    [language]
  );

  return <UiLanguageContext.Provider value={value}>{children}</UiLanguageContext.Provider>;
}

export function useUiLanguage() {
  const context = useContext(UiLanguageContext);
  if (!context) {
    throw new Error('useUiLanguage must be used within UiLanguageProvider');
  }

  return context;
}

export function useUiCopy() {
  const { language } = useUiLanguage();
  return getUiCopy(language);
}

export function useTranslatedTitle(title: string) {
  const { language } = useUiLanguage();
  return translateAppTitle(title, language);
}
