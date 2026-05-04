/**
 * Health Check Library
 * Monitor status of all system components
 */

export interface ComponentHealth {
  component: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  message?: string;
  responseTimeMs?: number;
}

export interface HealthStatus {
  timestamp: string;
  overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  components: ComponentHealth[];
}

let lastHealthStatus: HealthStatus | null = null;

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const { prisma } = await import('./db');
    await prisma.$queryRaw`SELECT 1`;
    return {
      component: 'Database',
      status: 'HEALTHY',
      responseTimeMs: Date.now() - start
    };
  } catch (error) {
    return {
      component: 'Database',
      status: 'UNHEALTHY',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - start
    };
  }
}

async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    return {
      component: 'Redis',
      status: 'HEALTHY',
      responseTimeMs: Date.now() - start
    };
  } catch (error) {
    return {
      component: 'Redis',
      status: 'DEGRADED',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - start
    };
  }
}

async function checkN8N(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const response = await fetch(
      `${process.env.N8N_URL}/api/v1/settings`,
      {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY || '',
        }
      }
    );
    return {
      component: 'n8n',
      status: response.ok ? 'HEALTHY' : 'DEGRADED',
      responseTimeMs: Date.now() - start
    };
  } catch (error) {
    return {
      component: 'n8n',
      status: 'DEGRADED',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - start
    };
  }
}

async function checkResend(): Promise<ComponentHealth> {
  const start = Date.now();
  const hasKey = !!process.env.RESEND_API_KEY;
  return {
    component: 'Resend',
    status: hasKey ? 'HEALTHY' : 'UNHEALTHY',
    message: hasKey ? undefined : 'RESEND_API_KEY not configured',
    responseTimeMs: Date.now() - start
  };
}

export async function runAllHealthChecks(): Promise<ComponentHealth[]> {
  const components = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkN8N(),
    checkResend()
  ]);

  const overall = components.every(c => c.status === 'HEALTHY')
    ? 'HEALTHY'
    : components.some(c => c.status === 'UNHEALTHY')
    ? 'UNHEALTHY'
    : 'DEGRADED';

  lastHealthStatus = {
    timestamp: new Date().toISOString(),
    overall,
    components
  };

  return components;
}

export async function getHealthStatus(): Promise<HealthStatus> {
  if (!lastHealthStatus) {
    await runAllHealthChecks();
  }
  return lastHealthStatus!;
}
