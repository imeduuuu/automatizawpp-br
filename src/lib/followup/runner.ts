import { prisma } from '@/lib/db';
import { runFollowUpAgent } from '@/lib/agents/followup-agent';
import { routeMessage } from '@/lib/channels/router';
import { scheduleFollowUp } from './scheduler';

export async function runFollowUps() {
  try {
    const pendingTasks = await prisma.followUpTask.findMany({
      where: {
        status: 'QUEUED',
        scheduledFor: { lte: new Date() },
      },
      include: {
        lead: true,
      },
      take: 10,
      orderBy: { scheduledFor: 'asc' },
    });

    if (pendingTasks.length === 0) {
      return { success: true, executed: 0 };
    }

    let successful = 0;
    let failed = 0;

    for (const task of pendingTasks) {
      try {
        // Check compliance before sending
        const maxTouchesPerDay = parseInt(process.env.MAX_TOUCHES_PER_DAY || '5', 10);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const touchesToday = await prisma.message.count({
          where: {
            leadId: task.leadId,
            createdAt: { gte: todayStart },
            direction: 'OUTBOUND',
          },
        });

        if (touchesToday >= maxTouchesPerDay) {
          await prisma.followUpTask.update({
            where: { id: task.id },
            data: {
              status: 'SKIPPED',
              attempt: { increment: 1 },
            },
          });
          continue;
        }

        // Generate follow-up message
        const message = await runFollowUpAgent(
          task.leadId,
          task.attempt
        );

        if (!message) {
          throw new Error('Failed to generate follow-up message');
        }

        // Route message to appropriate channel
        const to = task.lead.email || task.lead.phone || '';
        if (!to) {
          throw new Error('Lead has no email or phone');
        }

        const delivery = await routeMessage({
          channel: task.channel || 'EMAIL',
          to,
          subject: 'Follow-up: Your Inquiry',
          body: message,
        });

        if (delivery.sent) {
          // Schedule next follow-up with default WARM temperature
          await scheduleFollowUp(
            task.leadId,
            'WARM',
            task.attempt + 1
          );

          await prisma.followUpTask.update({
            where: { id: task.id },
            data: {
              status: 'COMPLETED',
              sentAt: new Date(),
            },
          });

          successful++;
        } else {
          throw new Error('Failed to deliver message');
        }
      } catch (error) {
        console.error(`Follow-up task ${task.id} failed:`, error);

        const maxRetries = 3;
        const newAttemptCount = task.attempt + 1;

        if (newAttemptCount >= maxRetries) {
          await prisma.followUpTask.update({
            where: { id: task.id },
            data: {
              status: 'CANCELLED',
              attempt: newAttemptCount,
              completedAt: new Date(),
            },
          });
        } else {
          // Retry in 1 hour
          await prisma.followUpTask.update({
            where: { id: task.id },
            data: {
              status: 'QUEUED',
              attempt: newAttemptCount,
              scheduledFor: new Date(Date.now() + 60 * 60 * 1000),
            },
          });
        }

        failed++;
      }
    }

    return {
      success: true,
      executed: pendingTasks.length,
      successful,
      failed,
    };
  } catch (error) {
    console.error('Follow-up runner error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
