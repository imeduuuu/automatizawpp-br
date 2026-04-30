import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { AGENT_PROMPTS } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

function fallbackReply(context: AgentContext) {
  const name = context.lead.fullName.split(' ')[0] ?? 'there';
  return {
    message: `Hi ${name}, thanks for reaching out. To guide you properly, what is the most urgent sales outcome you want in the next 30 days?`,
    intentHypothesis: context.lead.intentLevel,
    confidence: 0.6,
    suggestedNextAgent: 'QUALIFICATION'
  };
}

export class LeadResponseAgent implements SalesAgent {
  name = 'LEAD_RESPONSE' as const;

  async run(context: AgentContext) {
    const result = await runAgentPrompt(AGENT_PROMPTS.LEAD_RESPONSE, context, 'LEAD_RESPONSE');
    const payload = (result.json as Record<string, unknown>) ?? fallbackReply(context);

    return {
      agent: this.name,
      summary: 'Inbound lead response generated.',
      payload
    };
  }
}
