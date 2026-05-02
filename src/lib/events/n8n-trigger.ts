// Triggering n8n workflows via webhooks

import { N8nWebhookPayload } from './types';

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
const N8N_WEBHOOK_AUTH = process.env.N8N_WEBHOOK_AUTH || '';

interface N8nWorkflowTrigger {
  workflowId: string;
  webhookPath: string;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

// Mapeo de eventos a workflows n8n
const WORKFLOW_MAPPING: Record<string, N8nWorkflowTrigger> = {
  'lead-created': {
    workflowId: 'lead-created',
    webhookPath: 'lead-created',
    retryOnFailure: true,
    maxRetries: 3,
  },
  'email-received': {
    workflowId: 'email-received',
    webhookPath: 'email-received',
    retryOnFailure: true,
    maxRetries: 3,
  },
  'call-logged': {
    workflowId: 'call-logged',
    webhookPath: 'call-logged',
    retryOnFailure: true,
    maxRetries: 2,
  },
  'welcome-email': {
    workflowId: 'welcome-email',
    webhookPath: 'welcome-email',
    retryOnFailure: true,
    maxRetries: 3,
  },
  'crm-update': {
    workflowId: 'crm-update',
    webhookPath: 'crm-update',
    retryOnFailure: false,
    maxRetries: 1,
  },
};

export async function triggerN8nWorkflow(
  workflowKey: string,
  payload: any,
  retryCount = 0
): Promise<void> {
  const workflow = WORKFLOW_MAPPING[workflowKey];
  if (!workflow) {
    console.warn(`[n8n-trigger] Unknown workflow: ${workflowKey}`);
    return;
  }

  const webhookUrl = `${N8N_BASE_URL}/${workflow.webhookPath}`;
  const n8nPayload: N8nWebhookPayload = {
    eventType: workflowKey,
    eventId: payload.eventId,
    timestamp: new Date().toISOString(),
    workspaceId: payload.workspaceId,
    leadId: payload.leadId,
    data: payload.data,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_WEBHOOK_AUTH && { 'Authorization': `Bearer ${N8N_WEBHOOK_AUTH}` }),
      },
      body: JSON.stringify(n8nPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`n8n returned ${response.status}: ${text}`);
    }

    const result = await response.json();
    console.log(`[n8n-trigger] Workflow ${workflowKey} triggered successfully:`, result);

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[n8n-trigger] Failed to trigger ${workflowKey}:`, errorMsg);

    // Retry logic
    if (workflow.retryOnFailure && retryCount < (workflow.maxRetries || 3)) {
      console.log(`[n8n-trigger] Retrying ${workflowKey} (attempt ${retryCount + 1}/${workflow.maxRetries})...`);
      // Exponential backoff: 2^n * 1000ms
      const delayMs = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return triggerN8nWorkflow(workflowKey, payload, retryCount + 1);
    }

    throw error;
  }
}

// Verificar conectividad con n8n
export async function checkN8nHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${N8N_BASE_URL.replace('/webhook', '')}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    console.warn('[n8n-trigger] n8n health check failed');
    return false;
  }
}
