import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildAlexCallOverrides } from '@/lib/vapi/alex-payload';

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

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorised' }, { status: 401 });
  }

  const { apiKey, assistantId, phoneNumberId, testPhone: defaultTestPhone } = getVapiConfig();
  if (!apiKey) {
    return jsonResponse({ error: 'VAPI_API_KEY is not configured' }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as { phone?: string; sector?: string; company?: string };
  const phone = body.phone?.trim() || defaultTestPhone;

  const assistantResponse = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store'
  });

  const assistantText = await assistantResponse.text();
  const assistantPayload = assistantText ? JSON.parse(assistantText) : {};
  if (!assistantResponse.ok) {
    return jsonResponse({ error: assistantPayload }, { status: assistantResponse.status });
  }

  const assistantOverrides = buildAlexCallOverrides(assistantPayload, {
    sector: body.sector,
    company: body.company,
    phone
  });

  const response = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      assistantOverrides,
      customer: {
        number: phone,
        name: 'Prueba web AutomatizaWPP'
      }
    })
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    return jsonResponse({ error: payload }, { status: response.status });
  }

  return jsonResponse({ ok: true, call: payload });
}
