import { callAIStructured } from '@/lib/ai/anthropic-client';
import { AgentContext } from '@/lib/agents/contracts';
import { AgentName } from '@prisma/client';
import { getAgentFewShotExamples } from '@/lib/tuning/feedback-service';
import { Language, resolveLanguage } from '@/lib/agents/prompts';

/**
 * Constrói o user prompt (string JSON) que é enviado ao LLM junto com o system prompt.
 * Sprint 1.1 V.L.A.E.G.: aceita lang para escolher labels da seção "approvedExamples".
 */
export function buildUserPrompt(
  context: AgentContext,
  examples: Array<{ score?: number; messageText?: string; outcome?: string }>,
  lang: Language = 'es'
) {
  const labels =
    lang === 'pt-BR'
      ? {
          example: (i: number, score: unknown) => `Exemplo ${i} (score ${score})`,
          outcome: 'resultado',
          empty: 'Ainda não há exemplos aprovados. Use a política de melhor prática.',
        }
      : {
          example: (i: number, score: unknown) => `Ejemplo ${i} (score ${score})`,
          outcome: 'resultado',
          empty: 'Aún no hay ejemplos aprobados. Usa la política de mejor práctica.',
        };

  const examplesSection = examples.length
    ? examples
        .map(
          (example, index) =>
            `${labels.example(index + 1, example.score)}: ${example.messageText} -> ${labels.outcome}: ${example.outcome}`
        )
        .join('\n')
    : labels.empty;

  return JSON.stringify(
    {
      objective: context.objective,
      lead: context.lead,
      channel: context.channel,
      message: context.message,
      memorySummary: context.memorySummary,
      recentMessages: context.recentMessages,
      complianceState: context.complianceState,
      approvedExamples: examplesSection,
    },
    null,
    2
  );
}

/**
 * Helper para resolver el idioma del agente desde el AgentContext.
 * Lê context.lead.preferredLanguage (default 'es' si null/undefined).
 */
export function resolveAgentLanguage(context: AgentContext): Language {
  return resolveLanguage(context.lead.preferredLanguage ?? null);
}

export async function runAgentPrompt(
  systemPrompt: string,
  context: AgentContext,
  agentName?: AgentName
) {
  const lang = resolveAgentLanguage(context);
  const examples = agentName ? await getAgentFewShotExamples(context.workspaceId, agentName, 21, 4) : [];
  const userPrompt = buildUserPrompt(context, examples, lang);
  const json = await callAIStructured<Record<string, unknown>>(systemPrompt, userPrompt, 2000);
  return { json };
}
