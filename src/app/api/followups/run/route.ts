import { NextResponse } from 'next/server';
import { runFollowUps } from '@/lib/followup/runner';

export async function POST() {
  try {
    const result = await runFollowUps();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Follow-up execution failed:', error);
    return NextResponse.json(
      { success: false, error: 'Follow-up execution failed' },
      { status: 500 }
    );
  }
}
