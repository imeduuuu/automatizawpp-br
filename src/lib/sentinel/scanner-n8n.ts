import { DetectedError } from '@/lib/sentinel/types';

function getN8nUrl() {
  return process.env.N8N_URL?.trim() || 'http://localhost:5678';
}

function getN8nHeaders() {
  const apiKey = process.env.N8N_API_KEY?.trim();
  return apiKey ? { 'X-N8N-API-KEY': apiKey } : null;
}

export async function scanN8n(): Promise<DetectedError[]> {
  const errors: DetectedError[] = [];
  const headers = getN8nHeaders();
  if (!headers) return errors;

  const n8nUrl = getN8nUrl();
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  try {
    const executionRes = await fetch(`${n8nUrl}/api/v1/executions?status=error&startedAfter=${encodeURIComponent(since)}&limit=20`, {
      headers,
      signal: AbortSignal.timeout(10000)
    });

    if (!executionRes.ok) {
      errors.push({
        source: 'n8n',
        severity: 'critical',
        title: 'n8n API no responde',
        rawError: `HTTP ${executionRes.status}: ${executionRes.statusText}`,
        metadata: { statusCode: executionRes.status }
      });
      return errors;
    }

    const executionData = await executionRes.json();
    const executions = Array.isArray(executionData)
      ? executionData
      : executionData.data || executionData.results || [];

    for (const execution of executions) {
      const workflowName = execution.workflowData?.name || execution.workflowName || execution.workflowId || 'Desconocido';
      const errorMessage = execution.data?.resultData?.error?.message || execution.error || 'Ejecución fallida';

      errors.push({
        source: 'n8n',
        severity: 'critical',
        title: `Workflow "${workflowName}" falló`,
        rawError: JSON.stringify(
          {
            executionId: execution.id,
            workflowId: execution.workflowId,
            workflowName,
            error: errorMessage,
            startedAt: execution.startedAt,
            stoppedAt: execution.stoppedAt,
            mode: execution.mode
          },
          null,
          2
        ),
        sourceId: String(execution.id ?? ''),
        metadata: {
          workflowId: execution.workflowId,
          executionId: execution.id
        }
      });
    }

    const workflowRes = await fetch(`${n8nUrl}/api/v1/workflows?active=false&limit=50`, {
      headers,
      signal: AbortSignal.timeout(10000)
    });

    if (!workflowRes.ok) {
      return errors;
    }

    const workflowData = await workflowRes.json();
    const workflows = Array.isArray(workflowData)
      ? workflowData
      : workflowData.data || workflowData.results || [];

    const hourAgo = Date.now() - 60 * 60 * 1000;
    for (const workflow of workflows) {
      if (!workflow.updatedAt) continue;
      const updatedAt = new Date(workflow.updatedAt).getTime();
      if (Number.isNaN(updatedAt) || updatedAt < hourAgo) continue;

      errors.push({
        source: 'n8n',
        severity: 'warning',
        title: `Workflow "${workflow.name}" se desactivó recientemente`,
        rawError: JSON.stringify(
          {
            workflowId: workflow.id,
            name: workflow.name,
            updatedAt: workflow.updatedAt
          },
          null,
          2
        ),
        sourceId: String(workflow.id ?? ''),
        metadata: {
          workflowId: workflow.id,
          type: 'deactivated'
        }
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push({
      source: 'n8n',
      severity: 'critical',
      title: 'No se puede conectar a n8n',
      rawError: message
    });
  }

  return errors;
}
