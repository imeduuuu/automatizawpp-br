import { prisma } from '@/lib/db';
import { SCALE_BUNDLE_SERVICE_SLUGS, type ScaleBundleServiceSlug } from '@/lib/services/registry';
import { syncServiceCatalog } from '@/lib/services/catalog';
import type { BundleServiceAccess, ScaleBundleAccessStatus } from '@/lib/scale-bundle/types';

export class ScaleBundleError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ScaleBundleError';
    this.statusCode = statusCode;
  }
}

export async function getScaleBundleAccessState(userId: string): Promise<{
  status: ScaleBundleAccessStatus;
  activeServices: ScaleBundleServiceSlug[];
}> {
  await syncServiceCatalog();

  const [activeAccesses, latestScaleRequest] = await Promise.all([
    prisma.clientServiceAccess.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        service: {
          slug: { in: [...SCALE_BUNDLE_SERVICE_SLUGS] },
          active: true
        }
      },
      select: {
        service: {
          select: { slug: true }
        }
      }
    }),
    prisma.subscriptionRequest.findFirst({
      where: {
        userId,
        plan: 'SCALE'
      },
      orderBy: { createdAt: 'desc' },
      select: { status: true }
    })
  ]);

  const activeServices = activeAccesses.map((entry) => entry.service.slug as ScaleBundleServiceSlug);

  if (activeServices.length > 0) {
    return { status: 'active', activeServices };
  }

  const requestStatus = latestScaleRequest?.status?.trim().toUpperCase() ?? '';
  if (requestStatus && requestStatus !== 'REJECTED' && requestStatus !== 'CANCELLED') {
    return { status: 'pending_activation', activeServices };
  }

  return { status: 'upgrade_required', activeServices };
}

export async function requireScaleBundleService(params: {
  userId: string;
  workspaceId: string;
  serviceSlug: ScaleBundleServiceSlug;
}): Promise<BundleServiceAccess> {
  const { userId, workspaceId, serviceSlug } = params;

  await syncServiceCatalog();

  const access = await prisma.clientServiceAccess.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      service: {
        slug: serviceSlug,
        active: true
      }
    },
    select: {
      id: true,
      serviceId: true,
      service: {
        select: { slug: true }
      }
    }
  });

  if (access) {
    return {
      userId,
      workspaceId,
      accessId: access.id,
      serviceId: access.serviceId,
      serviceSlug: access.service.slug as ScaleBundleServiceSlug
    };
  }

  const state = await getScaleBundleAccessState(userId);
  if (state.status === 'pending_activation') {
    throw new ScaleBundleError('Tu bundle Scale esta pendiente de activacion.', 402);
  }

  throw new ScaleBundleError('Plan Scale requerido para usar estos agentes premium.', 403);
}
