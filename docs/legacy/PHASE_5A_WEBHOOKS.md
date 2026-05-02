# Phase 5A: Webhooks & Event Triggers (Gatillos)

## Overview

Phase 5A implements a complete webhook and event system that connects the Next.js application with n8n workflows. This enables real-time event-driven automation where lead activities (email, calls, messages) trigger automated workflows.

## Architecture

```
┌─────────────────────────────────────┐
│   External Events                   │
│   (Bird, Brevo, VAPI, etc.)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Webhook Handlers                   │
│  /api/webhooks/{bird,brevo,...}     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Event Bus                          │
│  /api/webhooks/events               │
│  eventEmitter.emit(event)           │
└──────────────┬──────────────────────┘
               │
        ┌──────┴───────┬──────────────┐
        │              │              │
        ▼              ▼              ▼
   Persist Event  Run Handlers   Trigger n8n
   (DB Logging)  (Internal)      (Workflows)
```

## Components

### 1. Event System (`src/lib/events/`)

#### `types.ts`
Define all event types and their payloads:
- `EventType` enum: LEAD_CREATED, EMAIL_SENT, EMAIL_RECEIVED, CALL_LOGGED, etc.
- Event interfaces: LeadCreatedEvent, EmailSentEvent, etc.
- Base event structure with id, type, workspaceId, leadId, timestamp

#### `emitter.ts`
EventEmitter implementation:
- Register handlers: `eventEmitter.on(EventType.LEAD_CREATED, handler)`
- Emit events: `await eventEmitter.emit(event)`
- Default handlers: persistence + n8n triggers
- Async handler execution with error handling

#### `n8n-trigger.ts`
Trigger n8n workflows:
- `triggerN8nWorkflow(workflowKey, payload)` - send event to n8n webhook
- Retry logic with exponential backoff (configurable per workflow)
- Signature-based authentication
- Health check: `checkN8nHealth()`

#### `dispatch.ts`
Helper functions to emit events from anywhere:
- `dispatchLeadCreated(workspaceId, leadId, data)`
- `dispatchEmailReceived(workspaceId, leadId, data)`
- `dispatchCallLogged(workspaceId, leadId, data)`
- etc.

### 2. Webhook Handlers (`src/app/api/webhooks/`)

#### `/api/webhooks/events`
Internal event bus:
- Accepts POST with { type, workspaceId, leadId, payload }
- Validates event structure
- Emits via eventEmitter
- Returns { ok, eventId, type }

#### `/api/webhooks/n8n`
Receive callbacks from n8n:
- Validates n8n signature
- Processes workflow results
- Returns { ok, message }

#### `/api/webhooks/email-received`
Handle inbound emails:
- Receives email from Bird/Brevo webhook
- Resolves lead by email address
- Creates EmailReceivedEvent
- Runs sales orchestration
- Triggers n8n workflow

### 3. Webhook Utilities (`src/lib/webhooks/`)

#### `signature.ts`
Validate webhook signatures:
- `validateHmacSignature(payload, signature, secret, algorithm)`
- `validateBearerToken(token, secret)`
- `validateWebhookSignature(payload, signature, provider, secret)`
- Support for: Bird, n8n, Brevo, Stripe, Vapi

#### `idempotency.ts`
Prevent duplicate processing:
- `claimWebhookEvent(source, externalId)` - idempotent claim
- `markWebhookEventAsFailed(source, externalId, error)`
- `getWebhookEventStatus(source, externalId)`
- `cleanupOldWebhookEvents(daysOld)`

Uses `WebhookEvent` table in Prisma schema.

## Workflow: Event Flow

### Example: Email Received

```
1. Bird API sends email to /api/webhooks/email-received
2. Webhook handler:
   - Parses email (from, subject, body)
   - Resolves lead by sender email
   - Creates EmailReceivedEvent
   - Calls eventEmitter.emit(event)

3. EventEmitter (async):
   - Persists event to AuditLog
   - Calls triggerN8nOnEmailReceived handler

4. n8n Trigger:
   - Sends event to n8n webhook: /webhooks/email-received
   - Retry with exponential backoff if fails
   - Logs result

5. Sales Orchestration:
   - Runs agents (Lead Response, Qualification, etc.)
   - Sends reply to lead if needed
   - Updates lead status/score

6. Result returned to Bird API
```

### Example: Lead Created

```
1. Within app, after lead creation in database:
   - Call dispatchLeadCreated(workspaceId, leadId, {...})

2. EventEmitter emits LeadCreatedEvent
   - Persists to DB
   - Calls triggerN8nOnLeadCreated

3. n8n workflow:
   - Receives lead:created event
   - Sends welcome email
   - Adds lead to CRM
   - Creates calendar invite for intro call

4. Event ID returned for tracking
```

## Configuration

### Environment Variables

```bash
# n8n Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_WEBHOOK_SECRET=your-n8n-webhook-secret
N8N_WEBHOOK_AUTH=Bearer-token-if-needed

# Webhook Secrets (for validating incoming webhooks)
BIRD_WEBHOOK_SECRET=...
BREVO_WEBHOOK_SECRET=...
VAPI_WEBHOOK_SECRET=...
STRIPE_WEBHOOK_SECRET=...
```

### Database

Uses existing `WebhookEvent` table:
```prisma
model WebhookEvent {
  id           String   @id @default(cuid())
  source       String   // 'bird' | 'brevo' | 'vapi' | 'stripe' | 'meta' | 'n8n'
  externalId   String   // event id from provider
  eventType    String?
  payload      Json?
  status       String   @default("PROCESSED")
  errorMessage String?
  processedAt  DateTime @default(now())

  @@unique([source, externalId])
  @@index([source, processedAt])
}
```

## API Reference

### POST /api/webhooks/events
Internal event bus.

**Request:**
```json
{
  "type": "lead:created",
  "workspaceId": "ws_123",
  "leadId": "lead_456",
  "timestamp": "2026-05-01T10:30:00Z",
  "payload": {
    "leadId": "lead_456",
    "email": "test@example.com",
    "name": "John Doe",
    "source": "website"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "eventId": "evt_1714558200000_abc123",
  "type": "lead:created",
  "message": "Event emitted successfully"
}
```

### POST /api/webhooks/email-received
Handle inbound emails.

**Request:**
```json
{
  "from": "customer@example.com",
  "to": "hola@automatizawpp.com",
  "subject": "Question about your service",
  "body": "I'm interested in learning more...",
  "messageId": "msg_bird_12345",
  "receivedAt": "2026-05-01T10:30:00Z",
  "threadId": "thread_123"
}
```

**Response:**
```json
{
  "ok": true,
  "leadId": "lead_abc123",
  "eventId": "evt_xyz789",
  "agent": "LEAD_RESPONSE",
  "summary": "Lead email processed, welcome reply queued"
}
```

### POST /api/webhooks/n8n
Receive n8n workflow results.

**Headers:**
```
x-n8n-signature: hmac-sha256-hash
```

**Request:**
```json
{
  "workflowId": "lead-created",
  "status": "success",
  "output": {
    "leadId": "lead_123",
    "emailSent": true
  }
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Event received and processed"
}
```

## Usage Examples

### Dispatch Events from Code

```typescript
import { dispatchLeadCreated, dispatchCallLogged } from '@/lib/events';

// After creating a lead
const eventId = await dispatchLeadCreated(
  workspaceId,
  newLead.id,
  {
    email: newLead.email,
    name: newLead.fullName,
    source: 'website',
    campaign: 'summer_2026'
  }
);

// After a call completes
await dispatchCallLogged(
  workspaceId,
  leadId,
  {
    callId: callRecord.id,
    duration: 1800, // seconds
    status: 'QUALIFIED',
    transcriptUrl: 'https://...'
  }
);
```

### Register Custom Event Handler

```typescript
import { eventEmitter, EventType } from '@/lib/events';

eventEmitter.on(EventType.LEAD_CREATED, async (event) => {
  console.log('New lead:', event.payload.email);
  // Send to CRM
  // Create calendar entry
  // etc.
});
```

### Validate Webhook Signature

```typescript
import { validateWebhookSignature } from '@/lib/webhooks';

const isValid = validateWebhookSignature(
  rawBody,
  signatureHeader,
  'bird',
  process.env.BIRD_WEBHOOK_SECRET
);

if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### Ensure Idempotency

```typescript
import { claimWebhookEvent } from '@/lib/webhooks';

const isFirst = await claimWebhookEvent('bird', externalEventId);
if (!isFirst) {
  console.log('Already processed');
  return NextResponse.json({ ok: true }); // Idempotent
}

// Process the event
```

## Testing

Run tests:
```bash
npm run test tests/webhooks/
```

Tests cover:
- Webhook signature validation (HMAC-SHA256, Bearer, Stripe format)
- Event emission and handler execution
- Idempotency checks
- n8n trigger retry logic

## Monitoring & Debugging

### Check n8n Health
```typescript
import { checkN8nHealth } from '@/lib/events';

const isHealthy = await checkN8nHealth();
if (!isHealthy) {
  console.error('n8n is unreachable');
}
```

### View Event Logs
Events are persisted to `AuditLog` table:
```sql
SELECT * FROM "AuditLog"
WHERE "event" IN ('lead:created', 'email:received', 'call:logged')
ORDER BY "createdAt" DESC
LIMIT 100;
```

### Check Webhook Processing Status
```typescript
import { getWebhookEventStatus } from '@/lib/webhooks';

const status = await getWebhookEventStatus('bird', externalEventId);
// Returns: 'PROCESSED' | 'FAILED' | null
```

## Integration Checklist

- [x] Event types and interfaces defined
- [x] EventEmitter with handler registration
- [x] Default handlers: persistence + n8n triggers
- [x] Webhook handlers for all sources
- [x] Signature validation utilities
- [x] Idempotency ledger
- [x] Helper functions for dispatching events
- [x] n8n integration with retry logic
- [x] Tests for signatures and events
- [ ] Integration with lead creation API
- [ ] Integration with email sending pipeline
- [ ] Integration with call recording handlers
- [ ] Deploy n8n workflows
- [ ] Configure webhook endpoints in each provider (Bird, Brevo, etc.)
- [ ] Add monitoring/alerting for webhook failures

## Next Steps (Phase 5B & Beyond)

1. **Integrate with Lead Creation** - Call dispatchLeadCreated when lead is created
2. **Integrate with Messaging** - Emit events when messages are sent/received
3. **Integrate with Calls** - Emit events from VAPI/Bird call handlers
4. **Event History Dashboard** - Show event timeline per lead
5. **Webhook Replay** - Ability to manually replay failed events
6. **Advanced Filtering** - Subscribe to specific event types/leads
7. **Event Aggregation** - Batch events for n8n if needed

## References

- [WebhookEvent table](../../prisma/schema.prisma#L814)
- [Event types](./src/lib/events/types.ts)
- [EventEmitter](./src/lib/events/emitter.ts)
- [Webhook handlers](./src/app/api/webhooks/)
