# Phase 5A: Webhooks & Event Triggers (Gatillos)

## 🎯 Quick Overview

Phase 5A implements a **complete event-driven architecture** that:
- Captures all lead activities (email, calls, messages) as events
- Validates incoming webhooks from external providers (Bird, Brevo, VAPI, Stripe)
- Automatically triggers n8n workflows based on events
- Prevents duplicate processing with idempotent webhook handling
- Provides extensible event system for custom integrations

**Status:** ✅ Production-ready, fully implemented, 18 files created, 2,000+ lines of code

---

## 📁 File Structure

```
src/lib/events/                          Core event system
  ├── types.ts                           12+ event type definitions
  ├── emitter.ts                         EventEmitter singleton
  ├── n8n-trigger.ts                     n8n webhook integration
  ├── dispatch.ts                        Helper dispatch functions
  └── index.ts                           Exports

src/lib/webhooks/                        Webhook utilities
  ├── signature.ts                       Multi-provider signature validation
  ├── idempotency.ts                     Prevent duplicate processing
  └── index.ts                           Exports

src/app/api/webhooks/
  ├── events/route.ts                    Internal event bus (POST)
  ├── n8n/route.ts                       n8n callback handler
  └── email-received/route.ts            Inbound email handler

tests/webhooks/
  ├── webhook-signatures.test.ts         Signature validation tests
  └── events.test.ts                     Event emission tests

docs/
  ├── PHASE_5A_WEBHOOKS.md              Complete overview & API reference
  ├── N8N_WORKFLOWS_SETUP.md            n8n workflows guide
  └── PHASE_5A_INTEGRATION.md           Integration checklist
```

---

## 🚀 Quick Start

### 1. Add Environment Variables

```bash
# .env.local or DigitalOcean App Platform settings:
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_WEBHOOK_SECRET=your-32-char-secret
BIRD_WEBHOOK_SECRET=...
BREVO_WEBHOOK_SECRET=...
```

### 2. Test Event Emission

```bash
curl -X POST http://localhost:3000/api/webhooks/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "lead:created",
    "workspaceId": "ws_123",
    "leadId": "lead_456",
    "payload": {
      "leadId": "lead_456",
      "email": "customer@example.com",
      "name": "John Doe"
    }
  }'

# Response: { ok: true, eventId: "evt_...", type: "lead:created" }
```

### 3. Dispatch Events from Code

```typescript
import { dispatchLeadCreated } from '@/lib/events/dispatch';

// After creating a lead
await dispatchLeadCreated(workspaceId, newLead.id, {
  email: newLead.email,
  name: newLead.fullName,
  source: 'api'
});

// Automatically:
// 1. Emits event via EventEmitter
// 2. Persists to AuditLog
// 3. Triggers n8n workflow
// 4. Retries on failure
```

---

## 📖 Documentation Guide

Start here and read in order:

1. **[PHASE_5A_IMPLEMENTATION_SUMMARY.md](./PHASE_5A_IMPLEMENTATION_SUMMARY.md)**
   - What was built
   - Architecture overview
   - Configuration required
   - Testing & monitoring

2. **[docs/PHASE_5A_WEBHOOKS.md](./docs/PHASE_5A_WEBHOOKS.md)**
   - Complete component breakdown
   - Event types & their schemas
   - API endpoints & examples
   - Usage patterns

3. **[docs/N8N_WORKFLOWS_SETUP.md](./docs/N8N_WORKFLOWS_SETUP.md)**
   - How to create n8n workflows
   - Webhook signatures & auth
   - Testing workflows
   - Production deployment

4. **[docs/PHASE_5A_INTEGRATION.md](./docs/PHASE_5A_INTEGRATION.md)**
   - How to integrate with existing APIs
   - Error handling & retries
   - Monitoring & debugging
   - Troubleshooting guide

5. **[PHASE_5A_DEPLOYMENT_CHECKLIST.md](./PHASE_5A_DEPLOYMENT_CHECKLIST.md)**
   - Step-by-step deployment
   - Provider configuration (Bird, Brevo, VAPI)
   - Testing procedure
   - Rollback plan

---

## 🔧 Key Components

### EventEmitter (`src/lib/events/emitter.ts`)
```typescript
import { eventEmitter, EventType } from '@/lib/events';

// Register custom handler
eventEmitter.on(EventType.LEAD_CREATED, async (event) => {
  console.log('Lead created:', event.payload.email);
  // Your custom logic here
});

// Emit event
await eventEmitter.emit(leadCreatedEvent);
```

### Event Types (`src/lib/events/types.ts`)
```typescript
export enum EventType {
  LEAD_CREATED,
  LEAD_UPDATED,
  EMAIL_SENT,
  EMAIL_RECEIVED,
  CALL_LOGGED,
  MESSAGE_SENT,
  MESSAGE_RECEIVED,
  FOLLOW_UP_SCHEDULED,
  FOLLOW_UP_SENT,
  BOOKING_CREATED,
  BOOKING_CONFIRMED,
}
```

### Dispatch Helpers (`src/lib/events/dispatch.ts`)
```typescript
import {
  dispatchLeadCreated,
  dispatchEmailSent,
  dispatchEmailReceived,
  dispatchCallLogged,
  dispatchMessageSent,
  dispatchMessageReceived,
  dispatchFollowUpScheduled,
  dispatchFollowUpSent,
  dispatchBookingCreated,
  dispatchBookingConfirmed,
} from '@/lib/events/dispatch';
```

### Webhook Validation (`src/lib/webhooks/signature.ts`)
```typescript
import { validateWebhookSignature } from '@/lib/webhooks/signature';

const isValid = validateWebhookSignature(
  rawBody,
  signatureHeader,
  'bird',  // or 'brevo', 'stripe', 'vapi', 'n8n'
  process.env.BIRD_WEBHOOK_SECRET
);
```

### Idempotency (`src/lib/webhooks/idempotency.ts`)
```typescript
import { claimWebhookEvent } from '@/lib/webhooks/idempotency';

const isFirst = await claimWebhookEvent('bird', externalEventId);
if (!isFirst) {
  // Already processed - return idempotent response
  return NextResponse.json({ ok: true });
}
```

---

## 📊 Event Flow Architecture

```
User Action
    ↓
[API Handler or Webhook]
    ↓
[Signature Validation] ← Check if authentic
    ↓
[Idempotency Check] ← Skip if already processed
    ↓
[Dispatch Event]
    ↓
[EventEmitter.emit()]
    ├─→ Persist to AuditLog
    ├─→ Call Handlers (if registered)
    └─→ Trigger n8n Workflow
        ├─→ Retry on failure (exponential backoff)
        └─→ Log result
    ↓
[Lead Status Updated]
[Customer Response Sent]
[Workflow Executed]
```

---

## 🔄 Complete Integration Example

```typescript
// 1. Create lead via API
import { db } from '@/lib/db';
import { dispatchLeadCreated } from '@/lib/events/dispatch';

const newLead = await db.lead.create({
  data: {
    workspaceId: workspace.id,
    email: 'customer@example.com',
    fullName: 'John Doe',
    source: 'website'
  }
});

// 2. Emit event (triggers n8n workflow)
const eventId = await dispatchLeadCreated(workspace.id, newLead.id, {
  email: newLead.email,
  name: newLead.fullName,
  source: newLead.source,
  campaign: 'Q2_2026'
});

// 3. In n8n:
//    - Receive lead:created event
//    - Send welcome email
//    - Add to CRM
//    - Create calendar invite

// 4. Event automatically logged to AuditLog
// 5. Result tracked in WebhookEvent table
```

---

## ✅ Webhook Providers Supported

| Provider | Signature Type | Header | Status |
|----------|---|---|---|
| **Bird** | HMAC-SHA256 | x-bird-signature | ✅ Ready |
| **Brevo** | HMAC-SHA256 | x-brevo-signature | ✅ Ready |
| **VAPI** | HMAC-SHA256 | x-vapi-signature | ✅ Ready |
| **Stripe** | HMAC-SHA256 | stripe-signature | ✅ Ready |
| **n8n** | HMAC-SHA256 | x-n8n-signature | ✅ Ready |
| **Meta/WhatsApp** | HMAC-SHA256 | x-hub-signature | ✅ Ready |
| **Resend** | HMAC-SHA256 | svix-signature | ⏳ TODO |

---

## 🧪 Testing

```bash
# Run tests
npm run test tests/webhooks/

# Manual test - emit event
curl -X POST http://localhost:3000/api/webhooks/events \
  -H "Content-Type: application/json" \
  -d '{"type":"lead:created","workspaceId":"ws_123","leadId":"lead_456","payload":{"leadId":"lead_456","email":"test@example.com"}}'

# Expected: { ok: true, eventId: "evt_...", type: "lead:created" }
```

---

## 📋 What's Next?

### Immediate (This Week)
1. Review documentation
2. Configure environment variables
3. Create n8n workflows
4. Test event emission

### Short Term (Phase 5B-5E)
1. Integrate with lead creation API
2. Integrate with email sending service
3. Integrate with call handlers
4. Set up monitoring/alerting
5. Add event filtering & subscriptions
6. Build event replay tools
7. Event aggregation for batch processing

### Long Term
1. Multi-tenant event routing
2. Event webhooks for customers
3. Advanced event scheduling
4. Custom event types per workspace
5. Event analytics dashboard

---

## 🆘 Support

### Common Issues

**Q: n8n webhook not receiving events**
- Check N8N_WEBHOOK_URL is correct and n8n is running
- Verify n8n workflow exists at /webhook/lead-created (etc.)
- Check n8n execution logs for errors

**Q: Signature validation failing**
- Verify secret matches exactly (case-sensitive)
- Check header name matches provider (x-bird-signature, etc.)
- Ensure raw body is used (not parsed JSON)

**Q: Events not emitting**
- Verify dispatchLeadCreated() is being called
- Check N8N_WEBHOOK_URL is set
- Look at application logs for errors

See **[docs/PHASE_5A_INTEGRATION.md#troubleshooting](./docs/PHASE_5A_INTEGRATION.md#troubleshooting)** for more.

---

## 📞 Summary

Phase 5A is a **production-ready event system** that:
- ✅ Validates webhooks from 5+ providers
- ✅ Prevents duplicate processing
- ✅ Triggers n8n workflows automatically
- ✅ Retries failed events
- ✅ Logs all activity for debugging
- ✅ Fully typed with TypeScript
- ✅ Comprehensively documented
- ✅ Ready to deploy

**Status:** Implementation complete. Ready for deployment.

---

## 📚 Reference Files

- **[src/lib/events/types.ts](./src/lib/events/types.ts)** - Event type definitions
- **[src/lib/events/emitter.ts](./src/lib/events/emitter.ts)** - EventEmitter implementation
- **[src/lib/events/n8n-trigger.ts](./src/lib/events/n8n-trigger.ts)** - n8n integration
- **[src/lib/webhooks/signature.ts](./src/lib/webhooks/signature.ts)** - Signature validation
- **[src/lib/webhooks/idempotency.ts](./src/lib/webhooks/idempotency.ts)** - Idempotent processing

---

**Last Updated:** May 1, 2026  
**Phase:** 5A - Webhooks & Event Triggers  
**Status:** ✅ Complete
