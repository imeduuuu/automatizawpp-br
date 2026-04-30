import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { AGENT_PROMPTS } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

function detectObjectionType(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('expensive') || lower.includes('caro') || lower.includes('precio')) return 'PRICE';
  if (lower.includes('later') || lower.includes('despues') || lower.includes('timing')) return 'TIMING';
  if (lower.includes('send info') || lower.includes('informacion')) return 'SEND_INFO';
  if (lower.includes('need to think') || lower.includes('pensar')) return 'NEED_TO_THINK';
  if (lower.includes('not interested') || lower.includes('no me interesa')) return 'NOT_INTERESTED';
  return 'OTHER';
}

export class ObjectionHandlingAgent implements SalesAgent {
  name = 'OBJECTION_HANDLER' as const;

  async run(context: AgentContext) {
    const result = await runAgentPrompt(AGENT_PROMPTS.OBJECTION_HANDLER, context, 'OBJECTION_HANDLER');
    const objectionType = detectObjectionType(context.message ?? '');

    const fallback = {
      objectionType,
      response:
        'Totally fair. If it helps, we can start with a narrow pilot focused on one revenue bottleneck, so you can validate results before scaling.',
      followUpQuestion: 'Would a low-risk pilot for 14 days make this decision easier?',
      confidence: 0.64
    };

    return {
      agent: this.name,
      summary: 'Objection analyzed and response drafted.',
      payload: (result.json as Record<string, unknown>) ?? fallback
    };
  }
}
