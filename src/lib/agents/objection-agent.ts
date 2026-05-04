import { SalesAgent, AgentContext } from '@/lib/agents/contracts';
import { getPrompt, Language, resolveLanguage } from '@/lib/agents/prompts';
import { runAgentPrompt } from '@/lib/agents/utils';

/**
 * Sprint 3.4 V.L.A.E.G. — Deuda #4.
 * Detecta o tipo de objeção usando SOMENTE keywords PT-BR e ES.
 * Os nomes das categorias (PRICE, TIMING, etc.) ficam em EN porque são
 * enums técnicos internos consumidos pelo prompt — não vão para a UI.
 *
 * Estratégia: avalia ambas as listas (PT-BR + ES) e devolve o primeiro
 * match. A função tenta primeiro por idioma quando `lang` é fornecido,
 * mas sempre cai na lista do outro idioma para tolerância a mensagens
 * mistas (ex.: lead PT que usa termos em ES).
 */
const OBJECTION_KEYWORDS: Record<Language, Array<{ type: string; words: string[] }>> = {
  'pt-BR': [
    { type: 'PRICE', words: ['caro', 'preço', 'preco', 'custo', 'orçamento', 'orcamento', 'valor alto'] },
    { type: 'TIMING', words: ['depois', 'mais tarde', 'agora não', 'agora nao', 'ano que vem', 'próximo mês', 'proximo mes'] },
    { type: 'SEND_INFO', words: ['manda informação', 'manda info', 'envia material', 'manda material', 'envia por escrito'] },
    { type: 'NEED_TO_THINK', words: ['preciso pensar', 'vou pensar', 'pensar melhor', 'avaliar com calma'] },
    { type: 'NOT_INTERESTED', words: ['não tenho interesse', 'nao tenho interesse', 'não me interessa', 'nao me interessa'] },
  ],
  es: [
    { type: 'PRICE', words: ['caro', 'precio', 'costoso', 'presupuesto', 'muy alto'] },
    { type: 'TIMING', words: ['después', 'despues', 'más tarde', 'mas tarde', 'ahora no', 'el próximo mes', 'el proximo mes'] },
    { type: 'SEND_INFO', words: ['envía información', 'envia informacion', 'mándame info', 'mandame info', 'pásame material', 'pasame material'] },
    { type: 'NEED_TO_THINK', words: ['necesito pensar', 'lo voy a pensar', 'pensarlo', 'evaluarlo con calma'] },
    { type: 'NOT_INTERESTED', words: ['no me interesa', 'no tengo interés', 'no tengo interes'] },
  ],
};

function detectObjectionType(text: string, lang?: Language): string {
  const lower = text.toLowerCase();
  // Ordem de avaliação: idioma do lead primeiro, depois o outro como fallback.
  const order: Language[] = lang === 'pt-BR' ? ['pt-BR', 'es'] : ['es', 'pt-BR'];

  for (const idioma of order) {
    for (const grupo of OBJECTION_KEYWORDS[idioma]) {
      if (grupo.words.some((kw) => lower.includes(kw))) {
        return grupo.type;
      }
    }
  }
  return 'OTHER';
}

/**
 * Fallback bilingue. Sprint 1.2 V.L.A.E.G.
 * Sprint 3.3: agora inclui `message` para o QA gate de route.ts.
 */
function getFallback(objectionType: string, lang: Language) {
  if (lang === 'pt-BR') {
    const message =
      'Entendo sua preocupação. Posso te explicar melhor como funciona pra ver se faz sentido pro seu caso?';
    return {
      objectionType,
      type: objectionType,
      message,
      response: message,
      reframedResponse: message,
      followUpQuestion: 'Um piloto de baixo risco de 14 dias deixaria essa decisão mais fácil?',
      buyingSignalDetected: false,
      confidence: 0.64,
    };
  }
  const message =
    'Entiendo tu preocupación. ¿Te explico mejor cómo funciona para ver si encaja en tu caso?';
  return {
    objectionType,
    type: objectionType,
    message,
    response: message,
    reframedResponse: message,
    followUpQuestion: '¿Un piloto de bajo riesgo de 14 días haría más fácil esta decisión?',
    buyingSignalDetected: false,
    confidence: 0.64,
  };
}

/**
 * Sprint 3.3 V.L.A.E.G.
 * Normaliza o payload para garantir SEMPRE `message: string` não vazia.
 * O prompt `objection` devolve `reframedResponse` — outros consumers podem
 * esperar `response` ou `message`. Mantemos todos os aliases para compat.
 */
function normalizePayload(
  raw: Record<string, unknown> | null | undefined,
  objectionType: string,
  lang: Language,
): Record<string, unknown> {
  const fallback = getFallback(objectionType, lang);
  const source = raw && typeof raw === 'object' ? raw : {};

  const candidate =
    (typeof source.message === 'string' && source.message.trim() !== '' && source.message) ||
    (typeof source.reframedResponse === 'string' &&
      source.reframedResponse.trim() !== '' &&
      source.reframedResponse) ||
    (typeof source.response === 'string' && source.response.trim() !== '' && source.response) ||
    (typeof source.text === 'string' && source.text.trim() !== '' && source.text) ||
    (fallback.message as string);

  return {
    ...fallback,
    ...source,
    objectionType,
    message: candidate,
    response: candidate,
    reframedResponse: candidate,
  };
}

export class ObjectionHandlingAgent implements SalesAgent {
  name = 'OBJECTION_HANDLER' as const;

  async run(context: AgentContext) {
    const lang: Language = resolveLanguage(context.lead.preferredLanguage ?? null);
    const systemPrompt = getPrompt('objection', lang);

    const result = await runAgentPrompt(systemPrompt, context, 'OBJECTION_HANDLER');
    const objectionType = detectObjectionType(context.message ?? '', lang);

    const payload = normalizePayload(
      result.json as Record<string, unknown> | null,
      objectionType,
      lang,
    );

    return {
      agent: this.name,
      summary: 'Objeção analisada e resposta preparada.',
      payload,
    };
  }
}
