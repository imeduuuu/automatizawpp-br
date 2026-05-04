import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { getPrompt, Language, resolveLanguage } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

/**
 * Fallback bilingue. Sprint 1.2 V.L.A.E.G.
 */
function getFallback(context: AgentContext, lang: Language) {
  if (lang === 'pt-BR') {
    return {
      scriptSections: [
        'Abertura: estabelecer contexto e permissão',
        'Discovery: principal dor e linha do tempo de impacto',
        'Qualificação: orçamento, autoridade, urgência',
        'Posicionamento: solução customizada + prova',
        'Fechamento: CTA de booking/pagamento + próximo passo claro',
      ],
      objections: ['PRICE', 'TIMING'],
      urgency: context.lead.urgencyLevel,
      summary: `Fluxo de chamada outbound preparado para ${context.lead.fullName}.`,
      nextAction: 'Agendar chamada e enviar confirmação.',
    };
  }
  return {
    scriptSections: [
      'Apertura: establecer contexto y permiso',
      'Discovery: dolor principal y línea de tiempo de impacto',
      'Cualificación: presupuesto, autoridad, urgencia',
      'Posicionamiento: solución a medida + prueba',
      'Cierre: CTA de booking/pago + próximo paso claro',
    ],
    objections: ['PRICE', 'TIMING'],
    urgency: context.lead.urgencyLevel,
    summary: `Flujo de llamada outbound preparado para ${context.lead.fullName}.`,
    nextAction: 'Agendar llamada y enviar confirmación.',
  };
}

export class CallAssistAgent implements SalesAgent {
  name = 'CALL_ASSIST' as const;

  async run(context: AgentContext) {
    const lang: Language = resolveLanguage(context.lead.preferredLanguage ?? null);
    const systemPrompt = getPrompt('callAssist', lang);

    const result = await runAgentPrompt(systemPrompt, context, 'CALL_ASSIST');

    // Sprint 3.4 V.L.A.E.G. — Deuda #5: call-agent gera script interno
    // (scriptSections, objections, urgency), NÃO uma mensagem direta ao
    // lead. Por isso não há `message` para normalizar. Não aplicável.
    return {
      agent: this.name,
      summary: 'Pacote de fluxo de chamada criado.',
      payload: (result.json as Record<string, unknown>) ?? getFallback(context, lang),
    };
  }
}
