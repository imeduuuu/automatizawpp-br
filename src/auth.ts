import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { logAuditEvent } from '@/lib/audit';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // PrismaAdapter removido: incompatível com strategy: 'jwt' (Credentials provider)
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60
  },
  pages: {
    signIn: '/login'
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
            return null;
          }

          const { email, password } = parsed.data;
          const normalizedEmail = email.toLowerCase();

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
          });

          if (!user) {
            return null;
          }

          if (!user.passwordHash) {
            return null;
          }

          const isValidPassword = await verifyPassword(password, user.passwordHash);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            workspaceId: user.workspaceId,
            role: user.role
          };
        } catch (error) {
          console.error('[Auth]authorize error:', error);
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
