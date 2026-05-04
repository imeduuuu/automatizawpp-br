import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { getPrompt, Language, resolveLanguage } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';
import { computeRoi, extractRoiInputs, hasCompleteRoiInputs } from '@/lib/roi/roi-sales-mode';

/**
 * Fallback bilingue. Sprint 1.2 V.L.A.E.G.
 */
function getFallback(context: AgentContext, lang: Language) {
  const summary =
    lang === 'pt-BR'
      ? `Lead ${context.lead.fullName} atualmente em ${context.lead.status.toLowerCase()} com score ${context.lead.leadScoreValue}.`
      : `Lead ${context.lead.fullName} actualmente en ${context.lead.status.toLowerCase()} con score ${context.lead.leadScoreValue}.`;

  return {
    summary,
    keyFacts: [context.lead.productInterest, context.lead.source].filter(Boolean),
    changedFields: ['lastTouchpointSummary'],
  };
}

/**
 * Resumo ROI bilingue (substitui texto EN do snapshot anterior).
 */
function buildRoiSummaryText(fullName: string, lang: Language): string {
  return lang === 'pt-BR'
    ? `Snapshot de ROI atualizado para ${fullName}.`
    : `Snapshot de ROI actualizado para ${fullName}.`;
}

export class MemoryAgent implements SalesAgent {
  name = 'MEMORY' as const;

  async run(context: AgentContext) {
    const lang: Language = resolveLanguage(context.lead.preferredLanguage ?? null);

    const extracted = extractRoiInputs(context.message ?? '');
    if (hasCompleteRoiInputs(extracted)) {
      const roi = computeRoi(extracted);
      return {
        agent: this.name,
        summary: 'Snapshot de ROI da memória atualizado.',
        payload: {
          summary: buildRoiSummaryText(context.lead.fullName, lang),
          keyFacts: [
            `lead_volume:${extracted.leadVolumePeriod}`,
            `missed_pct:${extracted.missedPercent}`,
            `avg_deal_value:${extracted.averageDealValue}`,
            `estimated_missed_revenue:${Math.round(roi.lostRevenue)}`,
          ],
          changedFields: [
            'leadVolumePeriod',
            'missedFollowupPct',
            'avgDealValue',
            'estimatedMissedRevenue',
            'estimatedRecoveryLow',
            'estimatedRecoveryHigh',
            'roiSummary',
          ],
          roiSummary: {
            leadVolumePeriod: extracted.leadVolumePeriod,
            missedFollowupPct: extracted.missedPercent,
            avgDealValue: extracted.averageDealValue,
            estimatedMissedRevenue: roi.lostRevenue,
            estimatedRecoveryLow: roi.recoveryLow,
            estimatedRecoveryHigh: roi.recoveryHigh,
          },
        },
      };
    }

    const systemPrompt = getPrompt('memory', lang);
    const result = await runAgentPrompt(systemPrompt, context, 'MEMORY');

    // Sprint 3.4 V.L.A.E.G. — Deuda #5: memory-agent NÃO gera `message` para
    // o lead (é apenas análise interna de contexto). Por isso não normalizamos
    // o payload para `message`. Documentado como "não aplicável".
    return {
      agent: this.name,
      summary: 'Snapshot de memória atualizado.',
      payload: (result.json as Record<string, unknown>) ?? getFallback(context, lang),
    };
  }
}
