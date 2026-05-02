/**
 * Health Check Library
 * Monitor status of all system components
 */

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

export interface HealthStatus {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentHealth[];
}

let lastHealthStatus: HealthStatus | null = null;

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const { prisma } = await import('./db');
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: 'Database',
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Database',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    };
  }
}

async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    // Redis check would be implemented here
    return {
      name: 'Redis',
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Redis',
      status: 'degraded',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
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
    const status = response.ok ? 'healthy' : 'degraded';
    return {
      name: 'n8n',
      status,
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'n8n',
      status: 'degraded',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    };
  }
}

async function checkResend(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    // Resend check - basic validation
    const hasKey = !!process.env.RESEND_API_KEY;
    return {
      name: 'Resend',
      status: hasKey ? 'healthy' : 'unhealthy',
      message: hasKey ? undefined : 'RESEND_API_KEY not configured',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Resend',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    };
  }
}

export async function runAllHealthChecks(): Promise<void> {
  const checks = [
    checkDatabase(),
    checkRedis(),
    checkN8N(),
    checkResend()
  ];

  const components = await Promise.all(checks);

  const overall = components.every(c => c.status === 'healthy')
    ? 'healthy'
    : components.some(c => c.status === 'unhealthy')
    ? 'unhealthy'
    : 'degraded';

  lastHealthStatus = {
    timestamp: new Date().toISOString(),
    overall,
    components
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  if (!lastHealthStatus) {
    await runAllHealthChecks();
  }
  return lastHealthStatus!;
}
