type AlexLeadContext = {
  sector?: string | null;
  company?: string | null;
  phone?: string | null;
};

type AlexAssistantSnapshot = {
  firstMessage?: string | null;
  model?: Record<string, unknown> | null;
  voice?: Record<string, unknown> | null;
  maxDurationSeconds?: number | null;
  endCallMessage?: string | null;
  artifactPlan?: Record<string, unknown> | null;
  backgroundSound?: string | null;
  backgroundDenoisingEnabled?: boolean | null;
  silenceTimeoutSeconds?: number | null;
  responseDelaySeconds?: number | null;
  llmRequestDelaySeconds?: number | null;
  numWordsToInterruptAssistant?: number | null;
};

function getTodayDate() {
  const formatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Madrid'
  });
  return formatter.format(new Date());
}

function replaceTemplateVars(value: string | undefined | null, lead: AlexLeadContext) {
  return (value || '')
    .replaceAll('{{TODAY_DATE}}', getTodayDate())
    .replaceAll('{{SECTOR}}', lead.sector?.trim() || 'negocio local')
    .replaceAll('{{COMPANY_NAME}}', lead.company?.trim() || 'AutomatizaWPP')
    .replaceAll('{{CONTACT_PHONE}}', lead.phone?.trim() || 'este numero')
    .replaceAll('{{CONTACTO_PHONE}}', lead.phone?.trim() || 'este numero');
}

export function buildAlexCallOverrides(assistant: AlexAssistantSnapshot, lead: AlexLeadContext) {
  const model = (assistant.model as Record<string, unknown> | null) || {};
  const voice = (assistant.voice as Record<string, unknown> | null) || {};
  const artifactPlan = (assistant.artifactPlan as Record<string, unknown> | null) || {};

  return {
    firstMessage: replaceTemplateVars(assistant.firstMessage as string | undefined, lead),
    model: {
      ...model,
      systemPrompt: replaceTemplateVars(model.systemPrompt as string | undefined, lead)
    },
    voice,
    maxDurationSeconds: assistant.maxDurationSeconds ?? 600,
    endCallMessage: assistant.endCallMessage ?? undefined,
    artifactPlan,
    backgroundSound: assistant.backgroundSound ?? undefined,
    backgroundDenoisingEnabled: assistant.backgroundDenoisingEnabled ?? undefined,
    silenceTimeoutSeconds: assistant.silenceTimeoutSeconds ?? undefined,
    responseDelaySeconds: assistant.responseDelaySeconds ?? undefined,
    llmRequestDelaySeconds: assistant.llmRequestDelaySeconds ?? undefined,
    numWordsToInterruptAssistant: assistant.numWordsToInterruptAssistant ?? undefined
  };
}
