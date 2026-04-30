import { DetectedError } from '@/lib/sentinel/types';

type EndpointCheck = {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  expectedStatuses?: number[];
  body?: Record<string, unknown>;
};

function getBaseUrl() {
  const explicit = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (explicit) return explicit;

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
  }

  return 'http://localhost:3001';
}

export async function scanWebhooks(): Promise<DetectedError[]> {
  const errors: DetectedError[] = [];
  const baseUrl = getBaseUrl().replace(/\/$/, '');

  const endpoints: EndpointCheck[] = [
    {
      name: 'Metrics API',
      url: `${baseUrl}/api/metrics`,
      method: 'GET'
    },
    {
      name: 'Sentinel Stats',
      url: `${baseUrl}/api/sentinel/stats`,
      method: 'GET'
    },
    {
      name: 'Inbound Events API',
      url: `${baseUrl}/api/events/inbound`,
      method: 'POST',
      body: {},
      expectedStatuses: [200, 400]
    }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.body ? { 'Content-Type': 'application/json' } : undefined,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        signal: AbortSignal.timeout(8000)
      });

      const expectedStatuses = endpoint.expectedStatuses ?? [200];
      if (expectedStatuses.includes(response.status)) continue;
      if (response.status >= 500) {
        errors.push({
          source: 'webhook',
          severity: 'critical',
          title: `${endpoint.name} devuelve error ${response.status}`,
          rawError: `${endpoint.method} ${endpoint.url} → HTTP ${response.status}`,
          metadata: {
            endpoint: endpoint.url,
            statusCode: response.status,
            method: endpoint.method
          }
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        source: 'webhook',
        severity: 'critical',
        title: `${endpoint.name} no responde`,
        rawError: `${endpoint.url}: ${message}`,
        metadata: { endpoint: endpoint.url, method: endpoint.method }
      });
    }
  }

  return errors;
}
