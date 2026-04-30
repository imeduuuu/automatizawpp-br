import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const DEFAULT_ASSISTANT_ID = '3f91ff80-85db-4735-bc22-2d6abf291b44';
const DEFAULT_PHONE_ID = '041a9afd-ecb7-4ceb-803a-2b36af793f2d';

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

function getVapiConfig() {
  return {
    apiKey: process.env.VAPI_API_KEY || '',
    assistantId: process.env.VAPI_ASSISTANT_ID || DEFAULT_ASSISTANT_ID,
    phoneNumberId: process.env.VAPI_PHONE_ID || DEFAULT_PHONE_ID,
    testPhone: process.env.VAPI_TEST_PHONE || '+34680365779'
  };
}

function sanitizeAssistantPayload(payload: Record<string, unknown>) {
  const clone = JSON.parse(JSON.stringify(payload));
  for (const key of ['id', 'orgId', 'createdAt', 'updatedAt', 'isServerUrlSecretSet']) {
    delete clone[key];
  }
  if (clone.voice && typeof clone.voice === 'object') {
    const voice = clone.voice as Record<string, unknown>;
    delete voice.stability;
  }
  return clone as Record<string, unknown>;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorised' }, { status: 401 });
  }

  const { apiKey, assistantId, phoneNumberId, testPhone } = getVapiConfig();
  if (!apiKey) {
    return jsonResponse({ error: 'VAPI_API_KEY is not configured' }, { status: 500 });
  }

  const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store'
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    return jsonResponse({ error: payload }, { status: response.status });
  }

  return jsonResponse({
    assistantId,
    phoneNumberId,
    testPhone,
    assistant: sanitizeAssistantPayload(payload)
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorised' }, { status: 401 });
  }

  const { apiKey, assistantId } = getVapiConfig();
  if (!apiKey) {
    return jsonResponse({ error: 'VAPI_API_KEY is not configured' }, { status: 500 });
  }

  const body = (await request.json()) as { assistant?: Record<string, unknown> };
  const assistant = sanitizeAssistantPayload(body.assistant || {});

  const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assistant)
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    return jsonResponse({ error: payload }, { status: response.status });
  }

  return jsonResponse({ ok: true, assistant: sanitizeAssistantPayload(payload) });
}
