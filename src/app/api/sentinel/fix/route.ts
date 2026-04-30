import { prisma } from '@/lib/db';
import { diagnoseError } from '@/lib/sentinel/diagnoser';
import { executeAutoFix } from '@/lib/sentinel/fixer';
import { sentinelJson, sentinelOptions } from '@/lib/sentinel/http';
import { scanPanelRoutes } from '@/lib/sentinel/scanner-panel';
import { scanVapi } from '@/lib/sentinel/scanner-vapi';
import type { DetectedError } from '@/lib/sentinel/types';

async function resolveIfTransient(existing: {
  id: string;
  source: string;
  title: string;
  rawError: string;
  sourceId: string | null;
}) {
  const normalizedTitle = `${existing.title} ${existing.rawError}`.toLowerCase();

  if (existing.source === 'vapi' && (normalizedTitle.includes('timeout') || normalizedTitle.includes('aborted') || normalizedTitle.includes('vapi api no responde') || normalizedTitle.includes('conectando a vapi'))) {
    const currentErrors = await scanVapi();
    const stillFailing = currentErrors.some((error) => {
      const sameSourceId = existing.sourceId && error.sourceId && error.sourceId === existing.sourceId;
      const sameConnectivity = error.source === 'vapi' && (error.title.toLowerCase().includes('vapi api no responde') || error.title.toLowerCase().includes('conectando a vapi'));
      return Boolean(sameSourceId || sameConnectivity);
    });

    if (!stillFailing) {
      await prisma.sentinelError.update({
        where: { id: existing.id },
        data: {
          autoFixed: true,
          resolved: true,
          resolvedAt: new Date(),
          fixResult: 'success',
          fixApplied: `${existing.rawError}\n\nResultado: Sentinel revalidou o Vapi e o timeout não se reproduz mais.`
        }
      });

      return sentinelJson({
        status: 'fixed',
        errorId: existing.id,
        diagnosis: 'O incidente era transitório e não se reproduz mais ao revalidar o Vapi.',
        suggestedFix: 'Fechado automaticamente após revalidação em tempo real.',
        fixResult: {
          success: true,
          message: 'Incidente transitório resolvido automaticamente após revalidação do Vapi.'
        }
      });
    }
  }

  if (existing.source === 'panel' && (normalizedTitle.includes('login') || normalizedTitle.includes('forgot-password') || normalizedTitle.includes('api'))) {
    const currentErrors = await scanPanelRoutes();
    const stillFailing = currentErrors.some((error) => error.title === existing.title);

    if (!stillFailing) {
      await prisma.sentinelError.update({
        where: { id: existing.id },
        data: {
          autoFixed: true,
          resolved: true,
          resolvedAt: new Date(),
          fixResult: 'success',
          fixApplied: `${existing.rawError}\n\nResultado: Sentinel revalidou as rotas do painel e o problema não se reproduz mais.`
        }
      });

      return sentinelJson({
        status: 'fixed',
        errorId: existing.id,
        diagnosis: 'O incidente do painel era transitório ou já estava corrigido em produção.',
        suggestedFix: 'Fechado automaticamente após revalidação de rotas críticas.',
        fixResult: {
          success: true,
          message: 'Incidente de painel resolvido automaticamente após revalidação.'
        }
      });
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { errorId?: string };
    const errorId = body.errorId?.trim();

    if (!errorId) {
      return sentinelJson({ error: 'errorId is required' }, { status: 400 });
    }

    const existing = await prisma.sentinelError.findUnique({ where: { id: errorId } });
    if (!existing) {
      return sentinelJson({ error: 'Sentinel error not found' }, { status: 404 });
    }

    const transientResolution = await resolveIfTransient(existing);
    if (transientResolution) {
      return transientResolution;
    }

    const detected: DetectedError = {
      source: existing.source,
      severity: existing.severity as DetectedError['severity'],
      title: existing.title,
      rawError: existing.rawError,
      sourceId: existing.sourceId ?? undefined,
      metadata: (existing.metadata as Record<string, unknown> | null) ?? undefined
    };

    const diagnosis = await diagnoseError(detected);

    await prisma.sentinelError.update({
      where: { id: existing.id },
      data: {
        diagnosis: diagnosis.diagnosis,
        fixApplied: diagnosis.suggestedFix,
        fixResult: diagnosis.canAutoFix ? 'pending' : 'manual_needed'
      }
    });

    if (!diagnosis.canAutoFix || !diagnosis.fixAction || diagnosis.fixAction.type === 'none') {
      return sentinelJson({
        status: 'manual_needed',
        errorId: existing.id,
        diagnosis: diagnosis.diagnosis,
        suggestedFix: diagnosis.suggestedFix
      });
    }

    const result = await executeAutoFix(diagnosis.fixAction);

    await prisma.sentinelError.update({
      where: { id: existing.id },
      data: {
        autoFixed: result.success,
        resolved: result.success,
        resolvedAt: result.success ? new Date() : null,
        fixResult: result.success ? 'success' : 'failed',
        fixApplied: `${diagnosis.suggestedFix}\n\nResultado: ${result.message}`
      }
    });

    return sentinelJson({
      status: result.success ? 'fixed' : 'failed',
      errorId: existing.id,
      diagnosis: diagnosis.diagnosis,
      suggestedFix: diagnosis.suggestedFix,
      fixResult: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sentinelJson({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return sentinelOptions();
}
