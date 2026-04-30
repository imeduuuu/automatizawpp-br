'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/components/ui/useApi';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';
import type { LeadStatus } from '@/lib/types';

type LeadsPayload = {
  leads: Array<{
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    source?: string | null;
    status: LeadStatus;
    leadScoreValue: number;
  }>;
};

type TabKey = 'empresas' | 'contactos' | 'negocios';

const emptyLeads: LeadsPayload = { leads: [] };

export default function CrmPage() {
  const copy = useUiCopy();
  const leadsApi = useApi<LeadsPayload>('/api/leads', emptyLeads);
  const [tab, setTab] = useState<TabKey>('empresas');

  const companies = useMemo(() => {
    const grouped = new Map<string, { name: string; leads: number; lastSource: string }>();
    leadsApi.data.leads.forEach((lead) => {
      const name = lead.company?.trim() || copy.crm.noCompany;
      const item = grouped.get(name);
      if (item) {
        item.leads += 1;
      } else {
        grouped.set(name, {
          name,
          leads: 1,
          lastSource: lead.source ?? '-'
        });
      }
    });
    return Array.from(grouped.values());
  }, [leadsApi.data.leads, copy.crm.noCompany]);

  const contacts = useMemo(
    () =>
      leadsApi.data.leads.map((lead) => ({
        id: lead.id,
        nombre: lead.fullName,
        empresa: lead.company ?? '-',
        email: lead.email ?? '-',
        telefono: lead.phone ?? '-'
      })),
    [leadsApi.data.leads]
  );

  const deals = useMemo(
    () =>
      leadsApi.data.leads.map((lead) => ({
        id: lead.id,
        negocio: lead.fullName,
        empresa: lead.company ?? '-',
        status: <StatusPill status={lead.status} />,
        valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format((lead.leadScoreValue || 0) * 120)
      })),
    [leadsApi.data.leads]
  );

  const columnsByTab: Record<TabKey, DataTableColumn[]> = {
    empresas: [
      { key: 'empresa', label: copy.crm.colCompany },
      { key: 'leads', label: copy.crm.colLeads },
      { key: 'origen', label: copy.crm.colSource }
    ],
    contactos: [
      { key: 'nombre', label: copy.crm.colName },
      { key: 'empresa', label: copy.crm.colCompany },
      { key: 'email', label: copy.crm.colEmail },
      { key: 'telefono', label: copy.crm.colPhone }
    ],
    negocios: [
      { key: 'negocio', label: copy.crm.colDeal },
      { key: 'empresa', label: copy.crm.colCompany },
      { key: 'status', label: copy.crm.colStatus },
      { key: 'valor', label: copy.crm.colValue }
    ]
  };

  const rowsByTab: Record<TabKey, Array<Record<string, ReactNode>>> = {
    empresas: companies.map((company, index) => ({
      id: `${company.name}-${index}`,
      empresa: company.name,
      leads: company.leads,
      origen: company.lastSource
    })),
    contactos: contacts,
    negocios: deals
  };

  return (
    <PageLayout title={copy.crm.title} badges={{ leads: leadsApi.data.leads.length }}>
      {leadsApi.error ? <div className="ds-card ds-muted">{copy.common.error}: {leadsApi.error}</div> : null}

      <section className="ds-card">
        <div className="ds-tabs">
          <button type="button" className={`ds-tab${tab === 'empresas' ? ' active' : ''}`} onClick={() => setTab('empresas')}>
            {copy.crm.tabCompanies}
          </button>
          <button type="button" className={`ds-tab${tab === 'contactos' ? ' active' : ''}`} onClick={() => setTab('contactos')}>
            {copy.crm.tabContacts}
          </button>
          <button type="button" className={`ds-tab${tab === 'negocios' ? ' active' : ''}`} onClick={() => setTab('negocios')}>
            {copy.crm.tabDeals}
          </button>
        </div>
      </section>

      <section className="ds-card">
        {leadsApi.loading ? (
          <div className="ds-grid">
            <Skeleton height={34} />
            <Skeleton height={34} />
            <Skeleton height={34} />
            <Skeleton height={34} />
          </div>
        ) : (
          <DataTable columns={columnsByTab[tab]} data={rowsByTab[tab]} />
        )}
      </section>
    </PageLayout>
  );
}
