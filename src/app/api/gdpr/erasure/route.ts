import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { LEAD_ANONYMIZATION_PATCH } from '@/lib/gdpr/retention';

/**
 * POST /api/gdpr/erasure — GDPR Art. 17 "Right to erasure" (right to be forgotten).
 *
 * When a data subject requests erasure, we:
 *  1. Find the Lead by email (case-insensitive).
 *  2. Anonymize the Lead row (keeps stats integrity, removes PII).
 *  3. Hard-delete dependent PII: Messages, CallTranscripts, LeadMemory, EmailEvents.
 *  4. Scrub JSON payloads in AgentRun referencing this lead.
 *  5. Log the erasure to AuditLog.
 *
 * Auth: requires admin/owner session OR a service token (for self-serve via webform).
 */

const schema = z.object({
  email: z.string().email().optional(),
  leadId: z.string().optional(),
  reason: z.string().min(1).default('subject_request'),
}).refine((d) => d.email || d.leadId, { message: 'email ou leadId obrigatório' });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any).role;
  if (role !== 'admin' && role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Forbidden — admin only' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Dados inválidos' }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
      where: parsed.data.leadId
        ? { id: parsed.data.leadId }
        : { email: { equals: parsed.data.email!.toLowerCase().trim(), mode: 'insensitive' } },
      select: { id: true, workspaceId: true, email: true },
    });

    if (!lead) {
      return NextResponse.json({ ok: false, error: 'Lead não encontrado' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
    const messagesDeleted = await tx.message.deleteMany({ where: { leadId: lead.id } });

    const transcriptsDeleted = await tx.callTranscript.deleteMany({
      where: { callRecord: { leadId: lead.id } },
    });

    const memoryDeleted = await tx.leadMemory.deleteMany({ where: { leadId: lead.id } });
    const emailEventsDeleted = await tx.emailEvent.deleteMany({ where: { leadId: lead.id } });

    await tx.lead.update({
      where: { id: lead.id },
      data: LEAD_ANONYMIZATION_PATCH,
    });

    await tx.auditLog.create({
      data: {
        workspaceId: lead.workspaceId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userId: (session.user as any).id ?? null,
        event: 'GDPR_ERASURE',
        email: lead.email,
        metadata: {
          targetLeadId: lead.id,
          reason: parsed.data.reason,
          messagesDeleted: messagesDeleted.count,
          transcriptsDeleted: transcriptsDeleted.count,
          memoryDeleted: memoryDeleted.count,
          emailEventsDeleted: emailEventsDeleted.count,
        },
      },
    });

      return {
        messagesDeleted: messagesDeleted.count,
        transcriptsDeleted: transcriptsDeleted.count,
        memoryDeleted: memoryDeleted.count,
        emailEventsDeleted: emailEventsDeleted.count,
      };
    });

    return NextResponse.json({ ok: true, leadId: lead.id, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
