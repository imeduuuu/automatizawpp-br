import type { UiLanguage } from '@/lib/ui-language';

type LabelMap = Record<string, string>;

function fromMap(map: Record<UiLanguage, LabelMap>, language: UiLanguage, key: string): string {
  return map[language][key] ?? map.pt[key] ?? key;
}

const LEAD_STATUS_LABELS: Record<UiLanguage, LabelMap> = {
  pt: {
    NEW: 'Novo',
    CONTACTED: 'Contactado',
    QUALIFYING: 'Qualificando',
    NURTURING: 'Nutrição',
    SALES_READY: 'Pronto para vendas',
    NEGOTIATION: 'Negociação',
    BOOKED: 'Agendado',
    WON: 'Ganho',
    LOST: 'Perdido',
    PAUSED: 'Pausado'
  },
  es: {
    NEW: 'Nuevo',
    CONTACTED: 'Contactado',
    QUALIFYING: 'Cualificando',
    NURTURING: 'Nutrición',
    SALES_READY: 'Listo para ventas',
    NEGOTIATION: 'Negociación',
    BOOKED: 'Reservado',
    WON: 'Ganado',
    LOST: 'Perdido',
    PAUSED: 'Pausado'
  },
  ca: {
    NEW: 'Nou',
    CONTACTED: 'Contactat',
    QUALIFYING: 'Qualificant',
    NURTURING: 'Nodrint',
    SALES_READY: 'Preparat per vendes',
    NEGOTIATION: 'Negociació',
    BOOKED: 'Reservat',
    WON: 'Guanyat',
    LOST: 'Perdut',
    PAUSED: 'Pausat'
  },
  en: {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFYING: 'Qualifying',
    NURTURING: 'Nurturing',
    SALES_READY: 'Sales ready',
    NEGOTIATION: 'Negotiation',
    BOOKED: 'Booked',
    WON: 'Won',
    LOST: 'Lost',
    PAUSED: 'Paused'
  }
};

const CHANNEL_LABELS: Record<UiLanguage, LabelMap> = {
  pt: {
    WEB_CHAT: 'Chat web',
    EMAIL: 'E-mail',
    SMS: 'SMS',
    WHATSAPP: 'WhatsApp',
    INSTAGRAM_DM: 'Instagram DM',
    FACEBOOK_MESSENGER: 'Facebook Messenger',
    VOICE: 'Voz',
    INTERNAL: 'Interno'
  },
  es: {
    WEB_CHAT: 'Chat web',
    EMAIL: 'Correo',
    SMS: 'SMS',
    WHATSAPP: 'WhatsApp',
    INSTAGRAM_DM: 'Instagram DM',
    FACEBOOK_MESSENGER: 'Facebook Messenger',
    VOICE: 'Voz',
    INTERNAL: 'Interno'
  },
  ca: {
    WEB_CHAT: 'Xat web',
    EMAIL: 'Correu',
    SMS: 'SMS',
    WHATSAPP: 'WhatsApp',
    INSTAGRAM_DM: 'Instagram DM',
    FACEBOOK_MESSENGER: 'Facebook Messenger',
    VOICE: 'Veu',
    INTERNAL: 'Intern'
  },
  en: {
    WEB_CHAT: 'Web chat',
    EMAIL: 'Email',
    SMS: 'SMS',
    WHATSAPP: 'WhatsApp',
    INSTAGRAM_DM: 'Instagram DM',
    FACEBOOK_MESSENGER: 'Facebook Messenger',
    VOICE: 'Voice',
    INTERNAL: 'Internal'
  }
};

const DIRECTION_LABELS: Record<UiLanguage, LabelMap> = {
  pt: { INBOUND: 'Entrada', OUTBOUND: 'Saída', INTERNAL: 'Interno' },
  es: { INBOUND: 'Entrante', OUTBOUND: 'Saliente', INTERNAL: 'Interno' },
  ca: { INBOUND: 'Entrant', OUTBOUND: 'Sortint', INTERNAL: 'Intern' },
  en: { INBOUND: 'Inbound', OUTBOUND: 'Outbound', INTERNAL: 'Internal' }
};

const CALL_OUTCOME_LABELS: Record<UiLanguage, LabelMap> = {
  pt: {
    BOOKED: 'Agendada',
    NO_ANSWER: 'Sem resposta',
    FAILED: 'Falhou',
    FOLLOW_UP_REQUIRED: 'Requer acompanhamento',
    CONNECTED: 'Conectada',
    INTERESTED: 'Interessado',
    NOT_INTERESTED: 'Não interessado'
  },
  es: {
    BOOKED: 'Reservada',
    NO_ANSWER: 'Sin respuesta',
    FAILED: 'Fallida',
    FOLLOW_UP_REQUIRED: 'Requiere seguimiento',
    CONNECTED: 'Conectada',
    INTERESTED: 'Interesado',
    NOT_INTERESTED: 'No interesado'
  },
  ca: {
    BOOKED: 'Reservada',
    NO_ANSWER: 'Sense resposta',
    FAILED: 'Fallida',
    FOLLOW_UP_REQUIRED: 'Requereix seguiment',
    CONNECTED: 'Connectada',
    INTERESTED: 'Interessat',
    NOT_INTERESTED: 'No interessat'
  },
  en: {
    BOOKED: 'Booked',
    NO_ANSWER: 'No answer',
    FAILED: 'Failed',
    FOLLOW_UP_REQUIRED: 'Follow-up required',
    CONNECTED: 'Connected',
    INTERESTED: 'Interested',
    NOT_INTERESTED: 'Not interested'
  }
};

const FOLLOW_UP_STATUS_LABELS: Record<UiLanguage, LabelMap> = {
  pt: { QUEUED: 'Na fila', SENT: 'Enviado', COMPLETED: 'Concluído', SKIPPED: 'Ignorado', CANCELLED: 'Cancelado' },
  es: { QUEUED: 'En cola', SENT: 'Enviado', COMPLETED: 'Completado', SKIPPED: 'Omitido', CANCELLED: 'Cancelado' },
  ca: { QUEUED: 'A la cua', SENT: 'Enviat', COMPLETED: 'Completat', SKIPPED: 'Omès', CANCELLED: 'Cancel·lat' },
  en: { QUEUED: 'Queued', SENT: 'Sent', COMPLETED: 'Completed', SKIPPED: 'Skipped', CANCELLED: 'Cancelled' }
};

const RUN_STATUS_LABELS: Record<UiLanguage, LabelMap> = {
  pt: { PENDING: 'Pendente', RUNNING: 'Em execução', COMPLETED: 'Concluída', FAILED: 'Falhou', CANCELLED: 'Cancelada' },
  es: { PENDING: 'Pendiente', RUNNING: 'En ejecución', COMPLETED: 'Completada', FAILED: 'Fallida', CANCELLED: 'Cancelada' },
  ca: { PENDING: 'Pendent', RUNNING: 'En execució', COMPLETED: 'Completada', FAILED: 'Fallida', CANCELLED: 'Cancel·lada' },
  en: { PENDING: 'Pending', RUNNING: 'Running', COMPLETED: 'Completed', FAILED: 'Failed', CANCELLED: 'Cancelled' }
};

const CONVERSATION_STATE_LABELS: Record<UiLanguage, LabelMap> = {
  pt: { open: 'Aberta', pending: 'Pendente', closed: 'Encerrada', archived: 'Arquivada' },
  es: { open: 'Abierta', pending: 'Pendiente', closed: 'Cerrada', archived: 'Archivada' },
  ca: { open: 'Oberta', pending: 'Pendent', closed: 'Tancada', archived: 'Arxivada' },
  en: { open: 'Open', pending: 'Pending', closed: 'Closed', archived: 'Archived' }
};

const AGENT_NAME_LABELS: Record<UiLanguage, LabelMap> = {
  pt: {
    ORCHESTRATOR: 'Orquestrador',
    LEAD_RESPONSE: 'Resposta ao prospecto',
    QUALIFICATION: 'Qualificação',
    MEMORY: 'Memória',
    OBJECTION_HANDLER: 'Gestão de objeções',
    FOLLOW_UP: 'Acompanhamento',
    CALL_ASSIST: 'Assistência de ligação',
    CLOSER: 'Fechamento',
    SALES_QA: 'QA de vendas',
    WRITER: 'Redator'
  },
  es: {
    ORCHESTRATOR: 'Orquestador',
    LEAD_RESPONSE: 'Respuesta al prospecto',
    QUALIFICATION: 'Cualificación',
    MEMORY: 'Memoria',
    OBJECTION_HANDLER: 'Manejo de objeciones',
    FOLLOW_UP: 'Seguimiento',
    CALL_ASSIST: 'Asistencia de llamada',
    CLOSER: 'Cierre',
    SALES_QA: 'QA de ventas',
    WRITER: 'Redactor'
  },
  ca: {},
  en: {}
};

const INTENT_LABELS: Record<UiLanguage, LabelMap> = {
  pt: { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' },
  es: { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' },
  ca: { LOW: 'Baixa', MEDIUM: 'Mitjana', HIGH: 'Alta' },
  en: { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' }
};

const URGENCY_LABELS: Record<UiLanguage, LabelMap> = {
  pt: { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' },
  es: { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' },
  ca: { LOW: 'Baixa', MEDIUM: 'Mitjana', HIGH: 'Alta' },
  en: { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' }
};

const TRIGGER_TYPE_LABELS: Record<UiLanguage, LabelMap> = {
  pt: {
    new_lead: 'Novo prospecto',
    no_reply_48h: 'Sem resposta em 48h',
    missed_call: 'Ligação perdida',
    INBOUND_EVENT: 'Evento de entrada',
    DEFAULT: 'Gatilho geral'
  },
  es: {
    new_lead: 'Nuevo prospecto',
    no_reply_48h: 'Sin respuesta en 48h',
    missed_call: 'Llamada perdida',
    INBOUND_EVENT: 'Evento entrante',
    DEFAULT: 'Disparador general'
  },
  ca: {
    new_lead: 'Lead nou',
    no_reply_48h: 'Sense resposta en 48h',
    missed_call: 'Trucada perduda',
    INBOUND_EVENT: 'Esdeveniment entrant',
    DEFAULT: 'Disparador general'
  },
  en: {
    new_lead: 'New lead',
    no_reply_48h: 'No reply in 48h',
    missed_call: 'Missed call',
    INBOUND_EVENT: 'Inbound event',
    DEFAULT: 'Default trigger'
  }
};

export function formatLeadStatus(status: string, language: UiLanguage) {
  return fromMap(LEAD_STATUS_LABELS, language, status);
}

export function formatChannel(channel: string, language: UiLanguage) {
  return fromMap(CHANNEL_LABELS, language, channel);
}

export function formatDirection(direction: string, language: UiLanguage) {
  return fromMap(DIRECTION_LABELS, language, direction);
}

export function formatCallOutcome(status: string, language: UiLanguage) {
  return fromMap(CALL_OUTCOME_LABELS, language, status);
}

export function formatFollowUpStatus(status: string, language: UiLanguage) {
  return fromMap(FOLLOW_UP_STATUS_LABELS, language, status);
}

export function formatRunStatus(status: string, language: UiLanguage) {
  return fromMap(RUN_STATUS_LABELS, language, status);
}

export function formatConversationState(status: string, language: UiLanguage) {
  return fromMap(CONVERSATION_STATE_LABELS, language, status);
}

export function formatAgentName(agent: string, language: UiLanguage) {
  return fromMap(AGENT_NAME_LABELS, language, agent);
}

export function formatIntentLevel(level: string, language: UiLanguage) {
  return fromMap(INTENT_LABELS, language, level);
}

export function formatUrgencyLevel(level: string, language: UiLanguage) {
  return fromMap(URGENCY_LABELS, language, level);
}

export function formatTriggerType(trigger: string, language: UiLanguage) {
  return fromMap(TRIGGER_TYPE_LABELS, language, trigger);
}
