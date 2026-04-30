import { FixAction } from '@/lib/sentinel/types';

export interface FixResult {
  success: boolean;
  message: string;
  responseCode?: number;
  responseBody?: unknown;
}

function getN8nAuthHeaders() {
  const apiKey = process.env.N8N_API_KEY?.trim();
  return apiKey ? { 'X-N8N-API-KEY': apiKey } : {};
}

export async function executeAutoFix(action: FixAction): Promise<FixResult> {
  const n8nUrl = process.env.N8N_URL?.trim() || 'http://localhost:5678';
  const vapiKey = process.env.VAPI_API_KEY?.trim() || '';

  try {
    let url = action.endpoint || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(action.headers || {})
    };

    switch (action.type) {
      case 'n8n_retry':
      case 'n8n_toggle':
        if (!url.startsWith('http')) {
          url = `${n8nUrl}${url}`;
        }
        Object.assign(headers, getN8nAuthHeaders());
        break;
      case 'vapi_patch':
        if (!url.startsWith('http')) {
          url = `https://api.vapi.ai${url}`;
        }
        if (vapiKey) {
          headers.Authorization = `Bearer ${vapiKey}`;
        }
        break;
      default:
        break;
    }

    if (!url) {
      return { success: false, message: 'No endpoint specified' };
    }

    const res = await fetch(url, {
      method: action.method || 'POST',
      headers,
      body: action.body ? JSON.stringify(action.body) : undefined,
      signal: AbortSignal.timeout(15000)
    });

    const bodyText = await res.text();
    let bodyJson: unknown;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {
      bodyJson = bodyText;
    }

    return {
      success: res.ok,
      message: res.ok
        ? `Fix aplicado correctamente (HTTP ${res.status})`
        : `Fix falló (HTTP ${res.status}): ${bodyText.slice(0, 200)}`,
      responseCode: res.status,
      responseBody: bodyJson
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error ejecutando fix: ${message}`
    };
  }
}
