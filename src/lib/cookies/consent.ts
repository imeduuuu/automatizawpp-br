// lib/cookies/consent.ts — gestión de consentimiento LGPD
// LGPD Art. 7º + Resolução ANPD nº 4/2024

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookieConsent {
  necessary: true;          // siempre true (técnicamente necesarios)
  analytics: boolean;
  marketing: boolean;
  timestamp: string;        // ISO date
  version: number;          // para invalidar consentimientos antiguos si la política cambia
}

export const CONSENT_VERSION = 1;
export const CONSENT_COOKIE_NAME = 'awpp_cookie_consent';
export const CONSENT_STORAGE_KEY = 'awpp_cookie_consent';
const CONSENT_MAX_AGE_DAYS = 180; // 6 meses (recomendación ANPD)

export function defaultConsent(opts?: { allowAll?: boolean }): CookieConsent {
  return {
    necessary: true,
    analytics: !!opts?.allowAll,
    marketing: !!opts?.allowAll,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION
  };
}

export function readConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CONSENT_VERSION) return null; // requiere nuevo consentimiento
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    // Cookie redundante (para SSR o lectura server-side futura)
    const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))}; path=/; max-age=${maxAge}; samesite=lax`;
    // Notificar a otros componentes (analytics, etc.)
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: consent }));
  } catch { /* ignore */ }
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  document.cookie = `${CONSENT_COOKIE_NAME}=; path=/; max-age=0`;
}
