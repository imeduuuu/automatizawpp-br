import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { FixAction } from '@/lib/sentinel/types';
import { prisma } from '@/lib/db';

const execAsync = promisify(exec);

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

const SHELL_TIMEOUT_MS = 180_000; // 3 min para builds
const DEFAULT_LOG_RETENTION_DAYS = 7;
const DEFAULT_PM2_LOGS_PATH = '/root/.pm2/logs';

// Whitelist defensiva — solo se permiten estos nombres de proceso para evitar abuso
const ALLOWED_PROCESS_NAMES = new Set(['automatizawpp']);

async function safeExec(command: string, timeoutMs = SHELL_TIMEOUT_MS): Promise<FixResult> {
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 });
    return {
      success: true,
      message: `OK — ${stdout.trim().slice(0, 300) || stderr.trim().slice(0, 300) || 'sin output'}`,
      responseBody: { stdout: stdout.trim(), stderr: stderr.trim() }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Shell error: ${message.slice(0, 300)}` };
  }
}

async function fixPm2Restart(action: FixAction): Promise<FixResult> {
  const processName = action.processName?.trim() || 'automatizawpp';
  if (!ALLOWED_PROCESS_NAMES.has(processName)) {
    return { success: false, message: `Proceso "${processName}" no está en la whitelist de auto-fix` };
  }
  return safeExec(`pm2 restart ${processName} --update-env`, 30_000);
}

async function fixRebuildAndRestart(action: FixAction): Promise<FixResult> {
  const processName = action.processName?.trim() || 'automatizawpp';
  if (!ALLOWED_PROCESS_NAMES.has(processName)) {
    return { success: false, message: `Proceso "${processName}" no está en la whitelist de auto-fix` };
  }
  // Build + restart en secuencia. Si build falla, NO reinicia (evita downtime con build roto)
  return safeExec(
    `cd /opt/automatizawpp && npm run build && pm2 restart ${processName} --update-env`,
    SHELL_TIMEOUT_MS
  );
}

async function fixClearOldLogs(action: FixAction): Promise<FixResult> {
  const logsPath = action.logsPath?.trim() || DEFAULT_PM2_LOGS_PATH;
  const days = Math.max(1, Math.min(90, action.retentionDays ?? DEFAULT_LOG_RETENTION_DAYS));
  // Whitelist de rutas permitidas — defensivo contra rm -rf accidental
  const allowedPaths = ['/root/.pm2/logs', '/var/log/automatizawpp-followups.log', '/opt/automatizawpp/logs'];
  if (!allowedPaths.some((allowed) => logsPath.startsWith(allowed))) {
    return { success: false, message: `Path "${logsPath}" no está en la whitelist` };
  }
  return safeExec(
    `find ${logsPath} -type f -name "*.log" -mtime +${days} -delete -print | wc -l`,
    30_000
  );
}

async function fixDbReconnect(): Promise<FixResult> {
  try {
    await prisma.$disconnect();
    // Próxima query reconecta automáticamente
    await prisma.$queryRaw`SELECT 1`;
    return { success: true, message: 'Prisma reconectado correctamente (SELECT 1 OK)' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Reconexión Prisma falló: ${message.slice(0, 300)}` };
  }
}

async function fixCacheFlush(): Promise<FixResult> {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return { success: false, message: 'REDIS_URL no configurada' };
  }
  // Usa redis-cli vía shell para evitar añadir dependencia extra al runtime
  // Soporta URLs `redis://host:port` y `redis://user:pass@host:port`
  return safeExec(`redis-cli -u "${redisUrl}" FLUSHDB`, 15_000);
}

export async function executeAutoFix(action: FixAction): Promise<FixResult> {
  const n8nUrl = process.env.N8N_URL?.trim() || 'http://localhost:5678';
  const vapiKey = process.env.VAPI_API_KEY?.trim() || '';

  try {
    // Acciones de infraestructura — Opción B (Sentinel auto-fix extendido)
    switch (action.type) {
      case 'pm2_restart':
        return fixPm2Restart(action);
      case 'rebuild_and_restart':
        return fixRebuildAndRestart(action);
      case 'clear_old_logs':
        return fixClearOldLogs(action);
      case 'db_reconnect':
        return fixDbReconnect();
      case 'cache_flush':
        return fixCacheFlush();
      case 'none':
        return { success: false, message: 'Acción none — sin fix automático' };
    }

    // Acciones HTTP (legacy)
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
