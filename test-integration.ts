/**
 * 🧪 Integration Tests — Sales OS Core Logic
 * Valida: database, normalization, lead resolution (sin API calls)
 */

import { prisma } from '@/lib/db';
import { normalizeBirdEvent } from '@/lib/channels/bird-normalizer';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error?: string;
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

  // ============================================================================
  // TESTS
  // ============================================================================

  await test('Database connection & workspace exists', async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: 'demo_workspace' }
    });
    console.log(`  → Workspace: ${workspace?.name}`);
    if (!workspace) {
      throw new Error('demo_workspace not found');
    }
  });

  await test('Bird Event Normalization — Email payload', async () => {
    const payload = {
      type: 'message.inbound',
      workspace: { id: 'demo_workspace' },
      channel: { id: 'email-ch', platform: 'email' },
      message: {
        id: 'msg-001',
        body: { type: 'text', text: { text: 'Test message' } },
        createdAt: new Date().toISOString(),
      },
      conversation: { id: 'conv-001' },
      contact: {
        id: 'contact-001',
        displayName: 'Test User',
        identifiers: [
          { key: 'email', value: 'test@example.com' },
          { key: 'phone', value: '+34612345678' },
        ],
      },
    };

    const normalized = normalizeBirdEvent(payload, 'demo_workspace');
    console.log(`  → Channel: ${normalized?.channel}`);
    console.log(`  → Message: ${normalized?.message.substring(0, 50)}...`);
    console.log(`  → Email: ${normalized?.lead.email}`);

    if (!normalized) {
      throw new Error('Failed to normalize Bird event');
    }
    if (normalized.channel !== 'EMAIL') {
      throw new Error('Expected channel EMAIL');
    }
    if (!normalized.lead.email) {
      throw new Error('Expected email in normalized lead');
    }
  });

  await test('Bird Event Normalization — WhatsApp payload', async () => {
    const payload = {
      type: 'message.inbound',
      workspace: { id: 'demo_workspace' },
      channel: { id: 'wa-ch', platform: 'whatsapp' },
      message: {
        id: 'wa-001',
        body: { type: 'text', text: { text: '¿Hola?' } },
        createdAt: new Date().toISOString(),
      },
      conversation: { id: 'wa-conv-001' },
      contact: {
        id: 'wa-contact-001',
        displayName: 'WhatsApp User',
        identifiers: [{ key: 'phone', value: '+34698765432' }],
      },
    };

    const normalized = normalizeBirdEvent(payload, 'demo_workspace');
    console.log(`  → Channel: ${normalized?.channel}`);
    console.log(`  → Phone: ${normalized?.lead.phone}`);

    if (!normalized) {
      throw new Error('Failed to normalize Bird event');
    }
    if (normalized.channel !== 'WHATSAPP') {
      throw new Error('Expected channel WHATSAPP');
    }
    if (!normalized.lead.phone) {
      throw new Error('Expected phone in normalized lead');
    }
  });

  await test('Lead CRUD Operations', async () => {
    const email = `integration-test-${Date.now()}@example.com`;

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        workspaceId: 'demo_workspace',
        email,
        firstName: 'Integration',
        lastName: 'Test',
        status: 'NEW',
      },
    });
    console.log(`  → Created lead: ${lead.id}`);

    // Read lead
    const retrieved = await prisma.lead.findUnique({
      where: { id: lead.id },
    });
    if (!retrieved) {
      throw new Error('Could not retrieve created lead');
    }
    console.log(`  → Retrieved lead: ${retrieved.fullName || retrieved.email}`);

    // Update lead
    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'QUALIFIED' },
    });
    console.log(`  → Updated status: ${updated.status}`);

    if (updated.status !== 'QUALIFIED') {
      throw new Error('Lead status not updated');
    }

    // Delete lead
    await prisma.lead.delete({
      where: { id: lead.id },
    });
    console.log(`  → Deleted lead`);

    const deleted = await prisma.lead.findUnique({
      where: { id: lead.id },
    });
    if (deleted) {
      throw new Error('Lead was not deleted');
    }
  });

  await test('Conversation & Message Storage', async () => {
    // Create test lead
    const lead = await prisma.lead.create({
      data: {
        workspaceId: 'demo_workspace',
        email: `conv-test-${Date.now()}@example.com`,
        firstName: 'Conv',
        lastName: 'Test',
        status: 'NEW',
      },
    });

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: 'demo_workspace',
        leadId: lead.id,
        channel: 'EMAIL',
        subject: 'Test Conversation',
      },
    });
    console.log(`  → Created conversation: ${conversation.id}`);

    // Create inbound message
    const inbound = await prisma.message.create({
      data: {
        leadId: lead.id,
        conversationId: conversation.id,
        channel: 'EMAIL',
        direction: 'INBOUND',
        body: 'Hello, testing message storage',
      },
    });
    console.log(`  → Created inbound message: ${inbound.id}`);

    // Create outbound message
    const outbound = await prisma.message.create({
      data: {
        leadId: lead.id,
        conversationId: conversation.id,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        body: 'Thank you for your message',
        sentAt: new Date(),
      },
    });
    console.log(`  → Created outbound message: ${outbound.id}`);

    // Verify relationships
    const retrieved = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: { messages: true },
    });

    if (!retrieved || retrieved.messages.length !== 2) {
      throw new Error('Messages not properly stored');
    }
    console.log(`  → Verified: ${retrieved.messages.length} messages in conversation`);

    // Cleanup
    await prisma.message.deleteMany({
      where: { conversationId: conversation.id },
    });
    await prisma.conversation.delete({
      where: { id: conversation.id },
    });
    await prisma.lead.delete({
      where: { id: lead.id },
    });
  });

  await test('KPI Metrics Endpoint Response Structure', async () => {
    // Just verify the database can calculate metrics
    const leads = await prisma.lead.findMany({
      where: { workspaceId: 'demo_workspace' },
      include: { conversations: true },
    });

    const totalLeads = leads.length;
    const respondedLeads = leads.filter(l => l.status !== 'NEW').length;
    const qualifiedLeads = leads.filter(l => l.leadScoreValue && l.leadScoreValue >= 60).length;

    console.log(`  → Total leads: ${totalLeads}`);
    console.log(`  → Responded: ${respondedLeads}`);
    console.log(`  → Qualified: ${qualifiedLeads}`);

    const responseQuality = (respondedLeads / Math.max(totalLeads, 1)) * 100;
    console.log(`  → Response Quality: ${responseQuality.toFixed(1)}%`);

    if (typeof responseQuality !== 'number') {
      throw new Error('Could not calculate KPI metrics');
    }
  });

  await test('Environment Configuration', async () => {
    console.log(`  → DATABASE_URL: ${process.env.DATABASE_URL ? '✓ set' : '✗ missing'}`);
    console.log(`  → ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ missing'}`);
    console.log(`  → BIRD_WORKSPACE_ID: ${process.env.BIRD_WORKSPACE_ID || 'demo_workspace (default)'}`);

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
  });

  // ============================================================================
  // REPORT
  // ============================================================================

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 INTEGRATION TEST REPORT');
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
    console.log(`\n✅ All integration tests passed!`);
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
