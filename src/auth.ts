import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, isValidBcryptHash } from '@/lib/auth/password';
import { logAuditEvent } from '@/lib/audit';

// Tipos para usuario extendido en sesión
export interface ExtendedUser {
  id: string;
  email: string;
  name?: string | null;
  workspaceId: string;
  role: string;
}

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }
  interface User extends ExtendedUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    workspaceId: string;
    role: string;
  }
}

// Rate limiting en memoria (TODO: migrar a Redis en producción)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(email);

  if (!record) {
    loginAttempts.set(email, { count: 1, resetTime: now + LOCK_TIME_MS });
    return true;
  }

  if (now > record.resetTime) {
    loginAttempts.set(email, { count: 1, resetTime: now + LOCK_TIME_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

function resetRateLimit(email: string): void {
  loginAttempts.delete(email);
}

const credentialsSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres')
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 días
    updateAge: 24 * 60 * 60 // Refrescar cada 24h
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,
    secret: process.env.NEXTAUTH_SECRET
  },
  pages: {
    signIn: '/login',
    error: '/login?error=AuthError'
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(rawCredentials) {
        try {
          const parsed = credentialsSchema.safeParse(rawCredentials);
          if (!parsed.success) {
            console.warn('[Auth.authorize] Validación fallida:', parsed.error.flatten().fieldErrors);
            return null;
          }

          const { email, password } = parsed.data;
          const normalizedEmail = email.toLowerCase();

          // Rate limiting: protección contra fuerza bruta
          if (!checkRateLimit(normalizedEmail)) {
            console.warn(`[Auth.authorize] Rate limit excedido para ${normalizedEmail}`);
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              name: true,
              workspaceId: true,
              role: true,
              passwordHash: true
            }
          });

          if (!user) {
            console.warn('[Auth.authorize] Usuario no encontrado:', normalizedEmail);
            return null;
          }

          if (!user.passwordHash) {
            console.error('[Auth.authorize] Usuario sin hash de contraseña:', user.id);
            return null;
          }

          // Validar formato del hash en BD
          if (!isValidBcryptHash(user.passwordHash)) {
            console.error('[Auth.authorize] Hash bcrypt inválido en BD para usuario:', user.id);
            return null;
          }

          const isValidPassword = await verifyPassword(password, user.passwordHash);
          if (!isValidPassword) {
            console.warn('[Auth.authorize] Contraseña incorrecta para:', normalizedEmail);
            return null;
          }

          // Login exitoso: limpiar rate limit y retornar usuario
          resetRateLimit(normalizedEmail);

          const authUser: ExtendedUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            workspaceId: user.workspaceId,
            role: user.role
          };

          return authUser;
        } catch (error) {
          // Errores críticos (BD, red, etc) - no son fallos de autenticación
          const message = error instanceof Error ? error.message : String(error);
          const code = (error as any)?.code || 'UNKNOWN';
          const isConnectionError = [
            'P1000', // "Authentication failed against database server"
            'P1001', // "Can't reach database server"
            'P1002', // "The database server was reached but timed out"
            'P2002'  // "Unique constraint failed"
          ].includes(code);

          console.error('[Auth.authorize] Error crítico:', {
            type: isConnectionError ? 'DATABASE_ERROR' : 'UNKNOWN_ERROR',
            message,
            code,
            email: normalizedEmail,
            timestamp: new Date().toISOString()
          });
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.workspaceId = (user as { workspaceId?: string }).workspaceId ?? token.workspaceId;
        token.role = (user as { role?: string }).role ?? token.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? '');
        session.user.workspaceId = String(token.workspaceId ?? '');
        session.user.role = String(token.role ?? 'client');
      }

      return session;
    }
  },
  events: {
    async signIn({ user }) {
      await logAuditEvent({
        event: 'AUTH_LOGIN',
        userId: user.id,
        email: user.email
      });
    }
  }
});

export async function getSession() {
  return auth();
}

export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

export async function getCurrentUser(): Promise<ExtendedUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}
