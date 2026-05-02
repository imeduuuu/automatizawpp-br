import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session?.userId) {
    redirect('/dashboard');
  }

  return (
    <AuthPageShell
      eyebrow="Recuperação"
      title="Recuperar senha"
      subtitle="Insira seu e-mail e enviaremos um link de redefinição."
      footer={
        <p>
          Voltar para{' '}
          <Link href="/login" style={{ fontWeight: 600, textDecoration: 'underline' }}>
            entrar
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
