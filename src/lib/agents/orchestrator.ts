import { callAIStructured } from '@/lib/ai/anthropic-client';
import { getPrompt, Language, resolveLanguage } from './prompts';
import { prisma } from '@/lib/db';
import { ChannelType } from '@prisma/client';
import { SalesAgent, AgentContext } from '@/lib/agents/contracts';

export type OrchestratorAction =
  | 'RESPOND'
  | 'QUALIFY'
  | 'HANDLE_OBJECTION'
  | 'CLOSE'
  | 'FOLLOW_UP'
  | 'ESCALATE'
  | 'HOLD';

export interface OrchestratorDecision {
  action: OrchestratorAction;
  reasoning: string;
  targetAgent: string;
  confidence: number;
}

interface OrchestratorInput {
  leadId: string;
  message: string;
  channel: ChannelType;
}

/**
 * Sprint 2.2 V.L.A.E.G. — Detecção de palavras-chave críticas para escalação.
 * Sprint 2.4-B V.L.A.E.G. — Refatoração: regex word-boundary Unicode + 3 listas
 * (PTBR_ONLY, ES_ONLY, COMMON) para evitar falsos positivos e atribuir o idioma
 * correto a partir do `leadLanguage` quando a keyword é comum aos dois idiomas.
 *
 * Quando uma mensagem inbound contém termos sensíveis (queja, abogado, processar, etc.),
 * o Orchestrator deve forçar `ESCALATE` antes de chamar o LLM. Isso:
 *   1. Reduz latência (evita chamada ao LLM quando o caso é óbvio).
 *   2. Garante que casos sensíveis SEMPRE escalam (não dependem do LLM).
 *   3. Cobre casos legais/queixa que o LLM poderia minimizar.
 *
 * Detecção case-insensitive em ambos os idiomas, usando `\b` Unicode (`iu`) para
 * evitar matches em substrings (ex.: "superviso a mi equipo" NÃO matcha "supervisor").
 */
const KEYWORDS_PTBR_ONLY = [
  'queixa',
  'reclamação',
  'advogado',
  'denúncia',
  'denunciar',
  'processar',
  'devolução',
  'cancelar assinatura',
  'falar com humano',
  'falar com pessoa',
  'atendente humano',
  'golpe',
  'vergonhoso',
];

const KEYWORDS_ES_ONLY = [
  'queja',
  'abogado',
  'denuncia',
  'denunciar',
  'demanda',
  'demandar',
  'devolución',
  'devolver dinero',
  'cancelar suscripción',
  'hablar con persona',
  'hablar con humano',
  'agente humano',
  'estafa',
  'ladrones',
  'vergonzoso',
];

const KEYWORDS_COMMON = ['supervisor', 'fraude', 'ridículo'];

interface EscalationMatch {
  matched: boolean;
  keyword?: string;
  language?: 'es' | 'pt-BR';
}

/**
 * Escapa caracteres especiais de regex em uma string para uso seguro dentro
 * de `new RegExp()`. Necessário porque algumas keywords contêm acentos e
 * podem ser estendidas no futuro com pontuação.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Constrói uma regex word-boundary Unicode para a keyword.
 * Flags: `i` (case-insensitive) + `u` (Unicode, faz `\b` respeitar acentos).
 */
function buildKeywordRegex(keyword: string): RegExp {
  return new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'iu');
}

/**
 * Verifica se o texto contém alguma palavra-chave crítica que dispara escalação.
 *
 * Estratégia de idioma:
 *   1. Se match em PTBR_ONLY → language='pt-BR'.
 *   2. Se match em ES_ONLY → language='es'.
 *   3. Se match em COMMON → usa `leadLanguage` (default 'es' quando undefined).
 *
 * Ordem de avaliação: PTBR_ONLY → ES_ONLY → COMMON. Isso garante que keywords
 * exclusivas determinem o idioma corretamente antes das compartilhadas.
 */
function detectEscalationKeywords(
  text: string | undefined | null,
  leadLanguage?: 'es' | 'pt-BR'
): EscalationMatch {
  if (!text) return { matched: false };

  for (const kw of KEYWORDS_PTBR_ONLY) {
    if (buildKeywordRegex(kw).test(text)) {
      return { matched: true, keyword: kw, language: 'pt-BR' };
    }
  }

  for (const kw of KEYWORDS_ES_ONLY) {
    if (buildKeywordRegex(kw).test(text)) {
      return { matched: true, keyword: kw, language: 'es' };
    }
  }

  for (const kw of KEYWORDS_COMMON) {
    if (buildKeywordRegex(kw).test(text)) {
      // Tiebreaker: usa o idioma do lead. Default 'es' (consistente com resto do projeto).
      const language: 'es' | 'pt-BR' = leadLanguage ?? 'es';
      return { matched: true, keyword: kw, language };
    }
  }

  return { matched: false };
}

/**
 * Labels bilingue para o context message do Orchestrator.
 * Sprint 1.1 V.L.A.E.G.: substitui os headers EN ("LEAD CONTEXT", "INCOMING MESSAGE", etc.).
 */
function getContextLabels(lang: Language) {
  if (lang === 'pt-BR') {
    return {
      leadContext: 'CONTEXTO DO LEAD',
      id: 'ID',
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      score: 'Score',
      status: 'Status',
      intent: 'Intent',
      urgency: 'Urgência',
      buyingStage: 'Estágio de compra',
      leadMemory: 'MEMÓRIA DO LEAD',
      noMemory: 'Sem memória ainda',
      recentConversations: 'CONVERSAS RECENTES',
      recentMessages: 'MENSAGENS RECENTES',
      noConversations: 'Sem conversas ainda',
      noRecentMessages: 'Sem mensagens recentes',
      incomingMessage: 'MENSAGEM RECEBIDA',
      cta:
        'Com base nesse contexto, selecione a melhor próxima ação para a IA tomar.',
      unknown: 'desconhecido',
      unknownStage: 'awareness',
    };
  }
  return {
    leadContext: 'CONTEXTO DEL LEAD',
    id: 'ID',
    name: 'Nombre',
    email: 'Email',
    phone: 'Teléfono',
    score: 'Score',
    status: 'Estado',
    intent: 'Intent',
    urgency: 'Urgencia',
    buyingStage: 'Etapa de compra',
    leadMemory: 'MEMORIA DEL LEAD',
    noMemory: 'Sin memoria aún',
    recentConversations: 'CONVERSACIONES RECIENTES',
    recentMessages: 'MENSAJES RECIENTES',
    noConversations: 'Sin conversaciones aún',
    noRecentMessages: 'Sin mensajes recientes',
    incomingMessage: 'MENSAJE ENTRANTE',
    cta:
      'Con base en este contexto, selecciona la mejor próxima acción para que la IA tome.',
    unknown: 'desconocido',
    unknownStage: 'awareness',
  };
}

interface ContextInput {
  lead: Record<string, unknown> & {
    id: string;
    status: string;
  };
  incomingMessage: string;
  channel: string;
  lang: Language;
}

/**
 * Constrói o contexto do Orchestrator a partir do registro Prisma do lead.
 * Aceita lang para escolher labels (PT-BR / ES).
 */
function buildOrchestratorContext(input: ContextInput): string {
  const { lead, incomingMessage, channel, lang } = input;
  const labels = getContextLabels(lang);

  const conversations = Array.isArray(lead.conversations) ? lead.conversations : [];
  const recentConversations = conversations
    .slice(0, 5)
    .map((c: Record<string, unknown>) => {
      const createdAt = c.createdAt || '';
      const ch = c.channel || '';
      const msg = c.body || '';
      return `[${createdAt}] ${ch}: ${msg}`;
    })
    .join('\n');

  return `
${labels.leadContext}:
- ${labels.id}: ${lead.id || labels.unknown}
- ${labels.name}: ${lead.fullName || labels.unknown}
- ${labels.email}: ${lead.email || 'N/A'}
- ${labels.phone}: ${lead.phone || 'N/A'}
- ${labels.score}: ${lead.leadScoreValue || 0}/100
- ${labels.status}: ${lead.status || labels.unknown}
- ${labels.intent}: ${lead.intentLevel || labels.unknown}
- ${labels.urgency}: ${lead.urgencyLevel || labels.unknown}
- ${labels.buyingStage}: ${lead.buyingStage || labels.unknownStage}

${labels.leadMemory}:
${lead.memory ? JSON.stringify(lead.memory, null, 2) : labels.noMemory}

${labels.recentConversations}:
${recentConversations || labels.noConversations}

${labels.incomingMessage} (${channel}):
"${incomingMessage}"

${labels.cta}`;
}

export async function runOrchestratorAgent(input: OrchestratorInput): Promise<OrchestratorDecision> {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    include: {
      memory: true,
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      // Sprint 2.4-B V.L.A.E.G. — Necessário para resolver timezone no compliance.
      workspace: {
        select: { timezone: true },
      },
    },
  });

  if (!lead) {
    throw new Error(`Lead ${input.leadId} not found`);
  }

  // Sprint 1.2 V.L.A.E.G.: idioma do lead controla o prompt + labels.
  const lang: Language = resolveLanguage(lead.preferredLanguage ?? null);

  // Sprint 2.4-B V.L.A.E.G. — Compliance é timezone-aware: usa `workspace.timezone`
  // (default `Europe/Madrid`). Se ausente, fallback UTC com warning interno.
  const workspaceTimezone = lead.workspace?.timezone;
  const complianceCheck = await checkCompliance(lead, workspaceTimezone);
  if (!complianceCheck.allowed) {
    return {
      action: 'HOLD',
      reasoning: `Compliance check failed: ${complianceCheck.reason}`,
      targetAgent: 'compliance',
      confidence: 1.0,
    };
  }

  // Sprint 2.2 V.L.A.E.G.: deteção de palavras-chave críticas → escalação obrigatória.
  // Sprint 2.4-B V.L.A.E.G.: agora com idioma do lead como tiebreaker para keywords COMMON.
  // Executa ANTES do LLM para reduzir latência e garantir que casos sensíveis
  // (queixas, ameaças legais, pedidos de humano) sempre escalam.
  const escalationCheck = detectEscalationKeywords(input.message, lang);
  if (escalationCheck.matched) {
    return {
      action: 'ESCALATE',
      reasoning: `Palavra/frase crítica detectada: "${escalationCheck.keyword}" (idioma=${escalationCheck.language})`,
      targetAgent: 'human',
      confidence: 1.0,
    };
  }

  const contextMessage = buildOrchestratorContext({
    lead: lead as unknown as ContextInput['lead'],
    incomingMessage: input.message,
    channel: input.channel,
    lang,
  });

  const decision = await callAIStructured<OrchestratorDecision>(
    getPrompt('orchestrator', lang),
    contextMessage
  );

  const validActions: OrchestratorAction[] = [
    'RESPOND',
    'QUALIFY',
    'HANDLE_OBJECTION',
    'CLOSE',
    'FOLLOW_UP',
    'ESCALATE',
    'HOLD',
  ];

  // Sprint 1.6 V.L.A.E.G.: callAIStructured agora pode retornar null/objeto inválido.
  // Fallback seguro: se a decisão for nula/inválida, default para RESPOND
  // (o lead já chegou com mensagem inbound, então responder é o comportamento
  // padrão sensato; se compliance não permitir, será bloqueado upstream).
  if (!decision || !validActions.includes(decision.action)) {
    console.error('[runOrchestratorAgent] Invalid/null decision, defaulting to RESPOND', decision);
    return {
      action: 'RESPOND',
      reasoning: 'Fallback: decisão do orchestrator inválida ou nula',
      targetAgent: 'lead-response',
      confidence: 0.5,
    };
  }

  return decision;
}

interface ComplianceResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Sprint 2.4-B V.L.A.E.G. — Compliance check timezone-aware.
 *
 * Calcula a hora local do workspace usando `Intl.DateTimeFormat` com a timezone
 * configurada (por padrão `Europe/Madrid`). Se a timezone for inválida ou
 * ausente, faz fallback para UTC com warning em console — preserva
 * compatibilidade mas avisa explicitamente que o cálculo pode estar errado.
 *
 * Mantém as env vars `QUIET_HOURS_START`, `QUIET_HOURS_END` e
 * `MAX_TOUCHES_PER_DAY` (não muda o contrato de configuração).
 */
async function checkCompliance(
  lead: { optOutAt: Date | null; id: string; conversations?: Record<string, unknown>[] },
  workspaceTimezone?: string
): Promise<ComplianceResult> {
  if (lead.optOutAt) {
    return {
      allowed: false,
      reason: 'Lead has opted out',
    };
  }

  const maxTouchesPerDay = parseInt(process.env.MAX_TOUCHES_PER_DAY || '5', 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const touchesToday = await prisma.conversation.count({
    where: {
      leadId: lead.id,
      createdAt: {
        gte: today,
      },
    },
  });

  if (touchesToday >= maxTouchesPerDay) {
    return {
      allowed: false,
      reason: `Max touches per day (${maxTouchesPerDay}) reached`,
    };
  }

  const quietHoursStart = parseInt(process.env.QUIET_HOURS_START || '21', 10);
  const quietHoursEnd = parseInt(process.env.QUIET_HOURS_END || '9', 10);

  // Cálculo de hora local timezone-aware.
  let currentHour: number;
  if (workspaceTimezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: workspaceTimezone,
        hour: 'numeric',
        hour12: false,
      });
      const parsed = parseInt(formatter.format(new Date()), 10);
      // Defesa: alguns runtimes retornam '24' à meia-noite.
      currentHour = Number.isFinite(parsed) ? parsed % 24 : new Date().getUTCHours();
    } catch (err) {
      console.warn(
        `[checkCompliance] Timezone inválida "${workspaceTimezone}", usando UTC como fallback. Erro:`,
        err
      );
      currentHour = new Date().getUTCHours();
    }
  } else {
    console.warn(
      '[checkCompliance] workspaceTimezone ausente, usando UTC como fallback (pode bloquear horário comercial em BR/ES).'
    );
    currentHour = new Date().getUTCHours();
  }

  const inQuietHours =
    quietHoursStart > quietHoursEnd
      ? currentHour >= quietHoursStart || currentHour < quietHoursEnd
      : currentHour >= quietHoursStart && currentHour < quietHoursEnd;

  if (inQuietHours) {
    return {
      allowed: false,
      reason: `Within quiet hours (${quietHoursStart}:00 - ${quietHoursEnd}:00)`,
    };
  }

  return { allowed: true };
}

/**
 * Construtor de contexto da CLASSE OrchestratorAgent (usa AgentContext em vez de
 * registro Prisma direto). Sprint 1.1 V.L.A.E.G.: agora bilingue, sem duplicação.
 */
function buildOrchestratorContextFromAgentContext(context: AgentContext, lang: Language): string {
  const labels = getContextLabels(lang);
  const lead = context.lead;
  const message = context.message ?? '';

  return `
${labels.leadContext}:
- ${labels.id}: ${lead.id}
- ${labels.name}: ${lead.fullName}
- ${labels.email}: ${lead.email}
- ${labels.phone}: ${lead.phone}
- ${labels.score}: ${lead.leadScoreValue}/100
- ${labels.status}: ${lead.status}
- ${labels.intent}: ${lead.intentLevel}
- ${labels.urgency}: ${lead.urgencyLevel}
- ${labels.buyingStage}: ${lead.buyingStage}

${labels.recentMessages}:
${(context.recentMessages || []).join('\n') || labels.noRecentMessages}

${labels.incomingMessage}:
"${message}"

${labels.cta}`;
}

export class OrchestratorAgent implements SalesAgent {
  name = 'ORCHESTRATOR' as const;

  async run(context: AgentContext) {
    const lead = context.lead;

    const complianceState = context.complianceState ?? {
      dailyTouches: 0,
      maxTouchesPerDay: 5,
      optedOut: false,
      quietHours: false,
    };

    const compliance =
      !complianceState.optedOut &&
      complianceState.dailyTouches < complianceState.maxTouchesPerDay &&
      !complianceState.quietHours;

    if (!compliance) {
      return {
        agent: this.name,
        summary: 'Ação bloqueada por regras de conformidade (compliance)',
        payload: {
          action: 'HOLD',
          reasoning: 'Regras de compliance impedem ação agora',
          targetAgent: 'compliance',
          confidence: 1.0,
        },
      };
    }

    // Sprint 1.2 V.L.A.E.G.: idioma do lead controla o prompt + labels.
    const lang: Language = resolveLanguage(lead.preferredLanguage ?? null);

    // Sprint 2.2 V.L.A.E.G.: deteção de palavras-chave críticas → escalação obrigatória.
    // Sprint 2.4-B V.L.A.E.G.: agora com idioma do lead como tiebreaker para keywords COMMON.
    const escalationCheck = detectEscalationKeywords(context.message, lang);
    if (escalationCheck.matched) {
      const escalationDecision: OrchestratorDecision = {
        action: 'ESCALATE',
        reasoning: `Palavra/frase crítica detectada: "${escalationCheck.keyword}" (idioma=${escalationCheck.language})`,
        targetAgent: 'human',
        confidence: 1.0,
      };
      return {
        agent: this.name,
        summary: `Orquestrador selecionou ação: ESCALATE (palavra-chave crítica)`,
        payload: escalationDecision,
      };
    }

    const contextMessage = buildOrchestratorContextFromAgentContext(context, lang);

    const decision = await callAIStructured<OrchestratorDecision>(
      getPrompt('orchestrator', lang),
      contextMessage
    );

    // Sprint 1.6 V.L.A.E.G.: defesa contra null retornado pelo cliente endurecido.
    const safeDecision: OrchestratorDecision = decision && decision.action
      ? decision
      : {
          action: 'RESPOND',
          reasoning: 'Fallback: decisão nula/inválida do modelo',
          targetAgent: 'lead-response',
          confidence: 0.5,
        };

    return {
      agent: this.name,
      summary: `Orquestrador selecionou ação: ${safeDecision.action}`,
      payload: safeDecision,
    };
  }
}
