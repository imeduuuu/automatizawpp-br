import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function logServiceAccess(params: {
  userId: string;
  workspaceId: string;
  serviceId: string;
  accessId: string;
  serviceSlug: string;
}) {
  const { userId, workspaceId, serviceId, accessId, serviceSlug } = params;

  await Promise.all([
    prisma.serviceActivity.create({
      data: {
        userId,
        serviceId,
        accessId,
        event: 'SERVICE_VIEWED',
        summary: `El cliente accedio al servicio ${serviceSlug}`
      }
    }),
    logAuditEvent({
      event: 'SERVICE_ACCESSED',
      userId,
      workspaceId,
      metadata: { serviceSlug }
    })
  ]);
}
