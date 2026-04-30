import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { AGENT_PROMPTS } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

export class CallAssistAgent implements SalesAgent {
  name = 'CALL_ASSIST' as const;

  async run(context: AgentContext) {
    const result = await runAgentPrompt(AGENT_PROMPTS.CALL_ASSIST, context, 'CALL_ASSIST');

    const fallback = {
      scriptSections: [
        'Opening: establish context and permission',
        'Discovery: top pain and impact timeline',
        'Qualification: budget, authority, urgency',
        'Positioning: tailored solution + proof',
        'Close: booking/payment CTA + clear next step'
      ],
      objections: ['PRICE', 'TIMING'],
      urgency: context.lead.urgencyLevel,
      summary: `Prepared outbound call flow for ${context.lead.fullName}.`,
      nextAction: 'Schedule call and send confirmation.'
    };

    return {
      agent: this.name,
      summary: 'Call workflow package created.',
      payload: (result.json as Record<string, unknown>) ?? fallback
    };
  }
}
