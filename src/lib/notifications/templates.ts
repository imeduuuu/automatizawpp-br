// Modelos de templates para notificações Phase 5B

import { NotificationTemplateType, NotificationTemplateData } from './types';

const TEMPLATES: Record<NotificationTemplateType, {
  email?: { subject: string; title: string; message: string; html: string };
  whatsapp?: { title: string; message: string };
  inApp?: { title: string; message: string };
  slack?: { title: string; message: string };
}> = {
  LEAD_CREATED: {
    email: {
      subject: 'Novo lead: {leadName}',
      title: 'Novo Lead Criado',
      message: 'Um novo lead foi registrado: {leadName} de {company}',
      html: '<p>Um novo lead foi registrado:</p><p><strong>{leadName}</strong> de <strong>{company}</strong></p>'
    },
    whatsapp: {
      title: 'Novo Lead',
      message: 'Lead {leadName} de {company} foi criado'
    },
    inApp: {
      title: 'Novo Lead: {leadName}',
      message: '{leadName} de {company} registrou interesse'
    },
    slack: {
      title: 'Novo Lead Criado',
      message: '{leadName} de {company} entrou no sistema'
    }
  },

  LEAD_QUALIFIED: {
    email: {
      subject: 'Lead Qualificado: {leadName}',
      title: 'Lead Qualificado',
      message: '{leadName} foi qualificado como prospect de alta qualidade',
      html: '<p><strong>{leadName}</strong> foi qualificado como prospect de alta qualidade!</p><p>Score: {score}</p>'
    },
    whatsapp: {
      title: 'Lead Qualificado',
      message: '{leadName} foi qualificado! Score: {score}'
    },
    inApp: {
      title: 'Lead Qualificado: {leadName}',
      message: 'Score de qualificação: {score}'
    },
    slack: {
      title: 'Lead Qualificado',
      message: '{leadName} - Score {score}'
    }
  },

  LEAD_HIGH_INTENT: {
    email: {
      subject: 'Lead de Alta Intenção: {leadName}',
      title: 'Lead de Alta Intenção',
      message: '{leadName} mostrou alta intenção de compra',
      html: '<p><strong>{leadName}</strong> mostrou sinais de alta intenção!</p><p>Ação recomendada: Contactar imediatamente</p>'
    },
    whatsapp: {
      title: 'Alta Intenção Detectada',
      message: '{leadName} mostrou alta intenção de compra'
    },
    inApp: {
      title: 'Alta Intenção: {leadName}',
      message: 'Lead mostrou sinais de alta compra'
    },
    slack: {
      title: 'Alta Intenção Detectada',
      message: '{leadName} - Contactar imediatamente!'
    }
  },

  LEAD_VIP: {
    email: {
      subject: 'Lead VIP: {leadName}',
      title: 'Lead VIP Identificado',
      message: '{leadName} foi classificado como lead VIP e requer atenção prioritária',
      html: '<p><strong>{leadName}</strong> foi identificado como <strong>VIP</strong></p><p>Empresa: {company}</p><p>Prioridade: ALTA</p>'
    },
    whatsapp: {
      title: 'Lead VIP',
      message: '{leadName} é VIP - Prioridade ALTA'
    },
    inApp: {
      title: 'VIP Lead: {leadName}',
      message: 'Empresa: {company} - Requer atenção imediata'
    },
    slack: {
      title: 'Lead VIP Detectado',
      message: '{leadName} ({company}) - Prioridade MÁXIMA'
    }
  },

  // Sprint 2.4-A — escalonamento humano obrigatório (queja, abogado, devolución, etc.)
  LEAD_ESCALATED: {
    email: {
      subject: '[ESCALONAMENTO] Lead {leadName} requer atenção humana',
      title: 'Lead escalonado para atendimento humano',
      message: 'O lead {leadName} foi escalonado. Motivo: {reason}',
      html: '<p><strong>Escalonamento humano disparado</strong></p><p>Lead: <strong>{leadName}</strong></p><p>Motivo: {reason}</p><p>Lead ID: {leadId}</p><p>Acesse o painel para tomar a próxima ação.</p>'
    },
    whatsapp: {
      title: 'Lead escalonado',
      message: '{leadName} precisa de atenção humana. Motivo: {reason}'
    },
    inApp: {
      title: 'Escalonamento: {leadName}',
      message: 'Motivo: {reason}'
    },
    slack: {
      title: 'Lead escalonado',
      message: '{leadName} - {reason}'
    }
  },

  EMAIL_FAILED: {
    email: {
      subject: 'Falha ao enviar email para {leadName}',
      title: 'Falha no Envio de Email',
      message: 'Email para {leadName} falhou: {reason}',
      html: '<p>Erro ao enviar email para <strong>{leadName}</strong></p><p>Motivo: {reason}</p><p>Lead ID: {leadId}</p>'
    },
    whatsapp: {
      title: 'Email Falhou',
      message: 'Email para {leadName} falhou'
    },
    inApp: {
      title: 'Email Falhado',
      message: 'Email para {leadName} não foi entregue'
    },
    slack: {
      title: 'Falha de Email',
      message: '{leadName} - Razão: {reason}'
    }
  },

  CALL_COMPLETED: {
    email: {
      subject: 'Chamada Completada: {leadName}',
      title: 'Chamada Finalizada',
      message: 'Chamada com {leadName} foi completada',
      html: '<p>Chamada com <strong>{leadName}</strong> foi completada</p>'
    },
    whatsapp: {
      title: 'Chamada Completada',
      message: 'Chamada com {leadName} realizada'
    },
    inApp: {
      title: 'Chamada Completada: {leadName}',
      message: 'Lead foi contatado via {channel}'
    },
    slack: {
      title: 'Chamada Completada',
      message: '{leadName} foi contatado'
    }
  },

  FOLLOW_UP_SENT: {
    email: {
      subject: 'Follow-up Enviado: {leadName}',
      title: 'Follow-up Enviado',
      message: 'Follow-up foi enviado para {leadName}',
      html: '<p>Follow-up foi enviado para <strong>{leadName}</strong></p><p>Canal: {channel}</p>'
    },
    whatsapp: {
      title: 'Follow-up Enviado',
      message: 'Mensagem enviada para {leadName}'
    },
    inApp: {
      title: 'Follow-up: {leadName}',
      message: 'Mensagem de follow-up foi enviada'
    },
    slack: {
      title: 'Follow-up Enviado',
      message: '{leadName} via {channel}'
    }
  },

  SYSTEM_ERROR: {
    email: {
      subject: 'Erro do Sistema - Ação Requerida',
      title: 'Erro Crítico do Sistema',
      message: 'Um erro crítico foi detectado: {reason}',
      html: '<p><strong>Erro Crítico Detectado</strong></p><p>Motivo: {reason}</p><p>Hora: {timestamp}</p>'
    },
    whatsapp: {
      title: 'Erro do Sistema',
      message: 'Erro: {reason}'
    },
    inApp: {
      title: 'Erro do Sistema',
      message: '{reason}'
    },
    slack: {
      title: 'ALERTA: Erro do Sistema',
      message: '{reason} - Hora: {timestamp}'
    }
  },

  SYSTEM_HEALTH: {
    email: {
      subject: 'Status do Sistema - {timestamp}',
      title: 'Relatório de Saúde do Sistema',
      message: 'Status atual do sistema está sendo monitorado',
      html: '<p>Relatório de saúde do sistema</p><p>Hora: {timestamp}</p>'
    },
    whatsapp: {
      title: 'Sistema OK',
      message: 'Sistema funcionando normalmente'
    },
    inApp: {
      title: 'Sistema Saudável',
      message: 'Todos os serviços operacionais'
    },
    slack: {
      title: 'Status do Sistema',
      message: 'Sistema OK - {timestamp}'
    }
  },

  OPPORTUNITY_HIGH_VALUE: {
    email: {
      subject: 'Oportunidade de Alto Valor: {leadName}',
      title: 'Oportunidade de Alto Valor',
      message: '{leadName} representa uma oportunidade significativa - Estimado: {reason}',
      html: '<p><strong>{leadName}</strong> identificado como oportunidade de <strong>ALTO VALOR</strong></p><p>Empresa: {company}</p><p>Detalhes: {reason}</p>'
    },
    whatsapp: {
      title: 'Oportunidade Alto Valor',
      message: '{leadName} - Oportunidade significativa'
    },
    inApp: {
      title: 'Oportunidade Alto Valor: {leadName}',
      message: 'Empresa {company} - Valor significativo'
    },
    slack: {
      title: 'Oportunidade Alto Valor',
      message: '{leadName} ({company}) - Contactar URGENTE'
    }
  }
};

export function renderTemplate(
  template: NotificationTemplateType,
  channel: 'email' | 'whatsapp' | 'inApp' | 'slack',
  data: NotificationTemplateData
): { title: string; message: string; subject?: string; html?: string } {
  const templateConfig = TEMPLATES[template]?.[channel];
  if (!templateConfig) {
    return {
      title: template,
      message: `Notificação: ${template}`
    };
  }

  const interpolate = (text: string): string => {
    return text.replace(/{(\w+)}/g, (_, key) => {
      return String(data[key] || '');
    });
  };

  const cfg = templateConfig as { title: string; message: string; subject?: string; html?: string };
  return {
    title: interpolate(cfg.title),
    message: interpolate(cfg.message),
    subject: cfg.subject ? interpolate(cfg.subject) : undefined,
    html: cfg.html ? interpolate(cfg.html) : undefined
  };
}

export function getTemplateVariables(template: NotificationTemplateType): string[] {
  const emailTpl = TEMPLATES[template]?.email?.message || '';
  const matches = emailTpl.match(/{(\w+)}/g) || [];
  return matches.map(m => m.slice(1, -1));
}
