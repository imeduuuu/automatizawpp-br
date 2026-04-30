import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { analyzeTranscript } from '@/lib/calls/call-orchestrator';

const schema = z.object({
  callRecordId: z.string(),
  lines: z.array(
    z.object({
      speaker: z.string(),
      content: z.string(),
      timestampSec: z.number().optional()
    })
  )
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const transcriptText = parsed.data.lines.map((line) => `${line.speaker}: ${line.content}`).join('\n');

    await prisma.callTranscript.createMany({
      data: parsed.data.lines.map((line) => ({
        callRecordId: parsed.data.callRecordId,
        speaker: line.speaker,
        content: line.content,
        timestampSec: line.timestampSec
      }))
    });

    const updatedCall = await analyzeTranscript(parsed.data.callRecordId, transcriptText);
    return NextResponse.json({ updatedCall });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
