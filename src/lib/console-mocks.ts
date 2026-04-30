export type HealthStatus = 'online' | 'offline' | 'busy' | 'error';

export type CrmContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  companyId: string;
  owner: string;
  tags: string[];
  leadId?: string;
};

export type CrmCompany = {
  id: string;
  name: string;
  industry: string;
  size: string;
  owner: string;
  tags: string[];
};

export type CrmDeal = {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  pipeline: string;
  owner: string;
  companyId: string;
  contactId: string;
  status: 'active' | 'won' | 'lost';
};

export type CrmTask = {
  id: string;
  title: string;
  dueAt: string;
  owner: string;
  status: 'todo' | 'in_progress' | 'done';
  relatedType: 'lead' | 'deal' | 'conversation';
  relatedId: string;
};

export type CrmPipelineStage = {
  id: string;
  pipeline: string;
  stage: string;
  order: number;
  leadCount: number;
};

export type AgentHealth = {
  agent: string;
  status: HealthStatus;
  queue: number;
  successRate: number;
  latencyMs: number;
  lastSeen: string;
};

export type IntegrationItem = {
  key: string;
  name: string;
  status: 'connected' | 'warning' | 'disconnected';
  note: string;
};

export type KeyWebhookItem = {
  name: string;
  value: string;
  createdAt: string;
  mode: 'api_key' | 'webhook';
};

export type DashboardPoint = {
  label: string;
  value: number;
};

export const DEFAULT_CONVERSATION_TAGS = ['alta-intencion', 'precio', 'seguimiento', 'reserva'];

export const DEFAULT_SEQUENCE_TEMPLATES = [
  'Respuesta rapida en descubrimiento',
  'Reactivacion a 7 dias',
  'Devolucion por ausencia',
  'Cierre de alta intencion',
  'Nutricion post-llamada'
];

export const DEFAULT_SETTINGS_INTEGRATIONS: IntegrationItem[] = [
  { key: 'openai', name: 'OpenAI', status: 'connected', note: 'Razonamiento y resumenes activos.' },
  { key: 'whatsapp', name: 'API de WhatsApp', status: 'connected', note: 'Sincronizacion entrante/saliente activada.' },
  { key: 'calendar', name: 'Google Calendar', status: 'warning', note: 'Reautenticacion requerida en 4 dias.' },
  { key: 'stripe', name: 'Stripe', status: 'connected', note: 'Suscripcion y facturas activas.' },
  { key: 'crm_export', name: 'Exportacion CRM', status: 'disconnected', note: 'Aun no hay destino configurado.' }
];

export const DEFAULT_KEYS_AND_WEBHOOKS: KeyWebhookItem[] = [
  { name: 'Clave publica API', value: 'pk_live_automatizawpp_xxxx', createdAt: '2026-04-12 10:20', mode: 'api_key' },
  { name: 'Webhook de eventos entrantes', value: 'https://automatizawpp.com/api/events/inbound', createdAt: '2026-04-14 09:10', mode: 'webhook' },
  { name: 'Webhook de llamadas salientes', value: 'https://automatizawpp.com/api/calls/outbound', createdAt: '2026-04-14 09:15', mode: 'webhook' }
];

export function buildDashboardSeries(base: number): DashboardPoint[] {
  const safeBase = Math.max(base, 1);

  return [
    { label: 'Lun', value: Math.round(safeBase * 0.7) },
    { label: 'Mar', value: Math.round(safeBase * 0.8) },
    { label: 'Mie', value: Math.round(safeBase * 0.65) },
    { label: 'Jue', value: Math.round(safeBase * 0.9) },
    { label: 'Vie', value: Math.round(safeBase * 1.05) },
    { label: 'Sab', value: Math.round(safeBase * 0.5) },
    { label: 'Dom', value: Math.round(safeBase * 0.6) }
  ];
}

export function buildCrmMocks(
  leads: Array<{ id: string; fullName: string | null; company: string | null; status: string; source: string | null; email: string | null; phone: string | null }>
) {
  const companiesByName = new Map<string, CrmCompany>();

  leads.forEach((lead, index) => {
    const companyName = lead.company || `Empresa ${index + 1}`;
    if (!companiesByName.has(companyName)) {
      companiesByName.set(companyName, {
        id: `company-${companiesByName.size + 1}`,
        name: companyName,
        industry: lead.source || 'General',
        size: ['1-10', '11-50', '51-200'][index % 3],
        owner: ['Ana', 'Marta', 'Iker', 'Nora'][index % 4],
        tags: [lead.status.toLowerCase(), 'crm']
      });
    }
  });

  const companies = Array.from(companiesByName.values());

  const contacts: CrmContact[] = leads.slice(0, 12).map((lead, index) => {
    const company = companies[index % Math.max(companies.length, 1)];

    return {
      id: `contact-${index + 1}`,
      name: lead.fullName || `Contacto ${index + 1}`,
      email: lead.email || `contacto${index + 1}@automatizawpp.com`,
      phone: lead.phone || `+34 600 00 ${String(index + 10).padStart(2, '0')}`,
      role: ['Responsable', 'Manager', 'Marketing', 'Ventas'][index % 4],
      companyId: company?.id || 'company-1',
      owner: ['Ana', 'Marta', 'Iker', 'Nora'][index % 4],
      tags: ['lead', lead.status.toLowerCase()],
      leadId: lead.id
    };
  });

  const deals: CrmDeal[] = contacts.slice(0, 10).map((contact, index) => ({
    id: `deal-${index + 1}`,
    title: `Oportunidad ${contact.name}`,
    value: 1200 + index * 350,
    currency: 'BRL',
    stage: ['Nuevo', 'Cualificado', 'Propuesta', 'Negociacion', 'Ganado'][index % 5],
    pipeline: index % 2 ? 'Embudo pyme' : 'Embudo enterprise',
    owner: contact.owner,
    companyId: contact.companyId,
    contactId: contact.id,
    status: index % 7 === 0 ? 'won' : index % 6 === 0 ? 'lost' : 'active'
  }));

  const tasks: CrmTask[] = contacts.slice(0, 8).map((contact, index) => ({
    id: `task-${index + 1}`,
    title: `Seguimiento ${contact.name}`,
    dueAt: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
    owner: contact.owner,
    status: index % 4 === 0 ? 'done' : index % 3 === 0 ? 'in_progress' : 'todo',
    relatedType: index % 2 ? 'deal' : 'lead',
    relatedId: index % 2 ? `deal-${index + 1}` : contact.leadId || `lead-${index + 1}`
  }));

  const stages = ['Nuevo', 'Cualificado', 'Propuesta', 'Negociacion', 'Ganado'];
  const pipelineStages: CrmPipelineStage[] = stages.map((stage, index) => ({
    id: `stage-${index + 1}`,
    pipeline: 'Embudo pyme',
    stage,
    order: index + 1,
    leadCount: Math.max(1, Math.round((deals.length - index) * 0.8))
  }));

  return { contacts, companies, deals, tasks, pipelineStages };
}

export function asCurrency(value: number, locale = 'pt-BR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}
