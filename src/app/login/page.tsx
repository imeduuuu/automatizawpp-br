import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from '@/components/auth/login-form';
import { AuthPageShell } from '@/components/auth/auth-page-shell';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; reset?: string }> }) {
  const session = await auth();
  if (session?.user?.id) {
    redirect('/dashboard');
  }

  const params = await searchParams;

  return (
    <AuthPageShell
      eyebrow="Acesso"
      title="Entrar"
      subtitle="Acesse a sua área privada para gerir os seus serviços ativos do AutomatizaWPP."
      footer={
        <>
          <p>
            Não tem conta?{' '}
            <Link href="/signup" style={{ fontWeight: 600, textDecoration: 'underline' }}>
              Criar conta
            </Link>
          </p>
          <p className="mt-2">
            <Link href="/forgot-password" style={{ fontWeight: 600, textDecoration: 'underline' }}>
              Esqueci minha senha
            </Link>
          </p>
          {params.reset === 'success' ? <p className="ds-card" style={{ marginTop: 8, padding: 8, background: 'var(--green-light)' }}>Senha atualizada. Já pode entrar.</p> : null}
        </>
      }
    >
      <LoginForm callbackUrl={params.callbackUrl} />
    </AuthPageShell>
  );
}
