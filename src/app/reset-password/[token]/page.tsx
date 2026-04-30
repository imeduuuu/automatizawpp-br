import Link from 'next/link';
import { getValidPasswordResetToken } from '@/lib/auth/password-reset';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default async function ResetPasswordTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenRecord = await getValidPasswordResetToken(token);

  if (!tokenRecord) {
    return (
        <AuthPageShell
          eyebrow="Recuperação"
          title="Link inválido"
          subtitle="O link expirou ou já foi utilizado. Solicite um novo."
        >
          <div className="mt-6">
            <Link href="/forgot-password" style={{ fontWeight: 600, textDecoration: 'underline' }}>
              Solicitar novo link
            </Link>
          </div>
        </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Recuperação"
      title="Nova senha"
      subtitle="Defina uma senha segura para acessar sua conta."
      footer={
        <p>
          Lembrou seu acesso?{' '}
          <Link href="/login" style={{ fontWeight: 600, textDecoration: 'underline' }}>
            Entrar
          </Link>
        </p>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthPageShell>
  );
}
