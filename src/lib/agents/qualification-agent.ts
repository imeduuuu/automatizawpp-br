import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { AGENT_PROMPTS } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

export class QualificationAgent implements SalesAgent {
  name = 'QUALIFICATION' as const;

  async run(context: AgentContext) {
    const result = await runAgentPrompt(AGENT_PROMPTS.QUALIFICATION, context, 'QUALIFICATION');
    const fallback = {
      scoreDelta: context.lead.intentLevel === 'HIGH' ? 12 : 5,
      statusRecommendation: context.lead.intentLevel === 'HIGH' ? 'SALES_READY' : 'QUALIFYING',
      evidence: ['Conversation indicates active interest.'],
      nextQuestion: 'Who besides you is involved in the final decision?'
    };

    return {
      agent: this.name,
      summary: 'Qualification assessment completed.',
      payload: (result.json as Record<string, unknown>) ?? fallback
    };
  }
}
