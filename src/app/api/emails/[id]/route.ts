// /api/emails/[id]/route.ts — PATCH (read/deleted/folder) + DELETE
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

const patchSchema = z.object({
  read: z.boolean().optional(),
  deleted: z.boolean().optional(),
  folder: z.enum(['inbox', 'sent', 'important', 'spam', 'archive']).optional()
});

async function loadMessage(id: string) {
  return prisma.message.findUnique({ where: { id }, select: { id: true, metadata: true } });
}

function mergedMeta(current: unknown, patch: Record<string, unknown>) {
  const base = (current && typeof current === 'object' ? current : {}) as Record<string, unknown>;
  return { ...base, ...patch };
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await loadMessage(id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Mensagem não encontrada' }, { status: 404 });
  }

  const newMeta = mergedMeta(existing.metadata, parsed.data as Record<string, unknown>);
  await prisma.message.update({ where: { id }, data: { metadata: newMeta } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, erro: 'Não autorizado' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await loadMessage(id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Mensagem não encontrada' }, { status: 404 });
  }
  const newMeta = mergedMeta(existing.metadata, { deleted: true, deletedAt: new Date().toISOString() });
  await prisma.message.update({ where: { id }, data: { metadata: newMeta } });
  return NextResponse.json({ ok: true });
}
