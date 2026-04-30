import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { AGENT_PROMPTS } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';
import { computeRoi, extractRoiInputs, hasCompleteRoiInputs } from '@/lib/roi/roi-sales-mode';

export class MemoryAgent implements SalesAgent {
  name = 'MEMORY' as const;

  async run(context: AgentContext) {
    const extracted = extractRoiInputs(context.message ?? '');
    if (hasCompleteRoiInputs(extracted)) {
      const roi = computeRoi(extracted);
      return {
        agent: this.name,
        summary: 'Memory ROI snapshot refreshed.',
        payload: {
          summary: `ROI snapshot updated for ${context.lead.fullName}.`,
          keyFacts: [
            `lead_volume:${extracted.leadVolumePeriod}`,
            `missed_pct:${extracted.missedPercent}`,
            `avg_deal_value:${extracted.averageDealValue}`,
            `estimated_missed_revenue:${Math.round(roi.lostRevenue)}`
          ],
          changedFields: [
            'leadVolumePeriod',
            'missedFollowupPct',
            'avgDealValue',
            'estimatedMissedRevenue',
            'estimatedRecoveryLow',
            'estimatedRecoveryHigh',
            'roiSummary'
          ],
          roiSummary: {
            leadVolumePeriod: extracted.leadVolumePeriod,
            missedFollowupPct: extracted.missedPercent,
            avgDealValue: extracted.averageDealValue,
            estimatedMissedRevenue: roi.lostRevenue,
            estimatedRecoveryLow: roi.recoveryLow,
            estimatedRecoveryHigh: roi.recoveryHigh
          }
        }
      };
    }

    const result = await runAgentPrompt(AGENT_PROMPTS.MEMORY, context, 'MEMORY');
    const fallback = {
      summary: `Lead ${context.lead.fullName} currently ${context.lead.status.toLowerCase()} with score ${context.lead.leadScoreValue}.`,
      keyFacts: [context.lead.productInterest, context.lead.source].filter(Boolean),
      changedFields: ['lastTouchpointSummary']
    };

    return {
      agent: this.name,
      summary: 'Memory snapshot refreshed.',
      payload: (result.json as Record<string, unknown>) ?? fallback
    };
  }
}
