import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accesses = await prisma.clientServiceAccess.findMany({
      where: {
        userId: session.user.id,
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

    const services = accesses.map((access) => ({
      id: access.id,
      status: access.status,
      assignedAt: access.assignedAt.toISOString(),
      startsAt: access.startsAt?.toISOString() ?? null,
      endsAt: access.endsAt?.toISOString() ?? null,
      notes: access.notes,
      service: {
        id: access.service.id,
        slug: access.service.slug,
        name: access.service.name,
        shortDescription: access.service.shortDescription,
        longDescription: access.service.longDescription,
        publicCategory: access.service.publicCategory,
        icon: access.service.icon
      }
    }));

    return NextResponse.json({ services, total: services.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
