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

export interface FixAction {
  type: 'n8n_retry' | 'n8n_toggle' | 'vapi_patch' | 'webhook_retry' | 'api_call' | 'none';
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  description: string;
}
