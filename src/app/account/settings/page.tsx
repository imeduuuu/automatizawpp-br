'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import { showToast } from '@/lib/ui-toast';

type LeadsPayload = {
  leads: Array<{
    fullName: string;
    email?: string | null;
    company?: string | null;
    phone?: string | null;
  }>;
};

const emptyLeads: LeadsPayload = { leads: [] };

export default function AccountSettingsPage() {
  const copy = useUiCopy();
  const leadsApi = useApi<LeadsPayload>('/api/leads', emptyLeads);
  const firstLead = useMemo(() => leadsApi.data.leads[0], [leadsApi.data.leads]);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    empresa: '',
    telefono: ''
  });

  useEffect(() => {
    if (firstLead) {
      setForm({
        nombre: firstLead.fullName ?? '',
        email: firstLead.email ?? '',
        empresa: firstLead.company ?? '',
        telefono: firstLead.phone ?? ''
      });
    }
  }, [firstLead]);

  return (
    <PageLayout title={copy.account.settingsPageTitle}>
      {leadsApi.error ? <div className="ds-card ds-muted">{copy.common.error}: {leadsApi.error}</div> : null}

      <section className="ds-card">
        <h2 className="ds-title">{copy.account.dataTitle}</h2>
        {leadsApi.loading ? (
          <div className="ds-grid" style={{ marginTop: 10 }}>
            <Skeleton height={34} />
            <Skeleton height={34} />
            <Skeleton height={34} />
            <Skeleton height={34} />
          </div>
        ) : (
          <form
            style={{ marginTop: 10, display: 'grid', gap: 10, maxWidth: 520 }}
            onSubmit={(event) => {
              event.preventDefault();
              showToast(copy.account.savedSuccess, 'success');
            }}
          >
            <div>
              <label className="ds-label">{copy.common.name}</label>
              <input className="ds-input" value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} />
            </div>
            <div>
              <label className="ds-label">{copy.common.email}</label>
              <input className="ds-input" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div>
              <label className="ds-label">{copy.common.company}</label>
              <input className="ds-input" value={form.empresa} onChange={(event) => setForm((current) => ({ ...current, empresa: event.target.value }))} />
            </div>
            <div>
              <label className="ds-label">{copy.common.phone}</label>
              <input className="ds-input" value={form.telefono} onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))} />
            </div>
            <button type="submit" className="ds-button ds-button-primary">
              {copy.common.save}
            </button>
          </form>
        )}
      </section>
    </PageLayout>
  );
}
