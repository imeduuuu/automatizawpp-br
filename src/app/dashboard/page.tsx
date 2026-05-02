import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/auth';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
          <p style={{ color: 'var(--muted)' }}>Carregando...</p>
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
