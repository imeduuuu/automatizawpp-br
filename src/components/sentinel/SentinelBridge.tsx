'use client';

import { useEffect } from 'react';

let scanTriggered = false;
let tickInterval: ReturnType<typeof setInterval> | null = null;

function fireTick() {
  void fetch('/api/system/tick', { method: 'POST' }).catch(() => {});
}

type SentinelPayload = {
  source: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  rawError: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
};

async function reportError(payload: SentinelPayload) {
  try {
    await fetch('/api/sentinel/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!scanTriggered) {
      scanTriggered = true;
      window.setTimeout(() => {
        scanTriggered = false;
      }, 30000);

      void fetch('/api/sentinel/scan-now', { method: 'POST' });
    }
  } catch {
    // Avoid cascading client errors from Sentinel itself.
  }
}

export function SentinelBridge() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (!url.includes('/api/sentinel/') && response.status >= 500) {
        void reportError({
          source: 'frontend',
          severity: 'critical',
          title: `Fetch ${response.status} en ${url}`,
          rawError: `HTTP ${response.status} en ${url}`,
          metadata: {
            status: response.status,
            path: window.location.pathname,
            method: init?.method || 'GET'
          }
        });
      }

      return response;
    };

    const onError = (event: ErrorEvent) => {
      void reportError({
        source: 'frontend',
        severity: 'critical',
        title: `JS error en ${window.location.pathname}`,
        rawError: `${event.message} @ ${event.filename || 'inline'}:${event.lineno}:${event.colno}`,
        metadata: {
          path: window.location.pathname,
          stack: event.error instanceof Error ? event.error.stack : undefined
        }
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.stack || event.reason.message : String(event.reason);
      void reportError({
        source: 'frontend',
        severity: 'warning',
        title: `Promise rejection en ${window.location.pathname}`,
        rawError: reason,
        metadata: { path: window.location.pathname }
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    // Tick automático: follow-ups + sentinel a cada 5 minutos
    fireTick();
    if (!tickInterval) {
      tickInterval = setInterval(fireTick, 5 * 60 * 1000);
    }

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
    };
  }, []);

  return null;
}
