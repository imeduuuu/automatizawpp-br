import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { SignupForm } from '@/components/auth/signup-form';

export default async function SignupPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect('/dashboard');
  }

  return (
    <AuthPageShell
      eyebrow="Cadastro"
      title="Crie sua conta"
      subtitle="Ative o seu painel privado para acessar os serviços de automação e conversão do AutomatizaWPP."
      footer={
        <p>
          Já tem conta?{' '}
          <Link href="/login" style={{ fontWeight: 600, textDecoration: 'underline' }}>
            Entrar
          </Link>
        </p>
      }
    >
      <SignupForm />
    </AuthPageShell>
  );
}
