import { addHours } from 'date-fns';
import { Prisma } from '@prisma/client';
import { ChannelType, FollowUpStatus } from '@prisma/client';
import { prisma } from '@/lib/db';

export type SequenceDecisionInput = {
  leadId: string;
  intentLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  stalledHours: number;
  optedOut: boolean;
};

export function getFollowUpDelayHours(input: SequenceDecisionInput) {
  if (input.optedOut) return null;
  if (input.intentLevel === 'HIGH' && input.urgencyLevel === 'HIGH') return 6;
  if (input.intentLevel === 'HIGH') return 12;
  if (input.stalledHours > 72) return 24;
  return 48;
}

export async function scheduleFollowUp(
  input: SequenceDecisionInput,
  channel: ChannelType,
  reason: string,
  payload: Record<string, unknown>
) {
  const delayHours = getFollowUpDelayHours(input);
  if (!delayHours) {
    return null;
  }

  return prisma.followUpTask.create({
    data: {
      leadId: input.leadId,
      channel,
      reason,
      status: FollowUpStatus.QUEUED,
      scheduledFor: addHours(new Date(), delayHours),
      payload: payload as Prisma.InputJsonValue
    }
  });
}

export async function fetchDueFollowUps(limit = 50) {
  return prisma.followUpTask.findMany({
    where: {
      status: FollowUpStatus.QUEUED,
      scheduledFor: { lte: new Date() }
    },
    orderBy: { scheduledFor: 'asc' },
    take: limit
  });
}
