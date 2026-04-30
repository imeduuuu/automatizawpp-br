import { CallResult, Lead, LeadStatus, SubscriptionPlan } from '@prisma/client';
import { prisma } from '@/lib/db';

export type LeadEvent =
  | { type: 'CALL_INITIATED' }
  | { type: 'CALL_RESULT'; result: CallResult; duration?: number; notes?: string }
  | { type: 'EMAIL_SENT'; template: string }
  | { type: 'EMAIL_OPENED'; template: string }
  | { type: 'PAYMENT_CONFIRMED'; stripeId: string; plan: SubscriptionPlan; mrr: number; renewsAt: Date }
  | { type: 'HUMAN_ESCALATION' }
  | { type: 'MARK_COLD' };

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const LEAD_STATUS = {
  CALL_SCHEDULED: 'CALL_SCHEDULED',
  CALL_ATTEMPTED: 'CALL_ATTEMPTED',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  FOLLOW_UP: 'FOLLOW_UP',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST',
  COLD: 'COLD'
} as const satisfies Record<string, LeadStatus>;

function nowPlus(ms: number) {
  return new Date(Date.now() + ms);
}

export async function transitionLead(leadId: string, event: LeadEvent): Promise<Lead> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    throw new Error('Lead not found');
  }

  switch (event.type) {
    case 'CALL_INITIATED':
      return prisma.lead.update({
        where: { id: leadId },
        data: {
          status: LEAD_STATUS.CALL_SCHEDULED
        }
      });

    case 'CALL_RESULT':
      return prisma.$transaction(async (tx) => {
        const attemptsBefore = await tx.callAttempt.count({ where: { leadId } });
        const attemptNumber = attemptsBefore + 1;

        await tx.callAttempt.create({
          data: {
            leadId,
            attemptNumber,
            result: event.result,
            duration: event.duration,
            notes: event.notes
          }
        });

        if (event.result === 'QUALIFIED') {
          return tx.lead.update({
            where: { id: leadId },
            data: {
              status: LEAD_STATUS.QUALIFIED,
              nextActionAt: nowPlus(FIVE_MINUTES_MS),
              assignedTo: 'sara'
            }
          });
        }

        if (event.result === 'NO_ANSWER' || event.result === 'VOICEMAIL') {
          const nextStatus: LeadStatus = attemptNumber >= 3 ? LEAD_STATUS.COLD : LEAD_STATUS.CALL_ATTEMPTED;
          return tx.lead.update({
            where: { id: leadId },
            data: {
              status: nextStatus
            }
          });
        }

        if (event.result === 'NOT_INTERESTED') {
          return tx.lead.update({
            where: { id: leadId },
            data: {
              status: LEAD_STATUS.CLOSED_LOST
            }
          });
        }

        return tx.lead.update({
          where: { id: leadId },
          data: {
            status: LEAD_STATUS.CALL_ATTEMPTED
          }
        });
      });

    case 'EMAIL_SENT':
      return prisma.$transaction(async (tx) => {
        await tx.emailEvent.create({
          data: {
            leadId,
            type: 'SENT',
            emailTemplate: event.template
          }
        });

        return tx.lead.update({
          where: { id: leadId },
          data: {
            lastEmailAt: new Date()
          }
        });
      });

    case 'EMAIL_OPENED':
      return prisma.$transaction(async (tx) => {
        const currentLead = await tx.lead.findUnique({ where: { id: leadId } });
        if (!currentLead) {
          throw new Error('Lead not found');
        }

        await tx.emailEvent.create({
          data: {
            leadId,
            type: 'OPENED',
            emailTemplate: event.template
          }
        });

        if (currentLead.status === LEAD_STATUS.PROPOSAL_SENT) {
          return tx.lead.update({
            where: { id: leadId },
            data: {
              status: LEAD_STATUS.FOLLOW_UP,
              nextActionAt: nowPlus(TWENTY_FOUR_HOURS_MS)
            }
          });
        }

        return tx.lead.findUniqueOrThrow({ where: { id: leadId } });
      });

    case 'PAYMENT_CONFIRMED':
      return prisma.$transaction(async (tx) => {
        await tx.subscription.create({
          data: {
            leadId,
            stripeSubscriptionId: event.stripeId,
            plan: event.plan,
            status: 'ACTIVE',
            mrr: event.mrr,
            renewsAt: event.renewsAt
          }
        });

        return tx.lead.update({
          where: { id: leadId },
          data: {
            status: LEAD_STATUS.CLOSED_WON
          }
        });
      });

    case 'HUMAN_ESCALATION':
      return prisma.lead.update({
        where: { id: leadId },
        data: {
          assignedTo: 'human'
        }
      });

    case 'MARK_COLD':
      return prisma.lead.update({
        where: { id: leadId },
        data: {
          status: LEAD_STATUS.COLD
        }
      });
  }
}
