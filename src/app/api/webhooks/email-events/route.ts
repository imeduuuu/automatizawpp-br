/**
 * POST /api/webhooks/email-events — Webhook para eventos de email (Brevo/Resend)
 *
 * Registra:
 * - Email opened
 * - Email clicked
 * - Email bounced
 *
 * Dispara automação se engagement detectado
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { triggerAutomation } from '@/lib/scoring/automation-rules';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Parse webhook da origem (Brevo/Resend)
    const { leadId, email, eventType, timestamp } = body;

    if (!leadId || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Encontra o lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Registra evento de email
    if (['OPENED', 'CLICKED', 'BOUNCED'].includes(eventType)) {
      await prisma.emailEvent.create({
        data: {
          leadId,
          type: eventType as any,
          emailTemplate: 'auto',
          createdAt: new Date(timestamp || Date.now())
        }
      });

      // Log de atividade
      await prisma.activityLog.create({
        data: {
          workspaceId: lead.workspaceId,
          leadId,
          type: 'MESSAGE_SENT',
          details: {
            channel: 'EMAIL',
            eventType,
            email
          }
        }
      });

      // Dispara automação se engagement
      if (['OPENED', 'CLICKED'].includes(eventType)) {
        await triggerAutomation({
          leadId,
          workspaceId: lead.workspaceId,
          triggerEvent: eventType === 'OPENED' ? 'EMAIL_OPENED' : 'EMAIL_CLICKED'
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email Events Webhook] Erro:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
