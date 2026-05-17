import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { statfs } from 'node:fs/promises';
import { DetectedError } from '@/lib/sentinel/types';
import { prisma } from '@/lib/db';

const execAsync = promisify(exec);

const DISK_FREE_PCT_THRESHOLD = 10;   // alerta si <10% libre
const MEMORY_FREE_PCT_THRESHOLD = 5;  // alerta si <5% libre
const PM2_PROCESS = 'automatizawpp';

async function checkDiskSpace(): Promise<DetectedError | null> {
  try {
    const stats = await statfs('/opt/automatizawpp');
    const freePct = (stats.bavail / stats.blocks) * 100;
    if (freePct < DISK_FREE_PCT_THRESHOLD) {
      return {
        source: 'infra',
        severity: 'critical',
        title: `Disco casi lleno: ${freePct.toFixed(1)}% libre`,
        rawError: `Filesystem en /opt/automatizawpp tiene solo ${freePct.toFixed(1)}% de espacio libre (${stats.bavail} blocks libres de ${stats.blocks}). Threshold: ${DISK_FREE_PCT_THRESHOLD}%.`,
        sourceId: 'disk_space',
        metadata: { freePct, totalBlocks: Number(stats.blocks), freeBlocks: Number(stats.bavail) }
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function checkPm2Status(): Promise<DetectedError | null> {
  try {
    const { stdout } = await execAsync('pm2 jlist', { timeout: 10_000 });
    const processes = JSON.parse(stdout) as Array<{
      name: string;
      pm2_env: { status: string; restart_time: number; unstable_restarts: number };
      monit: { memory: number; cpu: number };
    }>;
    const proc = processes.find((p) => p.name === PM2_PROCESS);
    if (!proc) {
      return {
        source: 'infra',
        severity: 'critical',
        title: `Proceso PM2 "${PM2_PROCESS}" no encontrado`,
        rawError: `pm2 jlist no devolvió el proceso ${PM2_PROCESS}. Procesos: ${processes.map((p) => p.name).join(', ') || 'ninguno'}`,
        sourceId: 'pm2_missing'
      };
    }
    if (proc.pm2_env.status !== 'online') {
      return {
        source: 'infra',
        severity: 'critical',
        title: `Proceso PM2 "${PM2_PROCESS}" en estado ${proc.pm2_env.status}`,
        rawError: `PM2 reporta status="${proc.pm2_env.status}" para ${PM2_PROCESS}. Restarts: ${proc.pm2_env.restart_time}. Unstable: ${proc.pm2_env.unstable_restarts}`,
        sourceId: 'pm2_offline',
        metadata: { status: proc.pm2_env.status, restarts: proc.pm2_env.restart_time }
      };
    }
    if (proc.pm2_env.unstable_restarts > 5) {
      return {
        source: 'infra',
        severity: 'warning',
        title: `Proceso PM2 "${PM2_PROCESS}" con reinicios inestables`,
        rawError: `${proc.pm2_env.unstable_restarts} unstable_restarts detectados (>5). El proceso podría estar fallando al arrancar.`,
        sourceId: 'pm2_unstable',
        metadata: { unstableRestarts: proc.pm2_env.unstable_restarts }
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function checkMemory(): Promise<DetectedError | null> {
  try {
    const { stdout } = await execAsync('free -m', { timeout: 5_000 });
    const lines = stdout.split('\n');
    const memLine = lines.find((l) => l.startsWith('Mem:'));
    if (!memLine) return null;
    const parts = memLine.split(/\s+/);
    const total = parseInt(parts[1] ?? '0', 10);
    const available = parseInt(parts[6] ?? '0', 10);
    if (total === 0) return null;
    const freePct = (available / total) * 100;
    if (freePct < MEMORY_FREE_PCT_THRESHOLD) {
      return {
        source: 'infra',
        severity: 'critical',
        title: `Memoria RAM casi llena: ${freePct.toFixed(1)}% disponible`,
        rawError: `Memoria disponible: ${available}MB de ${total}MB totales (${freePct.toFixed(1)}%). Threshold: ${MEMORY_FREE_PCT_THRESHOLD}%.`,
        sourceId: 'memory_low',
        metadata: { availableMB: available, totalMB: total, freePct }
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function checkDbConnectivity(): Promise<DetectedError | null> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      source: 'infra',
      severity: 'critical',
      title: 'Base de datos no responde',
      rawError: `Prisma SELECT 1 falló: ${message.slice(0, 400)}`,
      sourceId: 'db_unreachable',
      metadata: { error: message }
    };
  }
}

export async function scanInfra(): Promise<DetectedError[]> {
  const results = await Promise.all([
    checkDiskSpace(),
    checkPm2Status(),
    checkMemory(),
    checkDbConnectivity()
  ]);
  return results.filter((e): e is DetectedError => e !== null);
}
