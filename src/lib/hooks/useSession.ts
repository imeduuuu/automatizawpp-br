/**
 * Hook React para obtener sesión del usuario
 * ==========================================
 * Valida automáticamente y maneja expiración de sesión
 * Totalmente compatible con el nuevo sistema de auth
 */

'use client';

import { useEffect, useState } from 'react';
import { AuthPayload } from '@/lib/auth/auth-core';
import { useRouter } from 'next/navigation';

interface UseSessionReturn {
  session: AuthPayload | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<AuthPayload | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Obtener sesión en el cliente (via API)
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            setStatus('unauthenticated');
            setSession(null);
          } else {
            throw new Error('Failed to fetch session');
          }
          return;
        }

        const data = await response.json();
        setSession(data.user);
        setStatus('authenticated');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setStatus('unauthenticated');
        setSession(null);
      }
    };

    fetchSession();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      setSession(null);
      setStatus('unauthenticated');
      router.push('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
    }
  };

  return {
    session,
    status,
    isLoading: status === 'loading',
    error,
    logout
  };
}
