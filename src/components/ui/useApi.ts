'use client';

import { useEffect, useState } from 'react';

export function useApi<T>(url: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Envia o Bearer token armazenado no localStorage (área cliente)
        const token = typeof window !== 'undefined' ? localStorage.getItem('dashboard_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`Erro ${response.status}`);
        }
        const payload = (await response.json()) as T;
        if (active) {
          setData(payload);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erro inesperado');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [url]);

  return { data, loading, error, setData };
}
