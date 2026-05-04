import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const payload = await getSession();

  if (!payload) {
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
