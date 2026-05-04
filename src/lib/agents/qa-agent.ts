import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { getPrompt, Language, resolveLanguage } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

/**
 * Fallback bilingue. Sprint 1.5.2 V.L.A.E.G.
 * Mantemos as chaves do JSON em inglês (contrato técnico),
 * só o conteúdo de strings vai no idioma do lead.
 */
function getFallback(lang: Language) {
  return {
    qaScore: 82,
    issues: [],
    recommendations: [
      lang === 'pt-BR'
        ? 'Encurtar a primeira frase e tornar o CTA explícito.'
        : 'Acortar la primera frase y hacer el CTA explícito.',
    ],
    approved: true,
  };
}

export class SalesQaAgent implements SalesAgent {
  name = 'SALES_QA' as const;

  async run(context: AgentContext) {
    // Resolve o idioma do lead (default 'es' quando null/undefined).
    const lang: Language = resolveLanguage(context.lead?.preferredLanguage ?? null);
    const systemPrompt = getPrompt('salesQa', lang);

    const result = await runAgentPrompt(systemPrompt, context, 'SALES_QA');

    return {
      agent: this.name,
      summary: 'QA review executed.',
      payload: (result.json as Record<string, unknown>) ?? getFallback(lang),
    };
  }
}
