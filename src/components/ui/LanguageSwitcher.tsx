'use client';

import { UI_LANGUAGE_OPTIONS } from '@/lib/ui-language';
import { useUiLanguage } from '@/components/ui/UiLanguageProvider';

export function LanguageSwitcher() {
  const { language, setLanguage } = useUiLanguage();

  return (
    <div
      role="group"
      aria-label="Idioma"
      style={{
        display: 'flex',
        gap: 4,
        padding: 3,
        background: 'var(--bg)',
        borderRadius: 6,
        border: '1px solid var(--border)',
        width: '100%'
      }}
    >
      {UI_LANGUAGE_OPTIONS.map((option) => {
        const active = option.value === language;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLanguage(option.value)}
            title={option.label}
            style={{
              flex: 1,
              padding: '4px 0',
              fontSize: 11,
              fontWeight: 700,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: active ? 'var(--green)' : 'transparent',
              color: active ? 'var(--surface)' : 'var(--muted)',
              transition: 'background 0.15s, color 0.15s'
            }}
          >
            {option.short}
          </button>
        );
      })}
    </div>
  );
}
