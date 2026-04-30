import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AgentName } from '@prisma/client';
import { recordMessageReview } from '@/lib/tuning/feedback-service';

const schema = z.object({
  workspaceId: z.string().min(1),
  leadId: z.string().optional(),
  messageId: z.string().optional(),
  agent: z.nativeEnum(AgentName),
  score: z.number().min(0).max(100),
  clarityScore: z.number().min(0).max(100).optional(),
  persuasionScore: z.number().min(0).max(100).optional(),
  complianceScore: z.number().min(0).max(100).optional(),
  outcome: z.enum(['booked', 'replied', 'pending', 'lost']).optional(),
  notes: z.string().optional(),
  messageText: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const review = await recordMessageReview(parsed.data);
  return NextResponse.json({ ok: true, reviewId: review.id });
}
