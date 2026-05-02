import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Test endpoint working' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ ok: true, received: body }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Failed to parse JSON' }, { status: 400 });
  }
}
