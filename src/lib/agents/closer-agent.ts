import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { AGENT_PROMPTS } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';
import {
  buildRoiMessage,
  computeRoi,
  extractRoiInputs,
  hasCompleteRoiInputs,
  hasRoiConfirmation,
  shouldTriggerRoiSalesMode
} from '@/lib/roi/roi-sales-mode';

export class CloserAgent implements SalesAgent {
  name = 'CLOSER' as const;

  async run(context: AgentContext) {
    const roiMode = shouldTriggerRoiSalesMode(context);

    if (roiMode) {
      const extracted = extractRoiInputs(context.message ?? '');
      if (!hasCompleteRoiInputs(extracted)) {
        return {
          agent: this.name,
          summary: 'ROI_SALES_MODE activated but missing financial inputs.',
          payload: {
            roiMode: true,
            needsInput: true,
            message:
              'Para calcularlo sin inventar nada, necesito 3 datos: cuántos leads recibes por periodo, qué % se queda sin respuesta/seguimiento y ticket medio por venta.',
            nextStep: 'Collect ROI inputs and rerun close attempt.'
          }
        };
      }

      if (!hasRoiConfirmation(context.message ?? '')) {
        return {
          agent: this.name,
          summary: 'ROI_SALES_MODE waiting for explicit confirmation before calculating.',
          payload: {
            roiMode: true,
            needsInput: true,
            message: `Tengo estos datos preliminares: ${extracted.leadVolumePeriod} leads, ${extracted.missedPercent}% sin seguimiento y ticket medio ${extracted.averageDealValue}€. ¿Me confirmas que calcule con esto?`,
            nextStep: 'Await explicit confirmation before ROI calculation.'
          }
        };
      }

      const inputs = {
        leadVolumePeriod: extracted.leadVolumePeriod as number,
        missedPercent: extracted.missedPercent as number,
        averageDealValue: extracted.averageDealValue as number
      };
      const computed = computeRoi(inputs);
      const message = `${buildRoiMessage(inputs, computed)} Si te encaja, agendamos 15 min y te enseño cómo recuperar ese margen en el próximo ciclo.`;

      return {
        agent: this.name,
        summary: 'ROI_SALES_MODE close message generated.',
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
            estimatedRecoveryHigh: computed.recoveryHigh
          }
        }
      };
    }

    const result = await runAgentPrompt(AGENT_PROMPTS.CLOSER, context, 'CLOSER');
    const fallback = {
      message:
        'Based on your targets, the fastest path is a 20-minute strategy call where we map your first conversion sprint. Does tomorrow 11:00 or 16:00 work better?',
      ctaType: 'BOOK_CALL',
      riskFlags: [],
      fallbackPlan: 'If not ready, move to value-based nurture sequence.'
    };

    return {
      agent: this.name,
      summary: 'Closer message and CTA produced.',
      payload: (result.json as Record<string, unknown>) ?? fallback
    };
  }
}
