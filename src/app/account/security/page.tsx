'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import { showToast } from '@/lib/ui-toast';

export default function AccountSecurityPage() {
  const copy = useUiCopy();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <PageLayout title={copy.account.securityPageTitle}>
      <section className="ds-card" style={{ maxWidth: 520 }}>
        <h2 className="ds-title">{copy.account.securitySectionTitle}</h2>
        <form
          style={{ marginTop: 10, display: 'grid', gap: 10 }}
          onSubmit={(event) => {
            event.preventDefault();
            if (nextPassword !== confirmPassword) {
              showToast(copy.account.passwordMismatch, 'error');
              return;
            }
            showToast(copy.account.passwordSaved, 'success');
          }}
        >
          <div>
            <label className="ds-label">{copy.account.currentPassword}</label>
            <input className="ds-input" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          </div>
          <div>
            <label className="ds-label">{copy.account.newPassword}</label>
            <input className="ds-input" type="password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} />
          </div>
          <div>
            <label className="ds-label">{copy.account.confirmPassword}</label>
            <input className="ds-input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </div>
          <button type="submit" className="ds-button ds-button-primary">
            {copy.common.save}
          </button>
        </form>
      </section>
    </PageLayout>
  );
}
