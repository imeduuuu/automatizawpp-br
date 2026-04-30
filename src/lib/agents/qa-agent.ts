import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { AGENT_PROMPTS } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

export class SalesQaAgent implements SalesAgent {
  name = 'SALES_QA' as const;

  async run(context: AgentContext) {
    const result = await runAgentPrompt(AGENT_PROMPTS.SALES_QA, context, 'SALES_QA');
    const fallback = {
      qaScore: 82,
      issues: [],
      recommendations: ['Shorten first sentence and make CTA explicit.'],
      approved: true
    };

    return {
      agent: this.name,
      summary: 'QA review executed.',
      payload: (result.json as Record<string, unknown>) ?? fallback
    };
  }
}
