import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { logServiceAccess } from '@/lib/services/activity';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const access = await prisma.clientServiceAccess.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        service: {
          slug,
          active: true
        }
      },
      include: {
        service: true
      }
    });

    if (!access) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const [resources, activities] = await Promise.all([
      prisma.serviceResource.findMany({
        where: {
          serviceId: access.serviceId,
          isClientVisible: true,
          OR: [{ accessId: null }, { accessId: access.id }]
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          resourceType: true,
          url: true,
          content: true,
          createdAt: true
        }
      }),
      prisma.serviceActivity.findMany({
        where: {
          userId: session.user.id,
          serviceId: access.serviceId,
          OR: [{ accessId: null }, { accessId: access.id }]
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          event: true,
          summary: true,
          createdAt: true
        }
      })
    ]);

    await logServiceAccess({
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      serviceId: access.serviceId,
      accessId: access.id,
      serviceSlug: access.service.slug
    });

    return NextResponse.json({
      service: {
        id: access.service.id,
        slug: access.service.slug,
        name: access.service.name,
        shortDescription: access.service.shortDescription,
        longDescription: access.service.longDescription,
        publicCategory: access.service.publicCategory,
        icon: access.service.icon,
        access: {
          id: access.id,
          status: access.status,
          assignedAt: access.assignedAt.toISOString(),
          startsAt: access.startsAt?.toISOString() ?? null,
          endsAt: access.endsAt?.toISOString() ?? null,
          notes: access.notes
        },
        resources: resources.map((resource) => ({
          ...resource,
          createdAt: resource.createdAt.toISOString()
        })),
        activities: activities.map((activity) => ({
          ...activity,
          createdAt: activity.createdAt.toISOString()
        }))
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
