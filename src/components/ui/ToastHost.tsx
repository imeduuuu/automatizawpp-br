'use client';

import { useEffect, useRef, useState } from 'react';
import type { ToastDetail, ToastTone } from '@/lib/ui-toast';

type ToastState = {
  id: number;
  message: string;
  tone: ToastTone;
};

export function ToastHost() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function clearTimer() {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<ToastDetail>;
      const detail = customEvent.detail;
      if (!detail?.message) return;

      clearTimer();
      setToast({
        id: Date.now(),
        message: detail.message,
        tone: detail.tone ?? 'success'
      });
      timeoutRef.current = window.setTimeout(() => {
        setToast(null);
        timeoutRef.current = null;
      }, 3200);
    }

    window.addEventListener('bf:toast', handleToast as EventListener);

    return () => {
      clearTimer();
      window.removeEventListener('bf:toast', handleToast as EventListener);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="ds-toast-host" aria-live="polite">
      <div key={toast.id} className={`ds-toast ds-toast-${toast.tone}`}>
        <span className="ds-toast-title">{toast.tone === 'error' ? 'Erro' : 'Guardado'}</span>
        <p className="ds-toast-message">{toast.message}</p>
        <button type="button" className="ds-toast-close" onClick={() => setToast(null)} aria-label="Fechar aviso">
          Fechar
        </button>
      </div>
    </div>
  );
}
