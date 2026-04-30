import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  SCALE_BUNDLE_SERVICES,
  SCALE_BUNDLE_SERVICE_SLUGS,
  WEBSITE_PLANS,
  WEBSITE_SERVICES,
  type ScaleBundleServiceSlug
} from '@/lib/services/registry';

export async function syncServiceCatalog() {
  const services = [...WEBSITE_SERVICES, ...SCALE_BUNDLE_SERVICES];
  await Promise.all(
    services.map((service) =>
      prisma.service.upsert({
        where: { slug: service.slug },
        update: {
          name: service.name,
          shortDescription: service.shortDescription,
          longDescription: service.longDescription,
          publicCategory: service.publicCategory,
          icon: service.icon,
          sortOrder: service.sortOrder,
          active: true
        },
        create: {
          slug: service.slug,
          name: service.name,
          shortDescription: service.shortDescription,
          longDescription: service.longDescription,
          publicCategory: service.publicCategory,
          icon: service.icon,
          sortOrder: service.sortOrder,
          active: true
        }
      })
    )
  );
}

export async function assignServicesToUser(userId: string, planSlug: (typeof WEBSITE_PLANS)[number]['slug'] = 'profesional') {
  await syncServiceCatalog();

  const selectedPlan = WEBSITE_PLANS.find((plan) => plan.slug === planSlug) ?? WEBSITE_PLANS[1];
  const services = await prisma.service.findMany({
    where: { slug: { in: [...selectedPlan.services] } },
    select: { id: true }
  });

  if (!services.length) {
    return;
  }

  const accessRows: Prisma.ClientServiceAccessCreateManyInput[] = services.map((service) => ({
    userId,
    serviceId: service.id,
    status: 'ACTIVE'
  }));

  await prisma.clientServiceAccess.createMany({
    data: accessRows,
    skipDuplicates: true
  });
}

export async function getUserServiceAccess(userId: string) {
  return prisma.clientServiceAccess.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      service: {
        active: true
      }
    },
    include: {
      service: true
    },
    orderBy: {
      service: {
        sortOrder: 'asc'
      }
    }
  });
}

export type ScaleBundleActivationResult = {
  userId: string;
  activatedSlugs: ScaleBundleServiceSlug[];
  alreadyActiveSlugs: ScaleBundleServiceSlug[];
};

export async function activateScaleBundleForUser(
  userId: string
): Promise<ScaleBundleActivationResult> {
  await syncServiceCatalog();

  const services = await prisma.service.findMany({
    where: { slug: { in: [...SCALE_BUNDLE_SERVICE_SLUGS] } },
    select: { id: true, slug: true }
  });

  if (services.length === 0) {
    return { userId, activatedSlugs: [], alreadyActiveSlugs: [] };
  }

  const existing = await prisma.clientServiceAccess.findMany({
    where: {
      userId,
      serviceId: { in: services.map((service) => service.id) }
    },
    select: { serviceId: true, status: true }
  });

  const existingByServiceId = new Map(existing.map((entry) => [entry.serviceId, entry.status] as const));

  const toCreate: Prisma.ClientServiceAccessCreateManyInput[] = [];
  const toReactivate: string[] = [];
  const alreadyActive: ScaleBundleServiceSlug[] = [];
  const activated: ScaleBundleServiceSlug[] = [];

  for (const service of services) {
    const status = existingByServiceId.get(service.id);
    if (!status) {
      toCreate.push({ userId, serviceId: service.id, status: 'ACTIVE' });
      activated.push(service.slug as ScaleBundleServiceSlug);
    } else if (status !== 'ACTIVE') {
      toReactivate.push(service.id);
      activated.push(service.slug as ScaleBundleServiceSlug);
    } else {
      alreadyActive.push(service.slug as ScaleBundleServiceSlug);
    }
  }

  if (toCreate.length > 0) {
    await prisma.clientServiceAccess.createMany({ data: toCreate, skipDuplicates: true });
  }

  if (toReactivate.length > 0) {
    await prisma.clientServiceAccess.updateMany({
      where: { userId, serviceId: { in: toReactivate } },
      data: { status: 'ACTIVE' }
    });
  }

  return { userId, activatedSlugs: activated, alreadyActiveSlugs: alreadyActive };
}

export async function activateScaleBundleForEmail(
  email: string
): Promise<ScaleBundleActivationResult> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) {
    throw new Error('Email requerido para activar el bundle Scale.');
  }

  const user = await prisma.user.findUnique({
    where: { email: trimmed },
    select: { id: true }
  });

  if (!user) {
    throw new Error(`No se encontro usuario para el email ${trimmed}.`);
  }

  return activateScaleBundleForUser(user.id);
}

export async function getUserServiceBySlug(userId: string, slug: string) {
  return prisma.clientServiceAccess.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      service: {
        slug,
        active: true
      }
    },
    include: {
      service: true,
      resources: {
        orderBy: { createdAt: 'desc' },
        take: 8
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 12
      }
    }
  });
}
