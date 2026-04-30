'use client';

import Link from 'next/link';
import { PageLayout } from '@/components/ui/PageLayout';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';

export default function AccountPage() {
  const copy = useUiCopy();

  return (
    <PageLayout title={copy.nav.settings}>
      <section className="ds-grid ds-grid-3">
        <article className="ds-card">
          <h2 className="ds-title">{copy.account.billingTitle}</h2>
          <p className="ds-subtitle">{copy.account.billingSubtitle}</p>
          <Link href="/account/billing" className="ds-button ds-button-secondary" style={{ marginTop: 10, display: 'inline-flex' }}>
            {copy.account.open}
          </Link>
        </article>
        <article className="ds-card">
          <h2 className="ds-title">{copy.account.settingsTitle}</h2>
          <p className="ds-subtitle">{copy.account.settingsSubtitle}</p>
          <Link href="/account/settings" className="ds-button ds-button-secondary" style={{ marginTop: 10, display: 'inline-flex' }}>
            {copy.account.open}
          </Link>
        </article>
        <article className="ds-card">
          <h2 className="ds-title">{copy.account.securityTitle}</h2>
          <p className="ds-subtitle">{copy.account.securitySubtitle}</p>
          <Link href="/account/security" className="ds-button ds-button-secondary" style={{ marginTop: 10, display: 'inline-flex' }}>
            {copy.account.open}
          </Link>
        </article>
      </section>
    </PageLayout>
  );
}
