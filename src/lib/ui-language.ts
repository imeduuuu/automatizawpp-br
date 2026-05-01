export const UI_LANGUAGE_COOKIE = 'automatizawpp_lang';

export const UI_LANGUAGE_OPTIONS = [
  { value: 'pt', label: 'Português BR', short: 'PT' },
  { value: 'es', label: 'Español', short: 'ES' },
  { value: 'ca', label: 'Català', short: 'CA' },
  { value: 'en', label: 'English', short: 'EN' }
] as const;

export type UiLanguage = (typeof UI_LANGUAGE_OPTIONS)[number]['value'];

const SUPPORTED_LANGUAGES = new Set<UiLanguage>(UI_LANGUAGE_OPTIONS.map((option) => option.value));

export function resolveUiLanguage(input: string | null | undefined): UiLanguage {
  if (input && SUPPORTED_LANGUAGES.has(input as UiLanguage)) {
    return input as UiLanguage;
  }

  return 'pt';
}

type AppNavCopy = {
  dashboard: string;
  crm: string;
  leads: string;
  conversations: string;
  emails: string;
  calls: string;
  followUps: string;
  sequences: string;
  agentsMonitor: string;
  settings: string;
};

type LeadCopy = {
  detailTitle: string;
  profile: string;
  noCompany: string;
  unknownSource: string;
  leadScore: string;
  closeProbability: string;
  buyingStage: string;
  recommendedNextAction: string;
  memorySummary: string;
  noLongTermSummary: string;
  estimatedMissedRevenue: string;
  conservativeRecovery: string;
  timeline: string;
  noInteractions: string;
  objections: string;
  noObjections: string;
  upcomingFollowUps: string;
  noPendingFollowUps: string;
  callHistory: string;
  noCalls: string;
  noCallSummary: string;
  conversationSummary: string;
};

type CommonCopy = {
  save: string;
  cancel: string;
  loading: string;
  error: string;
  notFound: string;
  open: string;
  new: string;
  active: string;
  inactive: string;
  all: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  date: string;
  actions: string;
  source: string;
  duration: string;
  total: string;
  today: string;
  yesterday: string;
  noData: string;
  escalate: string;
  escalating: string;
  human: string;
  selectMessage: string;
};

type DashboardCopy = {
  title: string;
  refresh: string;
  recentLeads: string;
  salesFunnel: string;
  agentActivity: string;
  totalLeads: string;
  qualified: string;
  mrr: string;
  callsToday: string;
  pipelineFull: string;
  readyForOffer: string;
  recurringRevenue: string;
  conversionRate: string;
  noRecentActivity: string;
  columnName: string;
  columnStatus: string;
  columnTime: string;
  funnelNew: string;
  funnelCallScheduled: string;
  funnelCallAttempted: string;
  funnelQualified: string;
  funnelProposal: string;
  funnelFollowUp: string;
  funnelWon: string;
};

type LeadsListCopy = {
  title: string;
  newLead: string;
  tabAll: string;
  colName: string;
  colCompany: string;
  colPhone: string;
  colStatus: string;
  colLastAction: string;
  colNextAction: string;
  errorCreate: string;
};

type LeadDetailActionsCopy = {
  callNow: string;
  escalateToHuman: string;
  markCold: string;
  escalating: string;
  marking: string;
  noPhone: string;
  escalateFailed: string;
  markColdFailed: string;
  callFailed: string;
  callQueued: string;
  noEvents: string;
  infoTitle: string;
  timelineTitle: string;
  fieldScore: string;
  fieldAssignedTo: string;
};

type ConversationsCopy = {
  title: string;
  listTitle: string;
  detailTitle: string;
  noConversations: string;
  selectPrompt: string;
};

type CallsListCopy = {
  title: string;
  newCall: string;
  colLead: string;
  colNumber: string;
  colOutcome: string;
  colDuration: string;
  colSummary: string;
  colDate: string;
  totalCalls: string;
  callsToday: string;
  avgDuration: string;
  errorCreate: string;
  modalTitle: string;
  modalLeadId: string;
  modalPhone: string;
  modalObjective: string;
  modalCancel: string;
  modalConfirm: string;
};

type CallDetailCopy = {
  title: string;
  outcome: string;
  duration: string;
  start: string;
  end: string;
  notes: string;
  transcript: string;
  noNotes: string;
  noTranscript: string;
};

type FollowUpsCopy = {
  title: string;
  colLead: string;
  colStatus: string;
  colChannel: string;
  colLastAction: string;
  colNextAction: string;
  colAction: string;
  escalateFailed: string;
  runNow: string;
  running: string;
  runSuccess: string;
  runFailed: string;
};

type SequencesCopy = {
  title: string;
  colName: string;
  colSteps: string;
  colActiveLeads: string;
  colOpenRate: string;
};

type AgentsCopy = {
  title: string;
  bundleTitle: string;
  monitorTitle: string;
  recommendationsTitle: string;
  weeklyReportTitle: string;
  statusActive: string;
  statusInactive: string;
  statusPending: string;
  completeActivation: string;
  activateBundle: string;
  reviewBilling: string;
  viewPlans: string;
  domainLabel: string;
  businessIdLabel: string;
  prospectNameLabel: string;
  emailPlaceholder: string;
  companyOptional: string;
  loadError: string;
  executionsToday: string;
  noActivity: string;
  noAgents: string;
  bundleSubtitle: string;
  kpiEmailsValidated: string;
  kpiReviewsReplied: string;
  kpiIcebreakersSent: string;
  kpiAlexStatus: string;
  lastExecution: string;
  lastSync: string;
  lastOutreach: string;
  costPerLead: string;
  ratingChange: string;
  revenueAttr: string;
  launching: string;
  startScan: string;
  syncing: string;
  syncNow: string;
  sending: string;
  sendIcebreaker: string;
  noAlerts: string;
  alexPlaceholder: string;
  generating: string;
  generateReport: string;
  thinking: string;
  askAlexBtn: string;
  noReport: string;
  successRate: string;
  totalRuns: string;
  lastActivity: string;
  activating: string;
  domainRequired: string;
  emailScrapperError: string;
  reviewsError: string;
  icebreakerDone: string;
  alexReplied: string;
  alexReportDone: string;
  scaleActivated: string;
  businessIdRequired: string;
  prospectRequired: string;
  icebreakerError: string;
  alexQuestionRequired: string;
  alexChatError: string;
  alexReportError: string;
  scaleActivateError: string;
  planRequired: string;
  bundleStatusLabel: string;
  pendingProvisionNote: string;
  openBilling: string;
  qualified: string;
  newReviews: string;
  responses: string;
  activeRecommendations: string;
  alexSupervisorDesc: string;
  impact: string;
  week: string;
  monitorSubtitle: string;
  agentLabel: string;
  noRecommendations: string;
};

type CrmCopy = {
  title: string;
  tabCompanies: string;
  tabContacts: string;
  tabDeals: string;
  colCompany: string;
  colLeads: string;
  colSource: string;
  colName: string;
  colEmail: string;
  colPhone: string;
  colDeal: string;
  colStatus: string;
  colValue: string;
  noCompany: string;
  detailTitle: string;
  detailRecord: string;
  notFound: string;
};

type ServicesCopy = {
  title: string;
  noServices: string;
  open: string;
};

type SettingsCopy = {
  title: string;
  tabGeneral: string;
  tabIntegrations: string;
  tabNotifications: string;
  tabAccount: string;
  workspaceName: string;
  language: string;
  brevoWebhook: string;
  mrrActive: string;
  callAlerts: string;
  followUpAlerts: string;
  save: string;
  savedGeneral: string;
  savedIntegrations: string;
  savedNotifications: string;
  savedAccount: string;
  langEs: string;
  langEn: string;
  langPt: string;
};

type AccountCopy = {
  billingTitle: string;
  billingSubtitle: string;
  settingsTitle: string;
  settingsSubtitle: string;
  securityTitle: string;
  securitySubtitle: string;
  open: string;
  settingsPageTitle: string;
  dataTitle: string;
  savedSuccess: string;
  securityPageTitle: string;
  securitySectionTitle: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordMismatch: string;
  passwordSaved: string;
};

type SentinelCopy = {
  title: string;
  subtitle: string;
  statTotal: string;
  statUnresolved: string;
  statCritical: string;
  stat24h: string;
  stat1h: string;
  statAutoFixed: string;
  statusActive: string;
  statusInactive: string;
  filterUnresolved: string;
  filterAll: string;
  allSources: string;
  colSeverity: string;
  colSource: string;
  colMessage: string;
  colDate: string;
  colActions: string;
  scanNow: string;
  scanning: string;
  loading: string;
  noErrors: string;
  resolved: string;
  autoFix: string;
};

export type UiCopy = {
  nav: AppNavCopy;
  shellSubtitle: string;
  switchWorkspace: string;
  languageLabel: string;
  commonTo: string;
  notAvailable: string;
  common: CommonCopy;
  dashboard: DashboardCopy;
  leads: LeadsListCopy;
  lead: LeadCopy;
  leadActions: LeadDetailActionsCopy;
  conversations: ConversationsCopy;
  calls: CallsListCopy;
  callDetail: CallDetailCopy;
  followUps: FollowUpsCopy;
  sequences: SequencesCopy;
  agents: AgentsCopy;
  crm: CrmCopy;
  services: ServicesCopy;
  settings: SettingsCopy;
  account: AccountCopy;
  sentinel: SentinelCopy;
};

const UI_COPY: Record<UiLanguage, UiCopy> = {
  pt: {
    nav: {
      dashboard: 'Painel',
      crm: 'CRM',
      leads: 'Prospectos',
      conversations: 'Conversas',
      emails: 'E-mails',
      calls: 'Ligações',
      followUps: 'Acompanhamentos',
      sequences: 'Sequências',
      agentsMonitor: 'Agentes',
      settings: 'Configurações'
    },
    shellSubtitle: 'Motor de vendas IA multiagente com memória persistente por lead.',
    switchWorkspace: 'Trocar espaço',
    languageLabel: 'Idioma',
    commonTo: 'para',
    notAvailable: 'N/D',
    common: {
      save: 'Salvar',
      cancel: 'Cancelar',
      loading: 'Carregando...',
      error: 'Erro',
      notFound: 'Não encontrado',
      open: 'Abrir',
      new: 'Novo',
      active: 'Ativo',
      inactive: 'Inativo',
      all: 'Todos',
      name: 'Nome',
      email: 'E-mail',
      phone: 'Telefone',
      company: 'Empresa',
      status: 'Status',
      date: 'Data',
      actions: 'Ações',
      source: 'Origem',
      duration: 'Duração',
      total: 'Total',
      today: 'Hoje',
      yesterday: 'Ontem',
      noData: 'Sem dados',
      escalate: 'Escalar',
      escalating: 'Escalando...',
      human: 'Humano',
      selectMessage: 'Selecione uma mensagem'
    },
    dashboard: {
      title: 'Painel',
      refresh: 'Atualizar',
      recentLeads: 'Leads recentes',
      salesFunnel: 'Funil de vendas',
      agentActivity: 'Atividade do Alex',
      totalLeads: 'Total de leads',
      qualified: 'Qualificados',
      mrr: 'MRR',
      callsToday: 'Ligações hoje',
      pipelineFull: 'Pipeline completo',
      readyForOffer: 'Prontos para oferta',
      recurringRevenue: 'Receita recorrente',
      conversionRate: '% conversão geral',
      noRecentActivity: 'Sem atividade recente.',
      columnName: 'Nome',
      columnStatus: 'Status',
      columnTime: 'Hora',
      funnelNew: 'Novo',
      funnelCallScheduled: 'Ligação agendada',
      funnelCallAttempted: 'Ligação tentada',
      funnelQualified: 'Qualificado',
      funnelProposal: 'Proposta',
      funnelFollowUp: 'Acompanhamento',
      funnelWon: 'Ganho'
    },
    leads: {
      title: 'Prospectos',
      newLead: '+ Novo lead',
      tabAll: 'Todos',
      colName: 'Nome',
      colCompany: 'Empresa',
      colPhone: 'Telefone',
      colStatus: 'Status',
      colLastAction: 'Última ação',
      colNextAction: 'Próxima ação',
      errorCreate: 'Não foi possível criar o lead'
    },
    lead: {
      detailTitle: 'Detalhe do lead',
      profile: 'Perfil',
      noCompany: 'Sem empresa',
      unknownSource: 'Origem desconhecida',
      leadScore: 'Pontuação do prospecto',
      closeProbability: 'Prob. fechamento',
      buyingStage: 'Etapa de compra',
      recommendedNextAction: 'Próxima ação recomendada',
      memorySummary: 'Resumo de memória',
      noLongTermSummary: 'Sem resumo de longo prazo ainda.',
      estimatedMissedRevenue: 'Receita perdida estimada',
      conservativeRecovery: 'Recuperação conservadora',
      timeline: 'Linha do tempo',
      noInteractions: 'Sem interações ainda.',
      objections: 'Objeções',
      noObjections: 'Sem objeções registradas.',
      upcomingFollowUps: 'Próximos acompanhamentos',
      noPendingFollowUps: 'Sem acompanhamentos pendentes.',
      callHistory: 'Histórico de ligações e transcrições',
      noCalls: 'Sem ligações ainda.',
      noCallSummary: 'Sem resumo ainda.',
      conversationSummary: 'Resumo da conversa'
    },
    leadActions: {
      callNow: 'Ligar agora',
      escalateToHuman: 'Escalar para humano',
      markCold: 'Marcar como frio',
      escalating: 'Escalando...',
      marking: 'Marcando...',
      noPhone: 'Lead sem telefone para ligar',
      escalateFailed: 'Não foi possível escalar o lead',
      markColdFailed: 'Não foi possível marcar como frio',
      callFailed: 'Não foi possível iniciar a ligação',
      callQueued: 'Ligação enviada para a fila.',
      noEvents: 'Sem eventos para este lead.',
      infoTitle: 'Informações do lead',
      timelineTitle: 'Linha do tempo de eventos',
      fieldScore: 'Score',
      fieldAssignedTo: 'Atribuído a'
    },
    conversations: {
      title: 'Conversas',
      listTitle: 'Lista de conversas',
      detailTitle: 'Detalhe da conversa',
      noConversations: 'Sem conversas disponíveis.',
      selectPrompt: 'Selecione uma conversa na coluna esquerda.'
    },
    calls: {
      title: 'Ligações',
      newCall: 'Nova ligação',
      colLead: 'Lead',
      colNumber: 'Número',
      colOutcome: 'Resultado',
      colDuration: 'Duração',
      colSummary: 'Resumo',
      colDate: 'Data',
      totalCalls: 'Total de ligações',
      callsToday: 'Ligações hoje',
      avgDuration: 'Duração média',
      errorCreate: 'Não foi possível criar a ligação.',
      modalTitle: 'Nova ligação',
      modalLeadId: 'ID do lead',
      modalPhone: 'Telefone (E.164)',
      modalObjective: 'Objetivo',
      modalCancel: 'Cancelar',
      modalConfirm: 'Iniciar ligação'
    },
    callDetail: {
      title: 'Detalhe da ligação',
      outcome: 'Resultado',
      duration: 'Duração',
      start: 'Início',
      end: 'Fim',
      notes: 'Notas',
      transcript: 'Transcrição',
      noNotes: 'Sem notas desta ligação.',
      noTranscript: 'Sem transcrição disponível.'
    },
    followUps: {
      title: 'Acompanhamentos',
      colLead: 'Lead',
      colStatus: 'Status',
      colChannel: 'Canal',
      colLastAction: 'Última ação',
      colNextAction: 'Próxima ação',
      colAction: 'Ação',
      escalateFailed: 'Não foi possível escalar o lead',
      runNow: 'Executar agora',
      running: 'Executando...',
      runSuccess: 'Execução concluída',
      runFailed: 'Falha na execução'
    },
    sequences: {
      title: 'Sequências',
      colName: 'Nome',
      colSteps: 'Etapas',
      colActiveLeads: 'Leads ativos',
      colOpenRate: 'Taxa de abertura'
    },
    agents: {
      title: 'Agentes',
      bundleTitle: 'Bundle Scale',
      monitorTitle: 'Monitor interno de agentes',
      recommendationsTitle: 'Recomendações ativas',
      weeklyReportTitle: 'Relatório semanal ALEX',
      statusActive: 'Ativo',
      statusInactive: 'Inativo',
      statusPending: 'Pendente de ativação',
      completeActivation: 'Completar ativação agora',
      activateBundle: 'Ativar bundle nesta conta',
      reviewBilling: 'Revisar cobrança',
      viewPlans: 'Ver planos',
      domainLabel: 'Domínio',
      businessIdLabel: 'Business ID do Google',
      prospectNameLabel: 'Nome do prospecto',
      emailPlaceholder: 'email@empresa.com',
      companyOptional: 'Empresa (opcional)',
      loadError: 'Não foi possível carregar o bundle Scale.',
      executionsToday: 'Execuções hoje',
      noActivity: 'Sem atividade',
      noAgents: 'Sem execuções de agentes registradas ainda.',
      bundleSubtitle: 'Email Scrapper, Google Reviews, Icebreaker e ALEX Supervisor sobre a arquitetura real da AutomatizaWPP.',
      kpiEmailsValidated: 'E-mails validados',
      kpiReviewsReplied: 'Reviews respondidas',
      kpiIcebreakersSent: 'Icebreakers enviados',
      kpiAlexStatus: 'Status ALEX',
      lastExecution: 'Última execução',
      lastSync: 'Última sincronização',
      lastOutreach: 'Último outreach',
      costPerLead: 'Custo por lead',
      ratingChange: 'Mudança de rating',
      revenueAttr: 'Receita atribuída',
      launching: 'Iniciando...',
      startScan: 'Iniciar varredura',
      syncing: 'Sincronizando...',
      syncNow: 'Sincronizar agora',
      sending: 'Enviando...',
      sendIcebreaker: 'Enviar Icebreaker',
      noAlerts: 'Sem alertas críticos no momento.',
      alexPlaceholder: 'Pergunte ao ALEX por que a resposta caiu, qual agente ajustar primeiro, etc.',
      generating: 'Gerando...',
      generateReport: 'Gerar relatório semanal',
      thinking: 'Pensando...',
      askAlexBtn: 'Perguntar ao ALEX',
      noReport: 'Ainda não há relatório salvo. Gere um pelo ALEX Supervisor.',
      successRate: 'Taxa de sucesso',
      totalRuns: 'Total',
      lastActivity: 'Última atividade',
      activating: 'Ativando...',
      domainRequired: 'Insira um domínio para o Email Scrapper.',
      emailScrapperError: 'Não foi possível iniciar o Email Scrapper.',
      reviewsError: 'Não foi possível sincronizar o Google Reviews.',
      icebreakerDone: 'Icebreaker executado com sucesso.',
      alexReplied: 'ALEX respondeu sua consulta.',
      alexReportDone: 'Relatório semanal do ALEX gerado.',
      scaleActivated: 'Bundle Scale ativado para esta conta.',
      businessIdRequired: 'Insira o businessId do Google.',
      prospectRequired: 'Preencha nome e e-mail do prospecto.',
      icebreakerError: 'Não foi possível iniciar o Icebreaker.',
      alexQuestionRequired: 'Escreva uma pergunta para o ALEX.',
      alexChatError: 'Não foi possível consultar o ALEX.',
      alexReportError: 'Não foi possível gerar o relatório do ALEX.',
      scaleActivateError: 'Não foi possível ativar o Scale.',
      planRequired: 'Plano necessário',
      bundleStatusLabel: 'Status do bundle',
      pendingProvisionNote: 'Seu pedido Scale existe, mas os serviços premium ainda não foram provisionados nesta conta.',
      openBilling: 'Abrir cobrança',
      qualified: 'qualificados',
      newReviews: 'novas',
      responses: 'respostas',
      activeRecommendations: 'recomendações ativas',
      alexSupervisorDesc: 'Resume a saúde do bundle e gera recomendações acionáveis.',
      impact: 'impacto',
      week: 'Semana',
      monitorSubtitle: 'Orquestrador, QA, closer e demais agentes internos do painel.',
      agentLabel: 'Agente',
      noRecommendations: 'ALEX não detecta ajustes urgentes no momento.'
    },
    crm: {
      title: 'CRM',
      tabCompanies: 'Empresas',
      tabContacts: 'Contatos',
      tabDeals: 'Negócios',
      colCompany: 'Empresa',
      colLeads: 'Leads',
      colSource: 'Origem',
      colName: 'Nome',
      colEmail: 'E-mail',
      colPhone: 'Telefone',
      colDeal: 'Negócio',
      colStatus: 'Status',
      colValue: 'Valor',
      noCompany: 'Sem empresa',
      detailTitle: 'Detalhe CRM',
      detailRecord: 'Registro',
      notFound: 'Registro não encontrado.'
    },
    services: {
      title: 'Serviços',
      noServices: 'Nenhum serviço ativo atribuído à sua conta.',
      open: 'Abrir'
    },
    settings: {
      title: 'Configurações',
      tabGeneral: 'Geral',
      tabIntegrations: 'Integrações',
      tabNotifications: 'Notificações',
      tabAccount: 'Conta',
      workspaceName: 'Nome do workspace',
      language: 'Idioma',
      brevoWebhook: 'URL do webhook Brevo',
      mrrActive: 'MRR ativo (dados reais)',
      callAlerts: 'Alertas de ligações',
      followUpAlerts: 'Alertas de acompanhamento',
      save: 'Salvar',
      savedGeneral: 'Dados gerais salvos.',
      savedIntegrations: 'Integrações atualizadas.',
      savedNotifications: 'Notificações atualizadas.',
      savedAccount: 'Dados da conta salvos.',
      langEs: 'Espanhol',
      langEn: 'Inglês',
      langPt: 'Português'
    },
    account: {
      billingTitle: 'Cobrança',
      billingSubtitle: 'Plano, MRR e pagamentos.',
      settingsTitle: 'Configurações da conta',
      settingsSubtitle: 'Nome, e-mail, empresa, telefone.',
      securityTitle: 'Segurança',
      securitySubtitle: 'Atualizar senha de acesso.',
      open: 'Abrir',
      settingsPageTitle: 'Configurações da conta',
      dataTitle: 'Dados da conta',
      savedSuccess: 'Conta salva com sucesso.',
      securityPageTitle: 'Segurança',
      securitySectionTitle: 'Segurança da conta',
      currentPassword: 'Senha atual',
      newPassword: 'Nova senha',
      confirmPassword: 'Confirmar senha',
      passwordMismatch: 'A nova senha e a confirmação não coincidem.',
      passwordSaved: 'Senha salva.'
    },
    sentinel: {
      title: 'Sentinel',
      subtitle: 'Monitor autônomo de erros e integrações',
      statTotal: 'Total',
      statUnresolved: 'Sem resolver',
      statCritical: 'Críticos',
      stat24h: 'Últimas 24h',
      stat1h: 'Última hora',
      statAutoFixed: 'Auto-corrigido',
      statusActive: 'Ativo',
      statusInactive: 'Inativo',
      filterUnresolved: 'Sem resolver',
      filterAll: 'Todos',
      allSources: 'Todas as fontes',
      colSeverity: 'Severidade',
      colSource: 'Fonte',
      colMessage: 'Mensagem',
      colDate: 'Data',
      colActions: 'Ações',
      scanNow: 'Varrer agora',
      scanning: 'Varrendo...',
      loading: 'Carregando...',
      noErrors: 'Sem erros detectados.',
      resolved: 'Resolvido',
      autoFix: 'Auto-correção'
    }
  },
  es: {
    nav: {
      dashboard: 'Panel',
      crm: 'CRM',
      leads: 'Prospectos',
      conversations: 'Conversaciones',
      emails: 'Emails',
      calls: 'Llamadas',
      followUps: 'Seguimientos',
      sequences: 'Secuencias',
      agentsMonitor: 'Agentes',
      settings: 'Ajustes'
    },
    shellSubtitle: 'Motor de ventas IA multiagente con memoria persistente por lead.',
    switchWorkspace: 'Cambiar espacio',
    languageLabel: 'Idioma',
    commonTo: 'a',
    notAvailable: 'N/D',
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      loading: 'Cargando...',
      error: 'Error',
      notFound: 'No encontrado',
      open: 'Abrir',
      new: 'Nuevo',
      active: 'Activo',
      inactive: 'Inactivo',
      all: 'Todos',
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      company: 'Empresa',
      status: 'Estado',
      date: 'Fecha',
      actions: 'Acciones',
      source: 'Origen',
      duration: 'Duración',
      total: 'Total',
      today: 'Hoy',
      yesterday: 'Ayer',
      noData: 'Sin datos',
      escalate: 'Escalar',
      escalating: 'Escalando...',
      human: 'Humano',
      selectMessage: 'Selecciona un mensaje'
    },
    dashboard: {
      title: 'Panel',
      refresh: 'Actualizar',
      recentLeads: 'Leads recientes',
      salesFunnel: 'Embudo de ventas',
      agentActivity: 'Actividad de Alex',
      totalLeads: 'Leads totales',
      qualified: 'Calificados',
      mrr: 'MRR',
      callsToday: 'Llamadas hoy',
      pipelineFull: 'Pipeline completo',
      readyForOffer: 'Listos para oferta',
      recurringRevenue: 'Ingresos recurrentes',
      conversionRate: '% conversión general',
      noRecentActivity: 'Sin actividad reciente.',
      columnName: 'Nombre',
      columnStatus: 'Estado',
      columnTime: 'Tiempo',
      funnelNew: 'Nuevo',
      funnelCallScheduled: 'Llamada agendada',
      funnelCallAttempted: 'Llamada intentada',
      funnelQualified: 'Calificado',
      funnelProposal: 'Propuesta',
      funnelFollowUp: 'Seguimiento',
      funnelWon: 'Ganado'
    },
    leads: {
      title: 'Prospectos',
      newLead: '+ Nuevo lead',
      tabAll: 'Todos',
      colName: 'Nombre',
      colCompany: 'Empresa',
      colPhone: 'Teléfono',
      colStatus: 'Estado',
      colLastAction: 'Última acción',
      colNextAction: 'Próxima acción',
      errorCreate: 'No fue posible crear el lead'
    },
    lead: {
      detailTitle: 'Detalle del lead',
      profile: 'Perfil',
      noCompany: 'Sin empresa',
      unknownSource: 'Fuente desconocida',
      leadScore: 'Puntuación del prospecto',
      closeProbability: 'Prob. cierre',
      buyingStage: 'Etapa de compra',
      recommendedNextAction: 'Próxima acción recomendada',
      memorySummary: 'Resumen de memoria',
      noLongTermSummary: 'Sin resumen de largo plazo todavía.',
      estimatedMissedRevenue: 'Ingreso perdido estimado',
      conservativeRecovery: 'Recuperación conservadora',
      timeline: 'Cronología',
      noInteractions: 'Sin interacciones todavía.',
      objections: 'Objeciones',
      noObjections: 'Sin objeciones registradas.',
      upcomingFollowUps: 'Seguimientos próximos',
      noPendingFollowUps: 'Sin seguimientos pendientes.',
      callHistory: 'Historial de llamadas y transcripciones',
      noCalls: 'Sin llamadas todavía.',
      noCallSummary: 'Sin resumen todavía.',
      conversationSummary: 'Resumen de conversación'
    },
    leadActions: {
      callNow: 'Llamar ahora',
      escalateToHuman: 'Escalar a humano',
      markCold: 'Marcar como frío',
      escalating: 'Escalando...',
      marking: 'Marcando...',
      noPhone: 'Lead sin teléfono para llamada',
      escalateFailed: 'No fue posible escalar el lead',
      markColdFailed: 'No fue posible marcar como frío',
      callFailed: 'No fue posible iniciar la llamada',
      callQueued: 'Llamada enviada a la cola.',
      noEvents: 'Sin eventos para este lead.',
      infoTitle: 'Información del lead',
      timelineTitle: 'Cronología de eventos',
      fieldScore: 'Score',
      fieldAssignedTo: 'Asignado a'
    },
    conversations: {
      title: 'Conversaciones',
      listTitle: 'Lista de conversaciones',
      detailTitle: 'Detalle de la conversación',
      noConversations: 'Sin conversaciones disponibles.',
      selectPrompt: 'Selecciona una conversación en la columna izquierda.'
    },
    calls: {
      title: 'Llamadas',
      newCall: 'Nueva llamada',
      colLead: 'Lead',
      colNumber: 'Número',
      colOutcome: 'Resultado',
      colDuration: 'Duración',
      colSummary: 'Resumen',
      colDate: 'Fecha',
      totalCalls: 'Total llamadas',
      callsToday: 'Llamadas hoy',
      avgDuration: 'Duración media',
      errorCreate: 'No fue posible crear la llamada.',
      modalTitle: 'Nueva llamada',
      modalLeadId: 'ID del lead',
      modalPhone: 'Teléfono (E.164)',
      modalObjective: 'Objetivo',
      modalCancel: 'Cancelar',
      modalConfirm: 'Iniciar llamada'
    },
    callDetail: {
      title: 'Detalle de la llamada',
      outcome: 'Resultado',
      duration: 'Duración',
      start: 'Inicio',
      end: 'Fin',
      notes: 'Notas',
      transcript: 'Transcripción',
      noNotes: 'Sin notas de esta llamada.',
      noTranscript: 'Sin transcripción disponible.'
    },
    followUps: {
      title: 'Seguimientos',
      colLead: 'Lead',
      colStatus: 'Estado',
      colChannel: 'Canal',
      colLastAction: 'Última acción',
      colNextAction: 'Próxima acción',
      colAction: 'Acción',
      escalateFailed: 'No fue posible escalar lead',
      runNow: 'Ejecutar ahora',
      running: 'Ejecutando...',
      runSuccess: 'Ejecución completada',
      runFailed: 'Error en la ejecución'
    },
    sequences: {
      title: 'Secuencias',
      colName: 'Nombre',
      colSteps: 'Pasos',
      colActiveLeads: 'Leads activos',
      colOpenRate: 'Tasa de apertura'
    },
    agents: {
      title: 'Agentes',
      bundleTitle: 'Bundle Scale',
      monitorTitle: 'Monitor interno de agentes',
      recommendationsTitle: 'Recomendaciones activas',
      weeklyReportTitle: 'Reporte semanal ALEX',
      statusActive: 'Activo',
      statusInactive: 'Inactivo',
      statusPending: 'Pendiente de activación',
      completeActivation: 'Completar activación ahora',
      activateBundle: 'Activar bundle en esta cuenta',
      reviewBilling: 'Revisar billing',
      viewPlans: 'Ver planes',
      domainLabel: 'Dominio',
      businessIdLabel: 'Business ID de Google',
      prospectNameLabel: 'Nombre del prospecto',
      emailPlaceholder: 'email@empresa.com',
      companyOptional: 'Empresa (opcional)',
      loadError: 'No se pudo cargar el bundle Scale.',
      executionsToday: 'Ejecuciones hoy',
      noActivity: 'Sin actividad',
      noAgents: 'Sin ejecuciones de agentes registradas todavía.',
      bundleSubtitle: 'Email Scrapper, Google Reviews, Icebreaker y ALEX Supervisor sobre la arquitectura real de AutomatizaWPP.',
      kpiEmailsValidated: 'Emails validados',
      kpiReviewsReplied: 'Reviews respondidas',
      kpiIcebreakersSent: 'Icebreakers enviados',
      kpiAlexStatus: 'Estado ALEX',
      lastExecution: 'Última ejecución',
      lastSync: 'Última sincronización',
      lastOutreach: 'Último outreach',
      costPerLead: 'Coste por lead',
      ratingChange: 'Cambio rating',
      revenueAttr: 'Revenue atribuido',
      launching: 'Lanzando...',
      startScan: 'Iniciar escaneo',
      syncing: 'Sincronizando...',
      syncNow: 'Sincronizar ahora',
      sending: 'Enviando...',
      sendIcebreaker: 'Enviar Icebreaker',
      noAlerts: 'Sin alertas críticas ahora mismo.',
      alexPlaceholder: 'Pregunta a ALEX por qué baja la respuesta, qué agente tocar primero, etc.',
      generating: 'Generando...',
      generateReport: 'Generar reporte semanal',
      thinking: 'Pensando...',
      askAlexBtn: 'Preguntar a ALEX',
      noReport: 'Todavía no hay reporte persistido. Genera uno desde ALEX Supervisor.',
      successRate: 'Tasa de éxito',
      totalRuns: 'Total',
      lastActivity: 'Última actividad',
      activating: 'Activando...',
      domainRequired: 'Introduce un dominio para Email Scrapper.',
      emailScrapperError: 'No se pudo lanzar Email Scrapper.',
      reviewsError: 'No se pudo sincronizar Google Reviews.',
      icebreakerDone: 'Icebreaker ejecutado correctamente.',
      alexReplied: 'ALEX respondió tu consulta.',
      alexReportDone: 'Reporte semanal de ALEX generado.',
      scaleActivated: 'Bundle Scale activado para esta cuenta.',
      businessIdRequired: 'Introduce el businessId de Google.',
      prospectRequired: 'Completa nombre y email del prospecto.',
      icebreakerError: 'No se pudo lanzar Icebreaker.',
      alexQuestionRequired: 'Escribe una pregunta para ALEX.',
      alexChatError: 'No se pudo consultar a ALEX.',
      alexReportError: 'No se pudo generar el reporte de ALEX.',
      scaleActivateError: 'No se pudo activar Scale.',
      planRequired: 'Plan requerido',
      bundleStatusLabel: 'Estado del bundle',
      pendingProvisionNote: 'Tu solicitud Scale existe, pero los servicios premium todavía no están provisionados en esta cuenta.',
      openBilling: 'Abrir billing',
      qualified: 'cualificados',
      newReviews: 'nuevas',
      responses: 'respuestas',
      activeRecommendations: 'recomendaciones activas',
      alexSupervisorDesc: 'Resume salud del bundle y genera recomendaciones accionables.',
      impact: 'impacto',
      week: 'Semana',
      monitorSubtitle: 'Orquestador, QA, closer y resto de agentes internos del panel.',
      agentLabel: 'Agente',
      noRecommendations: 'ALEX no detecta ajustes urgentes ahora mismo.'
    },
    crm: {
      title: 'CRM',
      tabCompanies: 'Empresas',
      tabContacts: 'Contactos',
      tabDeals: 'Negocios',
      colCompany: 'Empresa',
      colLeads: 'Leads',
      colSource: 'Origen',
      colName: 'Nombre',
      colEmail: 'Email',
      colPhone: 'Teléfono',
      colDeal: 'Negocio',
      colStatus: 'Estado',
      colValue: 'Valor',
      noCompany: 'Sin empresa',
      detailTitle: 'Detalle CRM',
      detailRecord: 'Registro',
      notFound: 'Registro no encontrado.'
    },
    services: {
      title: 'Servicios',
      noServices: 'Ningún servicio activo asignado a tu cuenta.',
      open: 'Abrir'
    },
    settings: {
      title: 'Ajustes',
      tabGeneral: 'General',
      tabIntegrations: 'Integraciones',
      tabNotifications: 'Notificaciones',
      tabAccount: 'Cuenta',
      workspaceName: 'Nombre del workspace',
      language: 'Idioma',
      brevoWebhook: 'Brevo webhook URL',
      mrrActive: 'MRR activo (datos reales)',
      callAlerts: 'Alertas de llamadas',
      followUpAlerts: 'Alertas de seguimiento',
      save: 'Guardar',
      savedGeneral: 'Datos generales guardados.',
      savedIntegrations: 'Integraciones actualizadas.',
      savedNotifications: 'Notificaciones actualizadas.',
      savedAccount: 'Datos de cuenta guardados.',
      langEs: 'Español',
      langEn: 'Inglés',
      langPt: 'Portugués'
    },
    account: {
      billingTitle: 'Facturación',
      billingSubtitle: 'Plan, MRR y pagos.',
      settingsTitle: 'Ajustes de cuenta',
      settingsSubtitle: 'Nombre, email, empresa, teléfono.',
      securityTitle: 'Seguridad',
      securitySubtitle: 'Actualizar contraseña de acceso.',
      open: 'Abrir',
      settingsPageTitle: 'Ajustes de cuenta',
      dataTitle: 'Datos de cuenta',
      savedSuccess: 'Cuenta guardada con éxito.',
      securityPageTitle: 'Seguridad',
      securitySectionTitle: 'Seguridad de la cuenta',
      currentPassword: 'Contraseña actual',
      newPassword: 'Nueva contraseña',
      confirmPassword: 'Confirmar contraseña',
      passwordMismatch: 'La nueva contraseña y la confirmación no coinciden.',
      passwordSaved: 'Contraseña guardada.'
    },
    sentinel: {
      title: 'Sentinel',
      subtitle: 'Monitor autónomo de errores e integraciones',
      statTotal: 'Total',
      statUnresolved: 'Sin resolver',
      statCritical: 'Críticos',
      stat24h: 'Últimas 24h',
      stat1h: 'Última hora',
      statAutoFixed: 'Auto-fixed',
      statusActive: 'Activo',
      statusInactive: 'Inactivo',
      filterUnresolved: 'Sin resolver',
      filterAll: 'Todos',
      allSources: 'Todas las fuentes',
      colSeverity: 'Severidad',
      colSource: 'Fuente',
      colMessage: 'Mensaje',
      colDate: 'Fecha',
      colActions: 'Acciones',
      scanNow: 'Escanear ahora',
      scanning: 'Escaneando...',
      loading: 'Cargando...',
      noErrors: 'Sin errores detectados.',
      resolved: 'Resuelto',
      autoFix: 'Auto-fix'
    }
  },
  ca: {
    nav: {
      dashboard: 'Tauler',
      crm: 'CRM',
      leads: 'Prospectes',
      conversations: 'Converses',
      emails: 'Correus',
      calls: 'Trucades',
      followUps: 'Seguiments',
      sequences: 'Seqüències',
      agentsMonitor: 'Agents',
      settings: 'Configuració'
    },
    shellSubtitle: 'Motor de vendes IA multiagent amb memòria persistent per lead.',
    switchWorkspace: 'Canviar espai',
    languageLabel: 'Idioma',
    commonTo: 'a',
    notAvailable: 'N/D',
    common: {
      save: 'Desar',
      cancel: 'Cancel·lar',
      loading: 'Carregant...',
      error: 'Error',
      notFound: 'No trobat',
      open: 'Obrir',
      new: 'Nou',
      active: 'Actiu',
      inactive: 'Inactiu',
      all: 'Tots',
      name: 'Nom',
      email: 'Correu',
      phone: 'Telèfon',
      company: 'Empresa',
      status: 'Estat',
      date: 'Data',
      actions: 'Accions',
      source: 'Origen',
      duration: 'Durada',
      total: 'Total',
      today: 'Avui',
      yesterday: 'Ahir',
      noData: 'Sense dades',
      escalate: 'Escalar',
      escalating: 'Escalant...',
      human: 'Humà',
      selectMessage: 'Selecciona un missatge'
    },
    dashboard: {
      title: 'Tauler',
      refresh: 'Actualitzar',
      recentLeads: 'Leads recents',
      salesFunnel: 'Embut de vendes',
      agentActivity: 'Activitat d\'Alex',
      totalLeads: 'Leads totals',
      qualified: 'Qualificats',
      mrr: 'MRR',
      callsToday: 'Trucades avui',
      pipelineFull: 'Pipeline complet',
      readyForOffer: 'Preparats per oferta',
      recurringRevenue: 'Ingressos recurrents',
      conversionRate: '% conversió general',
      noRecentActivity: 'Sense activitat recent.',
      columnName: 'Nom',
      columnStatus: 'Estat',
      columnTime: 'Temps',
      funnelNew: 'Nou',
      funnelCallScheduled: 'Trucada agendada',
      funnelCallAttempted: 'Trucada intentada',
      funnelQualified: 'Qualificat',
      funnelProposal: 'Proposta',
      funnelFollowUp: 'Seguiment',
      funnelWon: 'Guanyat'
    },
    leads: {
      title: 'Prospectes',
      newLead: '+ Nou lead',
      tabAll: 'Tots',
      colName: 'Nom',
      colCompany: 'Empresa',
      colPhone: 'Telèfon',
      colStatus: 'Estat',
      colLastAction: 'Última acció',
      colNextAction: 'Pròxima acció',
      errorCreate: 'No ha estat possible crear el lead'
    },
    lead: {
      detailTitle: 'Detall del lead',
      profile: 'Perfil',
      noCompany: 'Sense empresa',
      unknownSource: 'Origen desconegut',
      leadScore: 'Puntuació del lead',
      closeProbability: 'Prob. tancament',
      buyingStage: 'Etapa de compra',
      recommendedNextAction: 'Següent acció recomanada',
      memorySummary: 'Resum de memòria',
      noLongTermSummary: 'Encara no hi ha resum de llarg termini.',
      estimatedMissedRevenue: 'Ingrés perdut estimat',
      conservativeRecovery: 'Recuperació conservadora',
      timeline: 'Cronologia',
      noInteractions: 'Encara no hi ha interaccions.',
      objections: 'Objeccions',
      noObjections: 'Sense objeccions registrades.',
      upcomingFollowUps: 'Seguiments propers',
      noPendingFollowUps: 'Sense seguiments pendents.',
      callHistory: 'Historial de trucades i transcripcions',
      noCalls: 'Encara no hi ha trucades.',
      noCallSummary: 'Encara no hi ha resum.',
      conversationSummary: 'Resum de conversa'
    },
    leadActions: {
      callNow: 'Trucar ara',
      escalateToHuman: 'Escalar a humà',
      markCold: 'Marcar com a fred',
      escalating: 'Escalant...',
      marking: 'Marcant...',
      noPhone: 'Lead sense telèfon per trucar',
      escalateFailed: 'No ha estat possible escalar el lead',
      markColdFailed: 'No ha estat possible marcar com a fred',
      callFailed: 'No ha estat possible iniciar la trucada',
      callQueued: 'Trucada enviada a la cua.',
      noEvents: 'Sense esdeveniments per a aquest lead.',
      infoTitle: 'Informació del lead',
      timelineTitle: 'Cronologia d\'esdeveniments',
      fieldScore: 'Score',
      fieldAssignedTo: 'Assignat a'
    },
    conversations: {
      title: 'Converses',
      listTitle: 'Llista de converses',
      detailTitle: 'Detall de la conversa',
      noConversations: 'Sense converses disponibles.',
      selectPrompt: 'Selecciona una conversa a la columna esquerra.'
    },
    calls: {
      title: 'Trucades',
      newCall: 'Nova trucada',
      colLead: 'Lead',
      colNumber: 'Número',
      colOutcome: 'Resultat',
      colDuration: 'Durada',
      colSummary: 'Resum',
      colDate: 'Data',
      totalCalls: 'Total trucades',
      callsToday: 'Trucades avui',
      avgDuration: 'Durada mitjana',
      errorCreate: 'No ha estat possible crear la trucada.',
      modalTitle: 'Nova trucada',
      modalLeadId: 'ID del lead',
      modalPhone: 'Telèfon (E.164)',
      modalObjective: 'Objectiu',
      modalCancel: 'Cancel·lar',
      modalConfirm: 'Iniciar trucada'
    },
    callDetail: {
      title: 'Detall de la trucada',
      outcome: 'Resultat',
      duration: 'Durada',
      start: 'Inici',
      end: 'Fi',
      notes: 'Notes',
      transcript: 'Transcripció',
      noNotes: 'Sense notes d\'aquesta trucada.',
      noTranscript: 'Sense transcripció disponible.'
    },
    followUps: {
      title: 'Seguiments',
      colLead: 'Lead',
      colStatus: 'Estat',
      colChannel: 'Canal',
      colLastAction: 'Última acció',
      colNextAction: 'Pròxima acció',
      colAction: 'Acció',
      escalateFailed: 'No ha estat possible escalar el lead',
      runNow: 'Executar ara',
      running: 'Executant...',
      runSuccess: 'Execució completada',
      runFailed: 'Error en l\'execució'
    },
    sequences: {
      title: 'Seqüències',
      colName: 'Nom',
      colSteps: 'Passos',
      colActiveLeads: 'Leads actius',
      colOpenRate: 'Taxa d\'obertura'
    },
    agents: {
      title: 'Agents',
      bundleTitle: 'Bundle Scale',
      monitorTitle: 'Monitor intern d\'agents',
      recommendationsTitle: 'Recomanacions actives',
      weeklyReportTitle: 'Informe setmanal ALEX',
      statusActive: 'Actiu',
      statusInactive: 'Inactiu',
      statusPending: 'Pendent d\'activació',
      completeActivation: 'Completar activació ara',
      activateBundle: 'Activar bundle en aquest compte',
      reviewBilling: 'Revisar billing',
      viewPlans: 'Veure plans',
      domainLabel: 'Domini',
      businessIdLabel: 'Business ID de Google',
      prospectNameLabel: 'Nom del prospecte',
      emailPlaceholder: 'email@empresa.com',
      companyOptional: 'Empresa (opcional)',
      loadError: 'No s\'ha pogut carregar el bundle Scale.',
      executionsToday: 'Execucions avui',
      noActivity: 'Sense activitat',
      noAgents: 'Sense execucions d\'agents registrades encara.',
      bundleSubtitle: 'Email Scrapper, Google Reviews, Icebreaker i ALEX Supervisor sobre l\'arquitectura real de AutomatizaWPP.',
      kpiEmailsValidated: 'Emails validats',
      kpiReviewsReplied: 'Ressenyes respostes',
      kpiIcebreakersSent: 'Icebreakers enviats',
      kpiAlexStatus: 'Estat ALEX',
      lastExecution: 'Última execució',
      lastSync: 'Última sincronització',
      lastOutreach: 'Últim outreach',
      costPerLead: 'Cost per lead',
      ratingChange: 'Canvi rating',
      revenueAttr: 'Revenue atribuït',
      launching: 'Llançant...',
      startScan: 'Iniciar escaneig',
      syncing: 'Sincronitzant...',
      syncNow: 'Sincronitzar ara',
      sending: 'Enviant...',
      sendIcebreaker: 'Enviar Icebreaker',
      noAlerts: 'Sense alertes crítiques ara mateix.',
      alexPlaceholder: 'Pregunta a ALEX per què baixa la resposta, quin agent tocar primer, etc.',
      generating: 'Generant...',
      generateReport: 'Generar informe setmanal',
      thinking: 'Pensant...',
      askAlexBtn: 'Preguntar a ALEX',
      noReport: 'Encara no hi ha informe persistit. Genera\'n un des d\'ALEX Supervisor.',
      successRate: 'Taxa d\'èxit',
      totalRuns: 'Total',
      lastActivity: 'Última activitat',
      activating: 'Activant...',
      domainRequired: 'Introdueix un domini per a Email Scrapper.',
      emailScrapperError: 'No s\'ha pogut llançar Email Scrapper.',
      reviewsError: 'No s\'ha pogut sincronitzar Google Reviews.',
      icebreakerDone: 'Icebreaker executat correctament.',
      alexReplied: 'ALEX ha respost la teva consulta.',
      alexReportDone: 'Informe setmanal d\'ALEX generat.',
      scaleActivated: 'Bundle Scale activat per a aquest compte.',
      businessIdRequired: 'Introdueix el businessId de Google.',
      prospectRequired: 'Completa el nom i l\'email del prospecte.',
      icebreakerError: 'No s\'ha pogut llançar Icebreaker.',
      alexQuestionRequired: 'Escriu una pregunta per a ALEX.',
      alexChatError: 'No s\'ha pogut consultar ALEX.',
      alexReportError: 'No s\'ha pogut generar l\'informe d\'ALEX.',
      scaleActivateError: 'No s\'ha pogut activar Scale.',
      planRequired: 'Pla requerit',
      bundleStatusLabel: 'Estat del bundle',
      pendingProvisionNote: 'La teva sol·licitud Scale existeix, però els serveis premium encara no estan aprovisionats en aquest compte.',
      openBilling: 'Obrir billing',
      qualified: 'qualificats',
      newReviews: 'noves',
      responses: 'respostes',
      activeRecommendations: 'recomanacions actives',
      alexSupervisorDesc: 'Resumeix la salut del bundle i genera recomanacions accionables.',
      impact: 'impacte',
      week: 'Setmana',
      monitorSubtitle: 'Orquestrador, QA, closer i resta d\'agents interns del panell.',
      agentLabel: 'Agent',
      noRecommendations: 'ALEX no detecta ajustos urgents ara mateix.'
    },
    crm: {
      title: 'CRM',
      tabCompanies: 'Empreses',
      tabContacts: 'Contactes',
      tabDeals: 'Negocis',
      colCompany: 'Empresa',
      colLeads: 'Leads',
      colSource: 'Origen',
      colName: 'Nom',
      colEmail: 'Correu',
      colPhone: 'Telèfon',
      colDeal: 'Negoci',
      colStatus: 'Estat',
      colValue: 'Valor',
      noCompany: 'Sense empresa',
      detailTitle: 'Detall CRM',
      detailRecord: 'Registre',
      notFound: 'Registre no trobat.'
    },
    services: {
      title: 'Serveis',
      noServices: 'Cap servei actiu assignat al teu compte.',
      open: 'Obrir'
    },
    settings: {
      title: 'Configuració',
      tabGeneral: 'General',
      tabIntegrations: 'Integracions',
      tabNotifications: 'Notificacions',
      tabAccount: 'Compte',
      workspaceName: 'Nom del workspace',
      language: 'Idioma',
      brevoWebhook: 'Brevo webhook URL',
      mrrActive: 'MRR actiu (dades reals)',
      callAlerts: 'Alertes de trucades',
      followUpAlerts: 'Alertes de seguiment',
      save: 'Desar',
      savedGeneral: 'Dades generals desades.',
      savedIntegrations: 'Integracions actualitzades.',
      savedNotifications: 'Notificacions actualitzades.',
      savedAccount: 'Dades del compte desades.',
      langEs: 'Espanyol',
      langEn: 'Anglès',
      langPt: 'Portuguès'
    },
    account: {
      billingTitle: 'Facturació',
      billingSubtitle: 'Pla, MRR i pagaments.',
      settingsTitle: 'Configuració del compte',
      settingsSubtitle: 'Nom, correu, empresa, telèfon.',
      securityTitle: 'Seguretat',
      securitySubtitle: 'Actualitzar contrasenya d\'accés.',
      open: 'Obrir',
      settingsPageTitle: 'Configuració del compte',
      dataTitle: 'Dades del compte',
      savedSuccess: 'Compte desat amb èxit.',
      securityPageTitle: 'Seguretat',
      securitySectionTitle: 'Seguretat del compte',
      currentPassword: 'Contrasenya actual',
      newPassword: 'Nova contrasenya',
      confirmPassword: 'Confirmar contrasenya',
      passwordMismatch: 'La nova contrasenya i la confirmació no coincideixen.',
      passwordSaved: 'Contrasenya desada.'
    },
    sentinel: {
      title: 'Sentinel',
      subtitle: 'Monitor autònom d\'errors i integracions',
      statTotal: 'Total',
      statUnresolved: 'Sense resoldre',
      statCritical: 'Crítics',
      stat24h: 'Últimes 24h',
      stat1h: 'Última hora',
      statAutoFixed: 'Auto-fixed',
      statusActive: 'Actiu',
      statusInactive: 'Inactiu',
      filterUnresolved: 'Sense resoldre',
      filterAll: 'Tots',
      allSources: 'Totes les fonts',
      colSeverity: 'Severitat',
      colSource: 'Font',
      colMessage: 'Missatge',
      colDate: 'Data',
      colActions: 'Accions',
      scanNow: 'Escanejar ara',
      scanning: 'Escanejant...',
      loading: 'Carregant...',
      noErrors: 'Sense errors detectats.',
      resolved: 'Resolt',
      autoFix: 'Auto-fix'
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      crm: 'CRM',
      leads: 'Leads',
      conversations: 'Conversations',
      emails: 'Emails',
      calls: 'Calls',
      followUps: 'Follow-ups',
      sequences: 'Sequences',
      agentsMonitor: 'Agents',
      settings: 'Settings'
    },
    shellSubtitle: 'Multi-agent AI sales engine with persistent lead memory.',
    switchWorkspace: 'Switch workspace',
    languageLabel: 'Language',
    commonTo: 'to',
    notAvailable: 'N/A',
    common: {
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
      error: 'Error',
      notFound: 'Not found',
      open: 'Open',
      new: 'New',
      active: 'Active',
      inactive: 'Inactive',
      all: 'All',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      status: 'Status',
      date: 'Date',
      actions: 'Actions',
      source: 'Source',
      duration: 'Duration',
      total: 'Total',
      today: 'Today',
      yesterday: 'Yesterday',
      noData: 'No data',
      escalate: 'Escalate',
      escalating: 'Escalating...',
      human: 'Human',
      selectMessage: 'Select a message'
    },
    dashboard: {
      title: 'Dashboard',
      refresh: 'Refresh',
      recentLeads: 'Recent leads',
      salesFunnel: 'Sales funnel',
      agentActivity: 'Alex\'s activity',
      totalLeads: 'Total leads',
      qualified: 'Qualified',
      mrr: 'MRR',
      callsToday: 'Calls today',
      pipelineFull: 'Full pipeline',
      readyForOffer: 'Ready for offer',
      recurringRevenue: 'Recurring revenue',
      conversionRate: 'Overall conversion %',
      noRecentActivity: 'No recent activity.',
      columnName: 'Name',
      columnStatus: 'Status',
      columnTime: 'Time',
      funnelNew: 'New',
      funnelCallScheduled: 'Call scheduled',
      funnelCallAttempted: 'Call attempted',
      funnelQualified: 'Qualified',
      funnelProposal: 'Proposal',
      funnelFollowUp: 'Follow-up',
      funnelWon: 'Won'
    },
    leads: {
      title: 'Leads',
      newLead: '+ New lead',
      tabAll: 'All',
      colName: 'Name',
      colCompany: 'Company',
      colPhone: 'Phone',
      colStatus: 'Status',
      colLastAction: 'Last action',
      colNextAction: 'Next action',
      errorCreate: 'Could not create lead'
    },
    lead: {
      detailTitle: 'Lead Detail',
      profile: 'Profile',
      noCompany: 'No company',
      unknownSource: 'Unknown source',
      leadScore: 'Lead Score',
      closeProbability: 'Close Prob.',
      buyingStage: 'Buying Stage',
      recommendedNextAction: 'Recommended Next Action',
      memorySummary: 'Memory Summary',
      noLongTermSummary: 'No long-term summary yet.',
      estimatedMissedRevenue: 'Estimated missed revenue',
      conservativeRecovery: 'Conservative recovery',
      timeline: 'Timeline',
      noInteractions: 'No interactions yet.',
      objections: 'Objections',
      noObjections: 'No objections logged.',
      upcomingFollowUps: 'Upcoming Follow-ups',
      noPendingFollowUps: 'No pending follow-ups.',
      callHistory: 'Call History & Transcripts',
      noCalls: 'No calls yet.',
      noCallSummary: 'No summary yet.',
      conversationSummary: 'Conversation Summary'
    },
    leadActions: {
      callNow: 'Call now',
      escalateToHuman: 'Escalate to human',
      markCold: 'Mark as cold',
      escalating: 'Escalating...',
      marking: 'Marking...',
      noPhone: 'Lead has no phone number',
      escalateFailed: 'Could not escalate lead',
      markColdFailed: 'Could not mark as cold',
      callFailed: 'Could not start call',
      callQueued: 'Call queued.',
      noEvents: 'No events for this lead.',
      infoTitle: 'Lead information',
      timelineTitle: 'Event timeline',
      fieldScore: 'Score',
      fieldAssignedTo: 'Assigned to'
    },
    conversations: {
      title: 'Conversations',
      listTitle: 'Conversations list',
      detailTitle: 'Conversation detail',
      noConversations: 'No conversations available.',
      selectPrompt: 'Select a conversation in the left column.'
    },
    calls: {
      title: 'Calls',
      newCall: 'New call',
      colLead: 'Lead',
      colNumber: 'Number',
      colOutcome: 'Outcome',
      colDuration: 'Duration',
      colSummary: 'Summary',
      colDate: 'Date',
      totalCalls: 'Total calls',
      callsToday: 'Calls today',
      avgDuration: 'Avg duration',
      errorCreate: 'Could not create call.',
      modalTitle: 'New call',
      modalLeadId: 'Lead ID',
      modalPhone: 'Phone (E.164)',
      modalObjective: 'Objective',
      modalCancel: 'Cancel',
      modalConfirm: 'Start call'
    },
    callDetail: {
      title: 'Call detail',
      outcome: 'Outcome',
      duration: 'Duration',
      start: 'Start',
      end: 'End',
      notes: 'Notes',
      transcript: 'Transcript',
      noNotes: 'No notes for this call.',
      noTranscript: 'No transcript available.'
    },
    followUps: {
      title: 'Follow-ups',
      colLead: 'Lead',
      colStatus: 'Status',
      colChannel: 'Channel',
      colLastAction: 'Last action',
      colNextAction: 'Next action',
      colAction: 'Action',
      escalateFailed: 'Could not escalate lead',
      runNow: 'Run now',
      running: 'Running...',
      runSuccess: 'Execution completed',
      runFailed: 'Execution failed'
    },
    sequences: {
      title: 'Sequences',
      colName: 'Name',
      colSteps: 'Steps',
      colActiveLeads: 'Active leads',
      colOpenRate: 'Open rate'
    },
    agents: {
      title: 'Agents',
      bundleTitle: 'Scale Bundle',
      monitorTitle: 'Internal agent monitor',
      recommendationsTitle: 'Active recommendations',
      weeklyReportTitle: 'ALEX weekly report',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusPending: 'Pending activation',
      completeActivation: 'Complete activation now',
      activateBundle: 'Activate bundle on this account',
      reviewBilling: 'Review billing',
      viewPlans: 'View plans',
      domainLabel: 'Domain',
      businessIdLabel: 'Google Business ID',
      prospectNameLabel: 'Prospect name',
      emailPlaceholder: 'email@company.com',
      companyOptional: 'Company (optional)',
      loadError: 'Could not load Scale bundle.',
      executionsToday: 'Executions today',
      noActivity: 'No activity',
      noAgents: 'No agent executions registered yet.',
      bundleSubtitle: 'Email Scrapper, Google Reviews, Icebreaker and ALEX Supervisor on the real AutomatizaWPP architecture.',
      kpiEmailsValidated: 'Emails validated',
      kpiReviewsReplied: 'Reviews replied',
      kpiIcebreakersSent: 'Icebreakers sent',
      kpiAlexStatus: 'ALEX status',
      lastExecution: 'Last execution',
      lastSync: 'Last sync',
      lastOutreach: 'Last outreach',
      costPerLead: 'Cost per lead',
      ratingChange: 'Rating change',
      revenueAttr: 'Attributed revenue',
      launching: 'Launching...',
      startScan: 'Start scan',
      syncing: 'Syncing...',
      syncNow: 'Sync now',
      sending: 'Sending...',
      sendIcebreaker: 'Send Icebreaker',
      noAlerts: 'No critical alerts right now.',
      alexPlaceholder: 'Ask ALEX why response is dropping, which agent to tune first, etc.',
      generating: 'Generating...',
      generateReport: 'Generate weekly report',
      thinking: 'Thinking...',
      askAlexBtn: 'Ask ALEX',
      noReport: 'No report saved yet. Generate one from ALEX Supervisor.',
      successRate: 'Success rate',
      totalRuns: 'Total',
      lastActivity: 'Last activity',
      activating: 'Activating...',
      domainRequired: 'Enter a domain for Email Scrapper.',
      emailScrapperError: 'Could not launch Email Scrapper.',
      reviewsError: 'Could not sync Google Reviews.',
      icebreakerDone: 'Icebreaker executed successfully.',
      alexReplied: 'ALEX replied to your query.',
      alexReportDone: 'ALEX weekly report generated.',
      scaleActivated: 'Scale bundle activated for this account.',
      businessIdRequired: 'Enter the Google businessId.',
      prospectRequired: 'Complete prospect name and email.',
      icebreakerError: 'Could not launch Icebreaker.',
      alexQuestionRequired: 'Write a question for ALEX.',
      alexChatError: 'Could not query ALEX.',
      alexReportError: 'Could not generate ALEX report.',
      scaleActivateError: 'Could not activate Scale.',
      planRequired: 'Plan required',
      bundleStatusLabel: 'Bundle status',
      pendingProvisionNote: 'Your Scale request exists, but premium services are not yet provisioned for this account.',
      openBilling: 'Open billing',
      qualified: 'qualified',
      newReviews: 'new',
      responses: 'responses',
      activeRecommendations: 'active recommendations',
      alexSupervisorDesc: 'Summarises bundle health and generates actionable recommendations.',
      impact: 'impact',
      week: 'Week',
      monitorSubtitle: 'Orchestrator, QA, closer and other internal panel agents.',
      agentLabel: 'Agent',
      noRecommendations: 'ALEX detects no urgent adjustments right now.'
    },
    crm: {
      title: 'CRM',
      tabCompanies: 'Companies',
      tabContacts: 'Contacts',
      tabDeals: 'Deals',
      colCompany: 'Company',
      colLeads: 'Leads',
      colSource: 'Source',
      colName: 'Name',
      colEmail: 'Email',
      colPhone: 'Phone',
      colDeal: 'Deal',
      colStatus: 'Status',
      colValue: 'Value',
      noCompany: 'No company',
      detailTitle: 'CRM Detail',
      detailRecord: 'Record',
      notFound: 'Record not found.'
    },
    services: {
      title: 'Services',
      noServices: 'No active services assigned to your account.',
      open: 'Open'
    },
    settings: {
      title: 'Settings',
      tabGeneral: 'General',
      tabIntegrations: 'Integrations',
      tabNotifications: 'Notifications',
      tabAccount: 'Account',
      workspaceName: 'Workspace name',
      language: 'Language',
      brevoWebhook: 'Brevo webhook URL',
      mrrActive: 'Active MRR (real data)',
      callAlerts: 'Call alerts',
      followUpAlerts: 'Follow-up alerts',
      save: 'Save',
      savedGeneral: 'General settings saved.',
      savedIntegrations: 'Integrations updated.',
      savedNotifications: 'Notifications updated.',
      savedAccount: 'Account settings saved.',
      langEs: 'Spanish',
      langEn: 'English',
      langPt: 'Portuguese'
    },
    account: {
      billingTitle: 'Billing',
      billingSubtitle: 'Plan, MRR and payments.',
      settingsTitle: 'Account settings',
      settingsSubtitle: 'Name, email, company, phone.',
      securityTitle: 'Security',
      securitySubtitle: 'Update your access password.',
      open: 'Open',
      settingsPageTitle: 'Account settings',
      dataTitle: 'Account data',
      savedSuccess: 'Account saved successfully.',
      securityPageTitle: 'Security',
      securitySectionTitle: 'Account security',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      passwordMismatch: 'New password and confirmation do not match.',
      passwordSaved: 'Password saved.'
    },
    sentinel: {
      title: 'Sentinel',
      subtitle: 'Autonomous error and integration monitor',
      statTotal: 'Total',
      statUnresolved: 'Unresolved',
      statCritical: 'Critical',
      stat24h: 'Last 24h',
      stat1h: 'Last hour',
      statAutoFixed: 'Auto-fixed',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      filterUnresolved: 'Unresolved',
      filterAll: 'All',
      allSources: 'All sources',
      colSeverity: 'Severity',
      colSource: 'Source',
      colMessage: 'Message',
      colDate: 'Date',
      colActions: 'Actions',
      scanNow: 'Scan now',
      scanning: 'Scanning...',
      loading: 'Loading...',
      noErrors: 'No errors detected.',
      resolved: 'Resolved',
      autoFix: 'Auto-fix'
    }
  }
};

const APP_TITLE_TRANSLATIONS: Record<string, Partial<Record<UiLanguage, string>>> = {
  Dashboard: { pt: 'Painel', es: 'Panel', ca: 'Tauler' },
  Panel: { pt: 'Painel', ca: 'Tauler', en: 'Dashboard' },
  Painel: { es: 'Panel', ca: 'Tauler', en: 'Dashboard' },
  Agentes: { pt: 'Agentes', ca: 'Agents', en: 'Agents' },
  Leads: { pt: 'Prospectos', es: 'Prospectos', ca: 'Prospectes' },
  Prospectos: { pt: 'Prospectos', ca: 'Prospectes', en: 'Leads' },
  Conversas: { es: 'Conversaciones', ca: 'Converses', en: 'Conversations' },
  Conversaciones: { pt: 'Conversas', ca: 'Converses', en: 'Conversations' },
  Chamadas: { es: 'Llamadas', ca: 'Trucades', en: 'Calls' },
  Ligações: { es: 'Llamadas', ca: 'Trucades', en: 'Calls' },
  Llamadas: { pt: 'Ligações', ca: 'Trucades', en: 'Calls' },
  Conversations: { pt: 'Conversas', es: 'Conversaciones', ca: 'Converses' },
  Emails: { pt: 'E-mails', ca: 'Correus' },
  Calls: { pt: 'Ligações', es: 'Llamadas', ca: 'Trucades' },
  'Follow-Ups': { pt: 'Acompanhamentos', es: 'Seguimientos', ca: 'Seguiments' },
  Seguimientos: { pt: 'Acompanhamentos', ca: 'Seguiments', en: 'Follow-ups' },
  Acompanhamentos: { es: 'Seguimientos', ca: 'Seguiments', en: 'Follow-ups' },
  Conta: { es: 'Cuenta', ca: 'Compte', en: 'Account' },
  Cuenta: { pt: 'Conta', ca: 'Compte', en: 'Account' },
  Security: { pt: 'Segurança', es: 'Seguridad', ca: 'Seguretat' },
  Segurança: { es: 'Seguridad', ca: 'Seguretat', en: 'Security' },
  Seguridad: { pt: 'Segurança', ca: 'Seguretat', en: 'Security' },
  'Account settings': { pt: 'Configurações da conta', es: 'Ajustes de cuenta', ca: 'Configuració del compte' },
  'Configurações da conta': { es: 'Ajustes de cuenta', ca: 'Configuració del compte', en: 'Account settings' },
  'Ajustes de cuenta': { pt: 'Configurações da conta', ca: 'Configuració del compte', en: 'Account settings' },
  Sequences: { pt: 'Sequências', es: 'Secuencias', ca: 'Seqüències' },
  Sequências: { es: 'Secuencias', ca: 'Seqüències', en: 'Sequences' },
  Secuencias: { pt: 'Sequências', ca: 'Seqüències', en: 'Sequences' },
  'Agents Monitor': { pt: 'Monitor de agentes', es: 'Monitor de agentes', ca: 'Monitor d\'agents' },
  Settings: { pt: 'Configurações', es: 'Ajustes', ca: 'Configuració' },
  Configurações: { es: 'Ajustes', ca: 'Configuració', en: 'Settings' },
  Ajustes: { pt: 'Configurações', ca: 'Configuració', en: 'Settings' }
};

const BUYING_STAGE_TRANSLATIONS: Record<string, Partial<Record<UiLanguage, string>>> = {
  AWARENESS: { pt: 'ATENÇÃO', es: 'ATENCIÓN', ca: 'CONSCIÈNCIA' },
  DISCOVERY: { pt: 'DESCOBERTA', es: 'DESCUBRIMIENTO', ca: 'DESCOBERTA' },
  CONSIDERATION: { pt: 'CONSIDERAÇÃO', es: 'CONSIDERACIÓN', ca: 'CONSIDERACIÓ' },
  EVALUATION: { pt: 'AVALIAÇÃO', es: 'EVALUACIÓN', ca: 'AVALUACIÓ' },
  DECISION: { pt: 'DECISÃO', es: 'DECISIÓN', ca: 'DECISIÓ' },
  COMMITMENT: { pt: 'COMPROMISSO', es: 'COMPROMISO', ca: 'COMPROMÍS' }
};

const RECOMMENDATION_TRANSLATIONS: Record<string, Partial<Record<UiLanguage, string>>> = {
  'No immediate outreach': {
    pt: 'Sem contato imediato',
    es: 'Sin contacto inmediato',
    ca: 'Sense contacte immediat'
  },
  'Lead is won.': {
    pt: 'O lead foi ganho.',
    es: 'El lead está ganado.',
    ca: 'El lead està guanyat.'
  },
  'Lead is lost.': {
    pt: 'O lead foi perdido.',
    es: 'El lead está perdido.',
    ca: 'El lead està perdut.'
  },
  'Lead is paused.': {
    pt: 'O lead está em pausa.',
    es: 'El lead está en pausa.',
    ca: 'El lead està en pausa.'
  },
  'Run closer sequence and push booking CTA': {
    pt: 'Executar sequência de fechamento e empurrar CTA de agendamento',
    es: 'Ejecutar secuencia de cierre y empujar CTA de reserva',
    ca: 'Executar seqüència de tancament i impulsar CTA de reserva'
  },
  'High urgency + high intent indicate immediate conversion window.': {
    pt: 'Alta urgência + alta intenção indicam uma janela imediata de conversão.',
    es: 'Alta urgencia + alta intención indican una ventana inmediata de conversión.',
    ca: 'Alta urgència + alta intenció indiquen una finestra immediata de conversió.'
  },
  'Ask one qualification question and update score': {
    pt: 'Fazer uma pergunta de qualificação e atualizar o score',
    es: 'Hacer una pregunta de cualificación y actualizar score',
    ca: 'Fer una pregunta de qualificació i actualitzar score'
  },
  'Lead is still in discovery phase.': {
    pt: 'O lead ainda está na fase de descoberta.',
    es: 'El lead sigue en fase de descubrimiento.',
    ca: 'El lead encara està en fase de descoberta.'
  },
  'Send proof-based follow-up with new angle': {
    pt: 'Enviar acompanhamento baseado em provas com novo ângulo',
    es: 'Enviar seguimiento basado en pruebas con un nuevo ángulo',
    ca: 'Enviar seguiment basat en proves amb un nou angle'
  },
  'Nurture requires value progression to reactivate intent.': {
    pt: 'O nurturing requer progressão de valor para reativar a intenção.',
    es: 'El nurturing requiere progresión de valor para reactivar la intención.',
    ca: 'El nurturing requereix progressió de valor per reactivar la intenció.'
  },
  'Send immediate lead response': {
    pt: 'Enviar resposta imediata ao lead',
    es: 'Enviar respuesta inmediata al lead',
    ca: 'Enviar resposta immediata al lead'
  },
  'Default fast-response policy for active opportunities.': {
    pt: 'Política padrão de resposta rápida para oportunidades ativas.',
    es: 'Política por defecto de respuesta rápida para oportunidades activas.',
    ca: 'Política per defecte de resposta ràpida per a oportunitats actives.'
  }
};

export function getUiCopy(language: UiLanguage): UiCopy {
  return UI_COPY[language];
}

export function translateAppTitle(title: string, language: UiLanguage): string {
  if (title.startsWith('Lead Detail · ')) {
    const leadName = title.slice('Lead Detail · '.length);
    return `${UI_COPY[language].lead.detailTitle} · ${leadName}`;
  }

  return APP_TITLE_TRANSLATIONS[title]?.[language] ?? title;
}

export function translateBuyingStage(stage: string, language: UiLanguage): string {
  return BUYING_STAGE_TRANSLATIONS[stage]?.[language] ?? stage;
}

export function translateRecommendation(text: string, language: UiLanguage): string {
  return RECOMMENDATION_TRANSLATIONS[text]?.[language] ?? text;
}
