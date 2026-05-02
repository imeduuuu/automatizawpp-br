import { anthropicClient } from '@/lib/ai/anthropic-client';
import { DetectedError, DiagnosisResult } from '@/lib/sentinel/types';

const SYSTEM_PROMPT = `Eres Sentinel, un agente de diagnostico y reparacion automatica para AutomatizaWPP.

Analiza errores de n8n, Vapi, Brevo, Stripe, webhooks y rutas criticas del panel web/auth.

Responde SIEMPRE en JSON con este formato exacto:
{
  "diagnosis": "Explicacion clara del problema en espanol",
  "suggestedFix": "Descripcion del fix propuesto",
  "canAutoFix": true,
  "fixAction": {
    "type": "n8n_retry|n8n_toggle|vapi_patch|webhook_retry|api_call|none",
    "endpoint": "URL o path",
    "method": "GET|POST|PATCH|PUT|DELETE",
    "headers": {},
    "body": {},
    "description": "Que hace esta accion"
  }
}

Si no estas seguro, usa canAutoFix=false y type=none.`;

export async function diagnoseError(error: DetectedError): Promise<DiagnosisResult> {
  if (!anthropicClient) {
    return {
      diagnosis: `Diagnostico automatico no disponible para ${error.source}.`,
      suggestedFix: 'Revisar manualmente el error y la integracion afectada.',
      canAutoFix: false
    };
  }

  try {
    const response = await anthropicClient.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      messages: [
        {
          role: 'user',
          content: `${SYSTEM_PROMPT}\n\nError detectado:\n\nFuente: ${error.source}\nSeveridad: ${error.severity}\nTitulo: ${error.title}\nDetalles:\n${error.rawError}\n\nMetadata: ${JSON.stringify(error.metadata || {})}`
        }
      ],
      max_tokens: 800
    });

    const textBlock = response.content.find(block => block.type === 'text');
    const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '{}';
    const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const content = codeBlock ? codeBlock[1].trim() : raw.trim();
    const parsed = JSON.parse(content);

    return {
      diagnosis: parsed.diagnosis || 'No se pudo diagnosticar',
      suggestedFix: parsed.suggestedFix || 'Sin sugerencia',
      canAutoFix: Boolean(parsed.canAutoFix),
      fixAction: parsed.fixAction || undefined
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      diagnosis: `Error del diagnosador: ${message}`,
      suggestedFix: 'Revisar manualmente',
      canAutoFix: false
    };
  }
}
