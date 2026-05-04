/**
 * Health checks para Phase 5D - Monitoring & Observability
 * Verifica status de componentes críticos do sistema
 */

import { prisma } from '@/lib/db';
import { HealthStatus } from '@prisma/client';

export interface HealthCheckResult {
  component: string;
  status: HealthStatus;
  responseTimeMs: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Verificar saúde do banco de dados
 */
export async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    return {
      component: 'database',
      status: 'HEALTHY',
      responseTimeMs: responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      component: 'database',
      status: 'UNHEALTHY',
      responseTimeMs: responseTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verificar disponibilidade de serviço de email (Resend)
 */
export async function checkEmailService(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    const responseTime = Date.now() - start;

    if (!response.ok) {
      return {
        component: 'resend_email',
        status: 'UNHEALTHY',
        responseTimeMs: responseTime,
        errorMessage: `API returned ${response.status}`
      };
    }

    return {
      component: 'resend_email',
      status: 'HEALTHY',
      responseTimeMs: responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      component: 'resend_email',
      status: 'UNHEALTHY',
      responseTimeMs: responseTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verificar webhook n8n
 */
export async function checkN8nWebhook(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('N8N_WEBHOOK_URL não configurada');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(webhookUrl, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const responseTime = Date.now() - start;

    // n8n retorna 405 para GET, que é esperado
    if (response.status === 405 || response.ok) {
      return {
        component: 'n8n_webhook',
        status: 'HEALTHY',
        responseTimeMs: responseTime
      };
    }

    return {
      component: 'n8n_webhook',
      status: response.status >= 500 ? 'UNHEALTHY' : 'DEGRADED',
      responseTimeMs: responseTime,
      errorMessage: `HTTP ${response.status}`
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      component: 'n8n_webhook',
      status: 'UNHEALTHY',
      responseTimeMs: responseTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verificar disponibilidade de serviço de chamadas (Vapi)
 */
export async function checkCallService(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const apiKey = process.env.VAPI_API_KEY;
    if (!apiKey) {
      throw new Error('VAPI_API_KEY não configurada');
    }

    const response = await fetch('https://api.vapi.ai/call', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    const responseTime = Date.now() - start;

    if (response.status === 401 || response.status === 403) {
      return {
        component: 'vapi_calls',
        status: 'UNHEALTHY',
        responseTimeMs: responseTime,
        errorMessage: 'Authentication failed'
      };
    }

    if (!response.ok && response.status >= 500) {
      return {
        component: 'vapi_calls',
        status: 'UNHEALTHY',
        responseTimeMs: responseTime,
        errorMessage: `API returned ${response.status}`
      };
    }

    return {
      component: 'vapi_calls',
      status: 'HEALTHY',
      responseTimeMs: responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      component: 'vapi_calls',
      status: 'UNHEALTHY',
      responseTimeMs: responseTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Executar todos os health checks e armazenar resultados
 */
export async function runAllHealthChecks() {
  const results = await Promise.all([
    checkDatabase(),
    checkEmailService(),
    checkN8nWebhook(),
    checkCallService()
  ]);

  // Armazenar resultados no banco
  for (const result of results) {
    await updateHealthCheck(result);
  }

  return results;
}

/**
 * Atualizar ou criar registro de health check no banco
 */
export async function updateHealthCheck(result: HealthCheckResult) {
  try {
    await prisma.healthCheck.upsert({
      where: { component: result.component },
      create: {
        component: result.component,
        status: result.status,
        responseTimeMs: result.responseTimeMs,
        errorMessage: result.errorMessage,
        metadata: result.metadata,
        lastCheckedAt: new Date(),
        ...(result.status === 'UNHEALTHY' && { lastErrorAt: new Date() })
      },
      update: {
        status: result.status,
        responseTimeMs: result.responseTimeMs,
        errorMessage: result.errorMessage,
        metadata: result.metadata,
        lastCheckedAt: new Date(),
        ...(result.status === 'UNHEALTHY' && { lastErrorAt: new Date() })
      }
    });
  } catch (error) {
    console.error(`Failed to update health check for ${result.component}:`, error);
  }
}

/**
 * Obter status atual de todos os componentes
 */
export async function getHealthStatus() {
  const checks = await prisma.healthCheck.findMany({
    orderBy: { lastCheckedAt: 'desc' }
  });

  const healthy = checks.filter(c => c.status === 'HEALTHY').length;
  const degraded = checks.filter(c => c.status === 'DEGRADED').length;
  const unhealthy = checks.filter(c => c.status === 'UNHEALTHY').length;

  const overallStatus: HealthStatus =
    unhealthy > 0 ? 'UNHEALTHY' : degraded > 0 ? 'DEGRADED' : 'HEALTHY';

  return {
    overallStatus,
    components: checks,
    summary: { healthy, degraded, unhealthy }
  };
}
