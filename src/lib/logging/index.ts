/**
 * Logging system para Phase 5D - Monitoring & Observability
 * Registra eventos no banco de dados e console para tracking completo do sistema
 */

import { prisma } from '@/lib/db';
import { EventSeverity, EventSource } from '@prisma/client';

export interface LogContext {
  workspaceId?: string;
  userId?: string;
  leadId?: string;
  metadata?: Record<string, any>;
}

export interface LogPayload {
  eventType: string;
  title: string;
  description?: string;
  source?: EventSource;
  severity?: EventSeverity;
  context?: LogContext;
}

/**
 * Log um evento no sistema
 * Escreve simultaneamente em database e console
 */
export async function logEvent(payload: LogPayload): Promise<void> {
  const {
    eventType,
    title,
    description,
    source = 'SYSTEM',
    severity = 'INFO',
    context = {}
  } = payload;

  try {
    // Criar evento no banco
    await prisma.event.create({
      data: {
        eventType,
        title,
        description,
        source: source as EventSource,
        severity: severity as EventSeverity,
        workspaceId: context.workspaceId,
        userId: context.userId,
        leadId: context.leadId,
        metadata: context.metadata
      }
    });

    // Log para console com timestamp e severity
    const timestamp = new Date().toISOString();
    const icon = getSeverityIcon(severity);
    console.log(
      `${icon} [${timestamp}] ${eventType}: ${title}`,
      description ? `\n  ${description}` : ''
    );
  } catch (error) {
    // Fallback: log apenas no console se database falhar
    console.error(`Failed to log event: ${eventType}`, error);
    console.log(`[FALLBACK] ${title}:`, description || '');
  }
}

/**
 * Log de erro com contexto
 */
export async function logError(payload: LogPayload & { error: Error }): Promise<void> {
  const { error, ...rest } = payload;
  await logEvent({
    ...rest,
    severity: 'ERROR',
    source: 'SYSTEM',
    description: `${rest.description || ''}\n${error.message}`.trim(),
    context: {
      ...rest.context,
      metadata: {
        ...rest.context?.metadata,
        errorStack: error.stack
      }
    }
  });
}

/**
 * Query interface para buscar eventos
 */
export async function queryEvents(filters: {
  workspaceId?: string;
  eventType?: string;
  severity?: EventSeverity;
  userId?: string;
  leadId?: string;
  source?: EventSource;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}) {
  const {
    workspaceId,
    eventType,
    severity,
    userId,
    leadId,
    source,
    startDate,
    endDate,
    limit = 50,
    skip = 0
  } = filters;

  const where = {
    ...(workspaceId && { workspaceId }),
    ...(eventType && { eventType }),
    ...(severity && { severity }),
    ...(userId && { userId }),
    ...(leadId && { leadId }),
    ...(source && { source }),
    ...(startDate || endDate) && {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate })
      }
    }
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      select: {
        id: true,
        eventType: true,
        title: true,
        description: true,
        source: true,
        severity: true,
        createdAt: true,
        workspaceId: true,
        userId: true,
        leadId: true,
        metadata: true
      }
    }),
    prisma.event.count({ where })
  ]);

  return {
    events,
    total,
    limit,
    skip,
    pages: Math.ceil(total / limit)
  };
}

/**
 * Agregações de eventos por tipo, fonte ou severidade
 */
export async function getEventStats(workspaceId: string) {
  const [byType, bySeverity, bySource, recentErrors] = await Promise.all([
    prisma.event.groupBy({
      by: ['eventType'],
      where: { workspaceId },
      _count: true,
      orderBy: { _count: { eventType: 'desc' } },
      take: 10
    }),
    prisma.event.groupBy({
      by: ['severity'],
      where: { workspaceId },
      _count: true
    }),
    prisma.event.groupBy({
      by: ['source'],
      where: { workspaceId },
      _count: true
    }),
    prisma.event.findMany({
      where: {
        workspaceId,
        severity: { in: ['ERROR', 'CRITICAL'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        eventType: true,
        title: true,
        description: true,
        severity: true,
        createdAt: true
      }
    })
  ]);

  return {
    byType,
    bySeverity,
    bySource,
    recentErrors
  };
}

function getSeverityIcon(severity: EventSeverity): string {
  const icons: Record<EventSeverity, string> = {
    INFO: 'ℹ️',
    WARNING: '⚠️',
    ERROR: '❌',
    CRITICAL: '🚨'
  };
  return icons[severity] || '📝';
}

// Re-export types
export type { Event, EventSeverity, EventSource } from '@prisma/client';
