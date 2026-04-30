import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

type AuditPayload = {
  event: string;
  userId?: string | null;
  workspaceId?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logAuditEvent({ event, userId, workspaceId, email, metadata }: AuditPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        event,
        userId: userId ?? undefined,
        workspaceId: workspaceId ?? undefined,
        email: email ?? undefined,
        metadata: (metadata as Prisma.InputJsonValue | null | undefined) ?? undefined
      }
    });
  } catch (error) {
    console.error('[audit] unable to store event', event, error);
  }
}
