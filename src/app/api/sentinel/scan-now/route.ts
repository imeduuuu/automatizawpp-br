import { runFullScan } from '@/lib/sentinel/orchestrator';
import { sentinelJson, sentinelOptions } from '@/lib/sentinel/http';

export async function POST() {
  try {
    const result = await runFullScan();
    return sentinelJson({ status: 'completed', ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return sentinelJson({ status: 'error', message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}

export async function OPTIONS() {
  return sentinelOptions();
}
