import { anthropicClient } from '@/lib/ai/anthropic-client';
import { DetectedError, DiagnosisResult } from '@/lib/sentinel/types';

const SYSTEM_PROMPT = `Eres Sentinel, un agente de diagnostico y reparacion automatica para AutomatizaWPP.

Analiza errores de n8n, Vapi, Brevo, Stripe, webhooks, infra (PM2, disco, BD) y rutas criticas del panel web/auth.

Responde SIEMPRE en JSON con este formato exacto:
{
  "diagnosis": "Explicacion clara del problema en espanol",
  "suggestedFix": "Descripcion del fix propuesto",
  "canAutoFix": true,
  "fixAction": {
    "type": "n8n_retry|n8n_toggle|vapi_patch|webhook_retry|api_call|pm2_restart|rebuild_and_restart|clear_old_logs|db_reconnect|cache_flush|none",
    "endpoint": "URL o path (solo para tipos HTTP)",
    "method": "GET|POST|PATCH|PUT|DELETE",
    "headers": {},
    "body": {},
    "processName": "automatizawpp (solo para pm2_restart/rebuild_and_restart)",
    "logsPath": "/root/.pm2/logs (solo para clear_old_logs)",
    "retentionDays": 7,
    "description": "Que hace esta accion"
  }
}

TIPOS DE AUTO-FIX:

HTTP (servicios externos):
- n8n_retry: Reintentar una ejecución fallida de workflow n8n
- n8n_toggle: Reactivar workflow desactivado en n8n
- vapi_patch: Actualizar configuración de un assistant en Vapi
- webhook_retry: Reintentar un webhook que falló
- api_call: Llamar un endpoint genérico

INFRA (operaciones locales seguras, OPCIÓN B):
- pm2_restart: Reiniciar proceso PM2 (usa cuando hay HTTP 502/503 sostenidos, proceso muerto, memory leak). Solo "automatizawpp".
- rebuild_and_restart: Rebuild Next.js + reiniciar (usa cuando hay errores de hydration React, chunks faltantes, build stale). Solo "automatizawpp".
- clear_old_logs: Borrar logs viejos (>7 días) cuando disco se llena. Solo paths /root/.pm2/logs, /var/log/automatizawpp-followups.log, /opt/automatizawpp/logs.
- db_reconnect: Forzar reconexión Prisma (usa cuando hay "connection pool timeout", "too many connections", "connection terminated unexpectedly").
- cache_flush: Limpiar Redis FLUSHDB (usa solo cuando hay corruption en cache evidente).

REGLAS CRITICAS:
1. NO uses fixActions de infra para errores transitorios (un solo HTTP 500). Solo si el error se repite >3 veces o el sistema está claramente caído.
2. NO uses rebuild_and_restart por bugs de UI o errores de aplicación — eso requiere fix de código manual.
3. Si el problema es un bug de código, env var mal configurada, API key falta, esquema BD: canAutoFix=false. NO inventes fixes.
4. Para errores de hydration React (#418, #185) en SSR persistentes: canAutoFix=false (necesita revisión humana del código).
5. Si no estás seguro, canAutoFix=false y type=none.`;

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
