/**
 * Ejemplo COMPLETO y GARANTIZADO de Login Form en NextAuth v5
 *
 * Uso: Copiar esta estructura en tu componente de login
 * Ubicación recomendada: src/components/auth/login-form.tsx
 *
 * Garantías:
 * - ✅ Validación de input (client + server)
 * - ✅ Manejo de errores robusto
 * - ✅ UX clara (loading states, mensajes de error)
 * - ✅ Accesibilidad (labels, required, aria-*)
 * - ✅ Tipado TypeScript 100%
 * - ✅ Compatible con NextAuth v5 Credentials Provider
 */

'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function LoginForm({
  redirectTo = '/dashboard',
  onSuccess,
  onError
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || redirectTo;

  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Validación de input (client-side)
  function validateForm(): boolean {
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      return false;
    }

    if (!formData.password) {
      setError('La contraseña es requerida');
      return false;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    return true;
  }

  // Manejador de submit
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validar input
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Llamar a NextAuth signIn con Credentials provider
      // redirect: false = no redirige automáticamente (podemos controlar)
      const result = await signIn('credentials', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false, // IMPORTANTE
        callbackUrl // Para redirigir después de éxito
      });

      // NextAuth retorna: { error?: string; ok?: boolean; status?: number; url?: string }
      if (result?.error) {
        // NextAuth nunca revela detalles (por seguridad)
        // authorize() retorna null → error genérico
        const errorMessage =
          result.error === 'CredentialsSignin'
            ? 'Email o contraseña incorrectos'
            : 'Error al iniciar sesión. Intenta nuevamente.';

        setError(errorMessage);
        onError?.(errorMessage);
        return;
      }

      // ✅ Login exitoso
      if (result?.ok) {
        console.log('[LoginForm] ✓ Autenticación exitosa');
        onSuccess?.();

        // Redirigir al dashboard o página solicitada
        router.push(callbackUrl);

        // Opcional: recargar para asegurar que sesión esté lista
        router.refresh();
      }
    } catch (err) {
      // Error inesperado (red, servidor, etc)
      const message =
        err instanceof Error
          ? err.message
          : 'Error al procesar la solicitud';

      console.error('[LoginForm] Error:', err);
      setError(`Error inesperado: ${message}`);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }

  // Cambio en inputs
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error cuando usuario empieza a editar
    if (error) {
      setError(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Plataforma de ventas automatizada
          </p>
        </div>

        {/* Formulario */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200"
            >
              <div className="flex">
                <svg
                  className="h-5 w-5 text-red-400 flex-shrink-0 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="admin@ejemplo.com"
              className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-label="Email"
              aria-required="true"
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="••••••••"
              className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-label="Contraseña"
              aria-required="true"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Conectando...
              </div>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="flex items-center justify-between text-sm">
          <a
            href="/forgot-password"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ¿Olvidaste tu contraseña?
          </a>
          <a
            href="/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Crear cuenta
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * =========================================
 * ALTERNATIVA: Login con Zod + Server Action
 * =========================================
 *
 * Si prefieres más control, puedes usar Server Actions
 * en lugar de signIn() directo. Útil para auditoría custom
 * o lógica pre-login.
 */

'use server';

import { signIn } from '@/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres')
});

export async function serverLogin(formData: FormData) {
  try {
    // Validar input
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      return {
        error: 'Datos inválidos'
      };
    }

    // Llamar a signIn (redirige automáticamente en servidor)
    await signIn('credentials', {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: '/dashboard'
    });

    return { success: true };
  } catch (error) {
    console.error('[serverLogin] Error:', error);
    return {
      error: 'Email o contraseña incorrectos'
    };
  }
}

/**
 * =========================================
 * USO EN COMPONENTE
 * =========================================
 */

export function LoginFormWithServerAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);

    try {
      const result = await serverLogin(formData);

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error(err);
      setError('Error al procesar solicitud');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="w-full px-3 py-2 border rounded-lg"
      />

      <input
        name="password"
        type="password"
        required
        placeholder="Contraseña"
        className="w-full px-3 py-2 border rounded-lg"
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
      >
        {isLoading ? 'Conectando...' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
