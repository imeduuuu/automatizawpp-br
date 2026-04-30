/**
 * 🧪 E2E Testing — Sales OS Complete Flow
 * Valida: inbound → orchestration → response → storage
 */

import { prisma } from '@/lib/db';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error?: string;
  data?: Record<string, unknown>;
}

async function runTests() {
  const results: TestResult[] = [];

  async function test(
    name: string,
    fn: () => Promise<void>
  ): Promise<void> {
    console.log(`\n🧪 Testing: ${name}`);
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      results.push({ name, status: 'PASS', duration });
      console.log(`✅ PASS (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push({ name, status: 'FAIL', duration, error: errorMsg });
      console.log(`❌ FAIL (${duration}ms): ${errorMsg}`);
    }
  }

  async function fetchWebhook(payload: unknown): Promise<Response> {
    const response = await fetch('http://localhost:3000/api/webhooks/bird', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response;
  }

  // ============================================================================
  // TESTS
  // ============================================================================

  await test('Database connection', async () => {
  const count = await prisma.lead.count();
  console.log(`  → Leads in database: ${count}`);
});

await test('Email Inbound Flow — Create Lead + Process', async () => {
  const email = `test-${Date.now()}@example.com`;
  
  const response = await fetchWebhook({
    type: 'message.inbound',
    workspace: { id: 'demo_workspace' },
    channel: { id: 'email-ch', platform: 'email' },
    message: {
      id: 'msg-email-001',
      body: { type: 'text', text: { text: 'Hola, me interesa vuestros servicios de automatización' } },
      createdAt: new Date().toISOString(),
    },
    conversation: { id: 'conv-email-001' },
    contact: {
      id: 'contact-001',
      displayName: 'Juan Test',
      identifiers: [
        { key: 'email', value: email },
        { key: 'phone', value: '+34612345678' },
      ],
    },
  });

  const body = (await response.json()) as Record<string, unknown>;
  console.log(`  → Response: ${response.status}`);
  console.log(`  → Lead ID: ${body.leadId}`);
  console.log(`  → Agent: ${body.agent}`);
  console.log(`  → Action: ${body.summary}`);

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  if (!body.leadId) {
    throw new Error('No leadId in response');
  }

  // Verify lead was created
  const lead = await prisma.lead.findUnique({
    where: { id: String(body.leadId) },
    include: { conversations: true },
  });

  if (!lead) {
    throw new Error('Lead not found in database');
  }

  console.log(`  → Lead created: ${lead.fullName}`);
  console.log(`  → Lead email: ${lead.email}`);
  console.log(`  → Conversations: ${lead.conversations.length}`);

  if (lead.conversations.length === 0) {
    throw new Error('No conversation created');
  }
});

await test('WhatsApp Inbound Flow — Process Message', async () => {
  const response = await fetchWebhook({
    type: 'message.inbound',
    workspace: { id: 'demo_workspace' },
    channel: { id: 'wa-ch', platform: 'whatsapp' },
    message: {
      id: 'wa-msg-002',
      body: { type: 'text', text: { text: '¿Cuál es el precio de vuestros servicios? 💰' } },
      createdAt: new Date().toISOString(),
    },
    conversation: { id: 'wa-conv-002' },
    contact: {
      id: 'wa-contact-002',
      displayName: 'María WhatsApp',
      identifiers: [{ key: 'phone', value: '+34698765432' }],
    },
  });

  const body = (await response.json()) as Record<string, unknown>;
  console.log(`  → Response: ${response.status}`);
  console.log(`  → Lead ID: ${body.leadId}`);

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  // Verify WhatsApp lead
  const lead = await prisma.lead.findUnique({
    where: { id: String(body.leadId) },
    include: { conversations: { include: { messages: true } } },
  });

  if (!lead || !lead.phone) {
    throw new Error('WhatsApp lead not properly created');
  }

  console.log(`  → Lead phone: ${lead.phone}`);

  const messages = lead.conversations.flatMap(c => c.messages);
  console.log(`  → Total messages: ${messages.length}`);

  if (messages.length === 0) {
    throw new Error('No messages stored');
  }
});

await test('Compliance Check — Opt-out Lead', async () => {
  const response = await fetchWebhook({
    type: 'message.inbound',
    workspace: { id: 'demo_workspace' },
    channel: { id: 'email-ch', platform: 'email' },
    message: {
      id: 'msg-optout-001',
      body: { type: 'text', text: { text: 'No me contactéis más' } },
      createdAt: new Date().toISOString(),
    },
    conversation: { id: 'conv-optout-001' },
    contact: {
      id: 'contact-optout',
      displayName: 'OptOut User',
      identifiers: [{ key: 'email', value: 'optout@example.com' }],
    },
  });

  const body = (await response.json()) as Record<string, unknown>;
  const leadId = body.leadId as string;

  // Mark as opted out
  await prisma.lead.update({
    where: { id: leadId },
    data: { optOutAt: new Date() },
  });

  // Try to send another message
  const response2 = await fetchWebhook({
    type: 'message.inbound',
    workspace: { id: 'demo_workspace' },
    channel: { id: 'email-ch', platform: 'email' },
    message: {
      id: 'msg-optout-002',
      body: { type: 'text', text: { text: 'Segundo mensaje' } },
      createdAt: new Date().toISOString(),
    },
    conversation: { id: 'conv-optout-001' },
    contact: {
      id: 'contact-optout',
      displayName: 'OptOut User',
      identifiers: [{ key: 'email', value: 'optout@example.com' }],
    },
  });

  const body2 = (await response2.json()) as Record<string, unknown>;
  console.log(`  → Second message processed (should be HELD)`);
  console.log(`  → Summary: ${body2.summary}`);

  if (!String(body2.summary).includes('HOLD') && !String(body2.summary).includes('compliance')) {
    throw new Error('Compliance check failed for opted-out lead');
  }
});

await test('Database Integrity — Verify Relationships', async () => {
  const lead = await prisma.lead.findFirst({
    include: {
      conversations: { include: { messages: true } },
    },
  });

  if (!lead) {
    throw new Error('No leads found');
  }

  console.log(`  → Lead: ${lead.fullName} (${lead.id})`);
  console.log(`  → Conversations: ${lead.conversations.length}`);

  const totalMessages = lead.conversations.reduce((acc, c) => acc + c.messages.length, 0);
  console.log(`  → Total messages: ${totalMessages}`);

  if (totalMessages === 0) {
    throw new Error('No messages in database');
  }

  // Verify message direction
  const inboundCount = lead.conversations.reduce(
    (acc, c) => acc + c.messages.filter(m => m.direction === 'INBOUND').length,
    0
  );
  console.log(`  → Inbound messages: ${inboundCount}`);

  if (inboundCount === 0) {
    throw new Error('No inbound messages stored');
  }
});

await test('KPI Baseline — Capture Initial Metrics', async () => {
  const response = await fetch('http://localhost:3000/api/ops/efficiency?days=7');
  const metrics = (await response.json()) as Record<string, unknown>;

  console.log(`  → Response Quality: ${metrics.responseQuality}%`);
  console.log(`  → NBA Accuracy: ${metrics.nbaAccuracy}%`);
  console.log(`  → Compliance Score: ${metrics.complianceScore}%`);
  console.log(`  → Stage Progression: ${metrics.stageProgression}%`);
  console.log(`  → Follow-Up Effectiveness: ${metrics.followUpEffectiveness}%`);
  console.log(`  → Weighted Efficiency: ${metrics.weightedEfficiency}%`);

  if (typeof metrics.weightedEfficiency !== 'number') {
    throw new Error('Invalid KPI response');
  }
});

  // ============================================================================
  // REPORT
  // ============================================================================

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 TEST REPORT');
  console.log('═══════════════════════════════════════════════════════════');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total: ${totalDuration}ms\n`);

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.name} (${r.duration}ms)`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════');

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} test(s) failed`);
    process.exit(1);
  } else {
    console.log(`\n✅ All tests passed!`);
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
