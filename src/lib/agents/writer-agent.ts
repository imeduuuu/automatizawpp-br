import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { AGENT_PROMPTS } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

export class WriterAgent implements SalesAgent {
  name = 'WRITER' as const;

  async run(context: AgentContext) {
    const result = await runAgentPrompt(AGENT_PROMPTS.WRITER, context, 'WRITER');
    const fallback = {
      finalMessage: context.message ?? 'Could you share your top priority so I tailor the next steps?',
      channelVariants: {
        WHATSAPP: context.message,
        EMAIL: `Subject: Quick next step\n\n${context.message}`,
        SMS: context.message
      },
      toneNotes: 'Concise and consultative.'
    };

    return {
      agent: this.name,
      summary: 'Message polished for channel consistency.',
      payload: (result.json as Record<string, unknown>) ?? fallback
    };
  }
}
