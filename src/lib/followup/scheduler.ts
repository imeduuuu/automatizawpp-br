import { prisma } from '@/lib/db';
import { FollowUpTask } from '@prisma/client';

type LeadTemperature = 'HOT' | 'WARM' | 'COLD';

const FOLLOW_UP_DELAYS: Record<LeadTemperature, number[]> = {
  HOT: [6 * 60 * 60 * 1000, 18 * 60 * 60 * 1000, 36 * 60 * 60 * 1000],
  WARM: [24 * 60 * 60 * 1000, 48 * 60 * 60 * 1000, 96 * 60 * 60 * 1000],
  COLD: [72 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000, 14 * 24 * 60 * 60 * 1000],
};

export async function scheduleFollowUp(
  leadId: string,
  temperature: LeadTemperature = 'WARM',
  attemptNumber: number = 0
): Promise<FollowUpTask | null> {
  if (attemptNumber >= FOLLOW_UP_DELAYS[temperature].length) {
    return null;
  }

  const delayMs = FOLLOW_UP_DELAYS[temperature][attemptNumber];
  const scheduledFor = new Date(Date.now() + delayMs);

  try {
    return await prisma.followUpTask.create({
      data: {
        leadId,
        status: 'QUEUED',
        scheduledFor,
        attempt: attemptNumber,
        channel: 'EMAIL',
        reason: `Follow-up ${temperature} — tentativa ${attemptNumber + 1}`,
      },
    });
  } catch (error) {
    console.error(`Failed to schedule follow-up for lead ${leadId}:`, error);
    return null;
  }
}

export async function getNextFollowUpDelay(
  temperature: LeadTemperature,
  attemptCount: number
): Promise<number | null> {
  const delays = FOLLOW_UP_DELAYS[temperature];
  if (attemptCount >= delays.length) return null;
  return delays[attemptCount];
}
