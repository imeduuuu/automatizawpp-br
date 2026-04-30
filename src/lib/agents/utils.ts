import { callAIStructured } from '@/lib/ai/anthropic-client';
import { AgentContext } from '@/lib/agents/contracts';
import { AgentName } from '@prisma/client';
import { getAgentFewShotExamples } from '@/lib/tuning/feedback-service';

export function buildUserPrompt(context: AgentContext, examples: Array<{ score?: number; messageText?: string; outcome?: string }>) {
  const examplesSection = examples.length
    ? examples
        .map((example, index) => `Example ${index + 1} (score ${example.score}): ${example.messageText} -> outcome: ${example.outcome}`)
        .join('\n')
    : 'No approved examples available yet. Use best-practice policy.';

  return JSON.stringify(
    {
      objective: context.objective,
      lead: context.lead,
      channel: context.channel,
      message: context.message,
      memorySummary: context.memorySummary,
      recentMessages: context.recentMessages,
      complianceState: context.complianceState,
      approvedExamples: examplesSection
    },
    null,
    2
  );
}

export async function runAgentPrompt(systemPrompt: string, context: AgentContext, agentName?: AgentName) {
  const examples = agentName ? await getAgentFewShotExamples(context.workspaceId, agentName, 21, 4) : [];
  const userPrompt = buildUserPrompt(context, examples);
  const json = await callAIStructured<Record<string, unknown>>(systemPrompt, userPrompt, 2000);
  return { json };
}
