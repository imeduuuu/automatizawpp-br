import { DetectedError } from '@/lib/sentinel/types';

type JsonEndpointCheck = {
  name: string;
  url: string;
  expectedStatuses: number[];
  expectedKeys?: string[];
};

type HtmlEndpointCheck = {
  name: string;
  url: string;
  mustInclude: string[];
  mustNotInclude?: string[];
};

function getBaseUrl() {
  const explicit = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  return 'http://localhost:3001';
}

function createRouteError(name: string, rawError: string, metadata: Record<string, unknown>): DetectedError {
  return {
    source: 'panel',
    severity: 'critical',
    title: name,
    rawError,
    metadata
  };
}

async function checkJsonEndpoint(check: JsonEndpointCheck): Promise<DetectedError | null> {
  const response = await fetch(check.url, {
    headers: { Accept: 'application/json' },
    redirect: 'manual',
    signal: AbortSignal.timeout(8000)
  });

  const contentType = response.headers.get('content-type') || '';
  const bodyText = await response.text();

  if (!check.expectedStatuses.includes(response.status)) {
    return createRouteError(
      `${check.name} devuelve ${response.status}`,
      `GET ${check.url} → HTTP ${response.status}\n\n${bodyText.slice(0, 400)}`,
      { endpoint: check.url, statusCode: response.status, expectedStatuses: check.expectedStatuses }
    );
  }

  if (!contentType.includes('application/json')) {
    return createRouteError(
      `${check.name} no devuelve JSON`,
      `GET ${check.url} devolvio content-type ${contentType || 'desconocido'}\n\n${bodyText.slice(0, 400)}`,
      { endpoint: check.url, statusCode: response.status, contentType }
    );
  }

  if (!check.expectedKeys?.length) return null;

  try {
    const payload = JSON.parse(bodyText) as Record<string, unknown>;
    const hasExpectedKey = check.expectedKeys.some((key) => key in payload);
    if (!hasExpectedKey) {
      return createRouteError(
        `${check.name} devuelve JSON inesperado`,
        `GET ${check.url} devolvio JSON sin las claves esperadas (${check.expectedKeys.join(', ')})\n\n${bodyText.slice(0, 400)}`,
        { endpoint: check.url, statusCode: response.status, expectedKeys: check.expectedKeys }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createRouteError(
      `${check.name} devuelve JSON invalido`,
      `GET ${check.url} no se pudo parsear como JSON: ${message}\n\n${bodyText.slice(0, 400)}`,
      { endpoint: check.url, statusCode: response.status, contentType }
    );
  }

  return null;
}

async function checkHtmlEndpoint(check: HtmlEndpointCheck): Promise<DetectedError | null> {
  const response = await fetch(check.url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(8000)
  });

  const finalUrl = response.headers.get('location') || check.url;
  const bodyText = response.status >= 300 && response.status < 400 ? '' : await response.text();

  if (response.status >= 300 && response.status < 400) {
    if (check.mustInclude.some((token) => finalUrl.includes(token))) {
      return null;
    }

    return createRouteError(
      `${check.name} redirige a destino incorrecto`,
      `GET ${check.url} → ${response.status} Location: ${finalUrl}`,
      { endpoint: check.url, statusCode: response.status, location: finalUrl }
    );
  }

  if (!response.ok) {
    return createRouteError(
      `${check.name} devuelve ${response.status}`,
      `GET ${check.url} → HTTP ${response.status}\n\n${bodyText.slice(0, 400)}`,
      { endpoint: check.url, statusCode: response.status }
    );
  }

  const missing = check.mustInclude.filter((token) => !bodyText.includes(token));
  if (missing.length) {
    return createRouteError(
      `${check.name} no muestra el contenido esperado`,
      `GET ${check.url} no contiene: ${missing.join(', ')}\n\n${bodyText.slice(0, 400)}`,
      { endpoint: check.url, statusCode: response.status, missing }
    );
  }

  const unexpected = (check.mustNotInclude || []).filter((token) => bodyText.includes(token));
  if (unexpected.length) {
    return createRouteError(
      `${check.name} muestra contenido del producto cuando no debe`,
      `GET ${check.url} contiene contenido no permitido: ${unexpected.join(', ')}`,
      { endpoint: check.url, statusCode: response.status, unexpected }
    );
  }

  return null;
}

export async function scanPanelRoutes(): Promise<DetectedError[]> {
  const baseUrl = getBaseUrl();
  const errors: DetectedError[] = [];

  const jsonChecks: JsonEndpointCheck[] = [
    {
      name: 'Agents API privada',
      url: `${baseUrl}/api/agents`,
      expectedStatuses: [200, 401],
      expectedKeys: ['agents', 'error']
    },
    {
      name: 'Settings API privada',
      url: `${baseUrl}/api/settings`,
      expectedStatuses: [200, 401],
      expectedKeys: ['workspaceName', 'error']
    },
    {
      name: 'Alex config API privada',
      url: `${baseUrl}/api/alex/config`,
      expectedStatuses: [200, 401],
      expectedKeys: ['assistant', 'error']
    }
  ];

  const htmlChecks: HtmlEndpointCheck[] = [
    {
      name: 'Force-login protegido',
      url: `${baseUrl}/force-login?callbackUrl=/dashboard`,
      mustInclude: ['/login?callbackUrl=%2Fdashboard&force=1']
    },
    {
      name: 'Recuperação de senha',
      url: `${baseUrl}/forgot-password?force=1`,
      mustInclude: ['Enviar link'],
      mustNotInclude: ['Prospectos', 'Conversaciones', 'Monitor de agentes']
    },
    {
      name: 'Login admin',
      url: `${baseUrl}/login?force=1&callbackUrl=/dashboard`,
      mustInclude: ['current-password'],
      mustNotInclude: ['Prospectos', 'Conversaciones', 'Monitor de agentes']
    }
  ];

  for (const check of jsonChecks) {
    try {
      const error = await checkJsonEndpoint(check);
      if (error) errors.push(error);
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : String(failure);
      errors.push(createRouteError(`${check.name} no responde`, `${check.url}: ${message}`, { endpoint: check.url }));
    }
  }

  for (const check of htmlChecks) {
    try {
      const error = await checkHtmlEndpoint(check);
      if (error) errors.push(error);
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : String(failure);
      errors.push(createRouteError(`${check.name} no responde`, `${check.url}: ${message}`, { endpoint: check.url }));
    }
  }

  return errors;
}
