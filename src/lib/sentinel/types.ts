export interface ScanResult {
  source: string;
  errors: DetectedError[];
  scannedAt: Date;
  duration: number;
}

export interface DetectedError {
  source: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  rawError: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface DiagnosisResult {
  diagnosis: string;
  suggestedFix: string;
  canAutoFix: boolean;
  fixAction?: FixAction;
}

export type FixActionType =
  // HTTP-based (legacy)
  | 'n8n_retry'
  | 'n8n_toggle'
  | 'vapi_patch'
  | 'webhook_retry'
  | 'api_call'
  // Infra-based (Option B — safe local ops)
  | 'pm2_restart'
  | 'rebuild_and_restart'
  | 'clear_old_logs'
  | 'db_reconnect'
  | 'cache_flush'
  | 'none';

export interface FixAction {
  type: FixActionType;
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  description: string;
  // Parámetros opcionales para acciones de infraestructura
  processName?: string;       // pm2_restart → nombre del proceso PM2
  logsPath?: string;          // clear_old_logs → ruta de logs (default /root/.pm2/logs)
  retentionDays?: number;     // clear_old_logs → días de retención (default 7)
}
