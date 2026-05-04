import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { getPrompt, Language, resolveLanguage } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';
import {
  buildRoiMessage,
  computeRoi,
  extractRoiInputs,
  hasCompleteRoiInputs,
  hasRoiConfirmation,
  shouldTriggerRoiSalesMode,
} from '@/lib/roi/roi-sales-mode';

/**
 * Fallback bilingue para el cierre. Sprint 1.2 V.L.A.E.G.
 * Nota: el system prompt del closer ya estaba en PT-BR — no se modificó.
 */
function getFallback(lang: Language) {
  if (lang === 'pt-BR') {
    return {
      message:
        'Pelo que você compartilhou, o caminho mais rápido é uma call de 20 minutos onde mapeamos seu primeiro sprint de conversão. Amanhã às 11:00 ou 16:00, qual fica melhor?',
      ctaType: 'BOOK_CALL',
      riskFlags: [],
      fallbackPlan: 'Caso ainda não esteja pronto, mover para sequência de nurture baseada em valor.',
    };
  }
  return {
    message:
      'Por lo que compartiste, el camino más rápido es una llamada de 20 minutos donde mapeamos tu primer sprint de conversión. ¿Mañana a las 11:00 o 16:00, qué te encaja mejor?',
    ctaType: 'BOOK_CALL',
    riskFlags: [],
    fallbackPlan: 'Si todavía no está listo, mover a secuencia de nurture basada en valor.',
  };
}

/**
 * Mensagens ROI-mode bilingue.
 */
function buildRoiInputsRequest(lang: Language): string {
  if (lang === 'pt-BR') {
    return 'Para calcular sem inventar nada, preciso de 3 dados: quantos leads você recebe por período, qual % fica sem resposta/seguimento e ticket médio por venda.';
  }
  return 'Para calcularlo sin inventar nada, necesito 3 datos: cuántos leads recibes por periodo, qué % se queda sin respuesta/seguimiento y ticket medio por venta.';
}

function buildRoiConfirmRequest(
  leadVolumePeriod: unknown,
  missedPercent: unknown,
  averageDealValue: unknown,
  lang: Language
): string {
  if (lang === 'pt-BR') {
    return `Tenho estes dados preliminares: ${leadVolumePeriod} leads, ${missedPercent}% sem follow-up e ticket médio ${averageDealValue}€. Confirma que eu calcule com isso?`;
  }
  return `Tengo estos datos preliminares: ${leadVolumePeriod} leads, ${missedPercent}% sin seguimiento y ticket medio ${averageDealValue}€. ¿Me confirmas que calcule con esto?`;
}

function buildRoiCloseSuffix(lang: Language): string {
  if (lang === 'pt-BR') {
    return ' Se faz sentido, agendamos 15 min e te mostro como recuperar essa margem no próximo ciclo.';
  }
  return ' Si te encaja, agendamos 15 min y te enseño cómo recuperar ese margen en el próximo ciclo.';
}

/**
 * Sprint 3.4 V.L.A.E.G. — Deuda #5.
 * Normaliza payload do closer garantindo `message: string`.
 * O prompt do closer pode devolver `cta`, `ctaMessage` ou `message`.
 * Mantemos todos os aliases para compat (incluindo `cta`).
 */
function normalizePayload(
  raw: Record<string, unknown> | null | undefined,
  fallback: ReturnType<typeof getFallback>,
): Record<string, unknown> {
  const source = raw && typeof raw === 'object' ? raw : {};

  const candidate =
    (typeof source.message === 'string' && source.message.trim() !== '' && source.message) ||
    (typeof (source as Record<string, unknown>).cta === 'string' &&
      ((source as Record<string, unknown>).cta as string).trim() !== '' &&
      ((source as Record<string, unknown>).cta as string)) ||
    (typeof (source as Record<string, unknown>).ctaMessage === 'string' &&
      ((source as Record<string, unknown>).ctaMessage as string).trim() !== '' &&
      ((source as Record<string, unknown>).ctaMessage as string)) ||
    (typeof (source as Record<string, unknown>).response === 'string' &&
      ((source as Record<string, unknown>).response as string).trim() !== '' &&
      ((source as Record<string, unknown>).response as string)) ||
    fallback.message;

  return {
    ...fallback,
    ...source,
    message: candidate,
  };
}

export class CloserAgent implements SalesAgent {
  name = 'CLOSER' as const;

  async run(context: AgentContext) {
    const lang: Language = resolveLanguage(context.lead.preferredLanguage ?? null);
    const roiMode = shouldTriggerRoiSalesMode(context);

    if (roiMode) {
      const extracted = extractRoiInputs(context.message ?? '');
      if (!hasCompleteRoiInputs(extracted)) {
        return {
          agent: this.name,
          summary: 'ROI_SALES_MODE ativado, faltam dados financeiros.',
          payload: {
            roiMode: true,
            needsInput: true,
            message: buildRoiInputsRequest(lang),
            nextStep: 'Coletar inputs de ROI e repetir tentativa de fechamento.',
          },
        };
      }

      if (!hasRoiConfirmation(context.message ?? '')) {
        return {
          agent: this.name,
          summary: 'ROI_SALES_MODE aguardando confirmação explícita antes de calcular.',
          payload: {
            roiMode: true,
            needsInput: true,
            message: buildRoiConfirmRequest(
              extracted.leadVolumePeriod,
              extracted.missedPercent,
              extracted.averageDealValue,
              lang
            ),
            nextStep: 'Aguardar confirmação explícita antes do cálculo de ROI.',
          },
        };
      }

      const inputs = {
        leadVolumePeriod: extracted.leadVolumePeriod as number,
        missedPercent: extracted.missedPercent as number,
        averageDealValue: extracted.averageDealValue as number,
      };
      const computed = computeRoi(inputs);
      const message = `${buildRoiMessage(inputs, computed)}${buildRoiCloseSuffix(lang)}`;

      return {
        agent: this.name,
        summary: 'Mensagem de fechamento ROI_SALES_MODE gerada.',
        payload: {
          roiMode: true,
          needsInput: false,
          message,
          ctaType: 'BOOK_CALL',
          roiSummary: {
            leadVolumePeriod: inputs.leadVolumePeriod,
            missedFollowupPct: inputs.missedPercent,
            avgDealValue: inputs.averageDealValue,
            estimatedMissedRevenue: computed.lostRevenue,
            estimatedRecoveryLow: computed.recoveryLow,
            estimatedRecoveryHigh: computed.recoveryHigh,
          },
        },
      };
    }

    // System prompt do Closer já era PT-BR no original.
    // getPrompt('closer', lang) devolve a versão correspondente ao idioma do lead.
    const systemPrompt = getPrompt('closer', lang);
    const result = await runAgentPrompt(systemPrompt, context, 'CLOSER');
    const fallback = getFallback(lang);
    const payload = normalizePayload(
      result.json as Record<string, unknown> | null,
      fallback,
    );

    return {
      agent: this.name,
      summary: 'Mensagem de fechamento e CTA gerados.',
      payload,
    };
  }
}
