import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';

const createContactSchema = z.object({
  workspaceId: z.string().min(1).optional(),
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional()
});

const updateContactSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(200, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '50', 10) || 50));
    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const skip = (page - 1) * limit;

    const where = {
      ...(workspaceId ? { workspaceId } : {}),
      ...(search ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
          { company: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {})
    };

    const [total, contacts] = await prisma.$transaction([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          company: true,
          status: true,
          lastContactAt: true,
          createdAt: true,
          updatedAt: true
        }
      })
    ]);

    return NextResponse.json({
      contacts: contacts.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        lastContactAt: c.lastContactAt?.toISOString() ?? null
      })),
      total,
      page,
      limit
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const workspaceId = await resolveWorkspaceId(parsed.data.workspaceId);
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
    }

    const contact = await prisma.lead.create({
      data: {
        workspaceId,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company: parsed.data.company,
        status: 'NEW'
      }
    });

    return NextResponse.json({
      contact: {
        ...contact,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
        lastContactAt: contact.lastContactAt?.toISOString() ?? null
      }
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
