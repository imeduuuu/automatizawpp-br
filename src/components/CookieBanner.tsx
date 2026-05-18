'use client';

import { useEffect, useState } from 'react';
import { defaultConsent, readConsent, saveConsent, type CookieConsent } from '@/lib/cookies/consent';

type View = 'banner' | 'preferences' | 'hidden';

export function CookieBanner() {
  const [view, setView] = useState<View>('hidden');
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setView('banner');
    } else {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }
  }, []);

  const acceptAll = () => {
    saveConsent(defaultConsent({ allowAll: true }));
    setView('hidden');
  };

  const rejectAll = () => {
    saveConsent(defaultConsent({ allowAll: false }));
    setView('hidden');
  };

  const savePreferences = () => {
    const consent: CookieConsent = {
      necessary: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
      version: 1
    };
    saveConsent(consent);
    setView('hidden');
  };

  if (view === 'hidden') return null;

  return (
    <>
      <style>{`
        .awpp-cookie-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 9998;
          animation: awppCookieFadeIn 0.3s ease;
        }
        .awpp-cookie-banner {
          position: fixed;
          left: 50%; bottom: 24px;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 720px;
          background: #0a0a0a;
          border: 1px solid rgba(0, 255, 65, 0.3);
          border-radius: 16px;
          padding: 24px 28px;
          z-index: 9999;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,65,0.06);
          color: #fff;
          font-family: 'Manrope','SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif;
          animation: awppCookieSlideUp 0.4s ease;
        }
        @keyframes awppCookieFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes awppCookieSlideUp { from { transform: translate(-50%, 100%); opacity: 0 } to { transform: translate(-50%, 0); opacity: 1 } }

        .awpp-cookie-title { font-size: 15px; font-weight: 700; margin: 0 0 8px; color: #fff; }
        .awpp-cookie-text { font-size: 13px; line-height: 1.5; color: rgba(255,255,255,0.75); margin: 0 0 16px; }
        .awpp-cookie-text a { color: #25D366; text-decoration: underline; }

        .awpp-cookie-buttons {
          display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end;
        }
        .awpp-cookie-btn {
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid;
          transition: opacity 0.2s, background 0.2s;
          font-family: inherit;
        }
        .awpp-cookie-btn:hover { opacity: 0.85; }
        .awpp-cookie-btn-primary {
          background: #25D366; border-color: #25D366; color: #000;
        }
        .awpp-cookie-btn-secondary {
          background: transparent; border-color: rgba(255,255,255,0.2); color: #fff;
        }
        .awpp-cookie-btn-link {
          background: transparent; border-color: transparent; color: rgba(255,255,255,0.6);
        }

        .awpp-cookie-prefs { display: flex; flex-direction: column; gap: 12px; margin: 8px 0 20px; }
        .awpp-cookie-pref {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 12px 14px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
        }
        .awpp-cookie-pref-toggle {
          flex-shrink: 0; width: 36px; height: 20px;
          background: rgba(255,255,255,0.15);
          border-radius: 10px; position: relative; cursor: pointer;
          transition: background 0.2s;
          border: none;
        }
        .awpp-cookie-pref-toggle::after {
          content: ''; position: absolute; top: 2px; left: 2px;
          width: 16px; height: 16px; border-radius: 50%; background: #fff;
          transition: left 0.2s;
        }
        .awpp-cookie-pref-toggle.on { background: #25D366; }
        .awpp-cookie-pref-toggle.on::after { left: 18px; }
        .awpp-cookie-pref-toggle.disabled { background: rgba(0, 255, 65, 0.4); cursor: not-allowed; opacity: 0.7; }
        .awpp-cookie-pref-content { flex: 1; min-width: 0; }
        .awpp-cookie-pref-title { font-size: 13px; font-weight: 700; color: #fff; margin: 0 0 4px; display: flex; gap: 8px; align-items: center; }
        .awpp-cookie-pref-badge { font-size: 10px; background: rgba(0,255,65,0.2); color: #25D366; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .awpp-cookie-pref-desc { font-size: 12px; color: rgba(255,255,255,0.6); margin: 0; line-height: 1.45; }

        @media (max-width: 600px) {
          .awpp-cookie-banner { padding: 20px; bottom: 12px; }
          .awpp-cookie-buttons { justify-content: stretch; flex-direction: column; }
          .awpp-cookie-btn { width: 100%; }
        }
      `}</style>

      {view === 'preferences' && <div className="awpp-cookie-overlay" onClick={() => setView('banner')} />}

      <div className="awpp-cookie-banner" role="dialog" aria-labelledby="awpp-cookie-title" aria-describedby="awpp-cookie-text">
        {view === 'banner' && (
          <>
            <h2 id="awpp-cookie-title" className="awpp-cookie-title">🍪 Usamos cookies para melhorar sua experiência</h2>
            <p id="awpp-cookie-text" className="awpp-cookie-text">
              Utilizamos cookies necessários para o funcionamento do site e, com seu consentimento, cookies de análise e marketing.
              Você pode aceitar todos, rejeitar todos ou personalizar suas preferências. Saiba mais na nossa{' '}
              <a href="/politica-de-cookies">Política de Cookies</a> e{' '}
              <a href="/privacidade">Política de Privacidade</a>.
              Esta escolha está em conformidade com a <strong>LGPD (Lei 13.709/2018)</strong>.
            </p>
            <div className="awpp-cookie-buttons">
              <button className="awpp-cookie-btn awpp-cookie-btn-link" onClick={() => setView('preferences')}>
                Personalizar
              </button>
              <button className="awpp-cookie-btn awpp-cookie-btn-secondary" onClick={rejectAll}>
                Rejeitar tudo
              </button>
              <button className="awpp-cookie-btn awpp-cookie-btn-primary" onClick={acceptAll}>
                Aceitar tudo
              </button>
            </div>
          </>
        )}

        {view === 'preferences' && (
          <>
            <h2 className="awpp-cookie-title">Preferências de cookies</h2>
            <p className="awpp-cookie-text">
              Escolha quais categorias de cookies deseja permitir. Pode alterar essas preferências a qualquer momento na nossa{' '}
              <a href="/politica-de-cookies">Política de Cookies</a>.
            </p>

            <div className="awpp-cookie-prefs">
              <div className="awpp-cookie-pref">
                <button className="awpp-cookie-pref-toggle on disabled" aria-label="Necessários (obrigatório)" disabled />
                <div className="awpp-cookie-pref-content">
                  <p className="awpp-cookie-pref-title">
                    Necessários <span className="awpp-cookie-pref-badge">Sempre ativos</span>
                  </p>
                  <p className="awpp-cookie-pref-desc">
                    Cookies essenciais para o funcionamento do site (autenticação, sessão, segurança). Não podem ser desativados — sem eles o site não funciona.
                  </p>
                </div>
              </div>

              <div className="awpp-cookie-pref">
                <button
                  className={`awpp-cookie-pref-toggle ${analytics ? 'on' : ''}`}
                  onClick={() => setAnalytics(!analytics)}
                  aria-label="Análise"
                  aria-pressed={analytics}
                />
                <div className="awpp-cookie-pref-content">
                  <p className="awpp-cookie-pref-title">Análise</p>
                  <p className="awpp-cookie-pref-desc">
                    Cookies que nos ajudam a entender como o site é usado (páginas visitadas, tempo na página) para melhorar a experiência. Ex: Google Analytics.
                  </p>
                </div>
              </div>

              <div className="awpp-cookie-pref">
                <button
                  className={`awpp-cookie-pref-toggle ${marketing ? 'on' : ''}`}
                  onClick={() => setMarketing(!marketing)}
                  aria-label="Marketing"
                  aria-pressed={marketing}
                />
                <div className="awpp-cookie-pref-content">
                  <p className="awpp-cookie-pref-title">Marketing</p>
                  <p className="awpp-cookie-pref-desc">
                    Cookies usados para personalizar anúncios e medir campanhas. Ex: Meta Pixel, Google Ads.
                  </p>
                </div>
              </div>
            </div>

            <div className="awpp-cookie-buttons">
              <button className="awpp-cookie-btn awpp-cookie-btn-link" onClick={() => setView('banner')}>
                Voltar
              </button>
              <button className="awpp-cookie-btn awpp-cookie-btn-secondary" onClick={rejectAll}>
                Rejeitar tudo
              </button>
              <button className="awpp-cookie-btn awpp-cookie-btn-primary" onClick={savePreferences}>
                Salvar preferências
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
