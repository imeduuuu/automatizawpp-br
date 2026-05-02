# Phase 5A Integration Guide

## Quick Start

### 1. Environment Setup

Add to `.env.local`:
```bash
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_WEBHOOK_SECRET=your-secure-32-char-secret-here
BIRD_WEBHOOK_SECRET=bird-webhook-secret
BREVO_WEBHOOK_SECRET=brevo-webhook-secret
VAPI_WEBHOOK_SECRET=vapi-webhook-secret
```

### 2. Configure External Webhooks

#### Bird API Webhooks
In Bird dashboard → Webhooks:
```
POST https://yourdomain.com/api/webhooks/bird
Header: x-bird-signature
Header: x-timestamp
```

#### Brevo Webhooks
In Brevo dashboard → Webhooks:
```
POST https://yourdomain.com/api/webhooks/brevo
Select events: Email Received, Bounce, Complaint
```

#### VAPI Webhooks
In VAPI settings:
```
POST https://yourdomain.com/api/webhooks/vapi
Events: call.ended, transcript.ready
```

### 3. Test Event Dispatch

From anywhere in the app:

```typescript
import { dispatchLeadCreated, dispatchEmailReceived } from '@/lib/events';

// After creating a lead
const eventId = await dispatchLeadCreated(
  workspaceId,
  newLead.id,
  {
    email: newLead.email,
    name: newLead.fullName,
    source: 'api'
  }
);

// When email arrives
const eventId = await dispatchEmailReceived(
  workspaceId,
  lead.id,
  {
    messageId: 'msg_123',
    from: 'customer@example.com',
    subject: 'Question about pricing',
    body: 'I would like to know...'
  }
);
```

### 4. Verify n8n Connection

```bash
# Check health
curl http://localhost:5678/health

# Test webhook
curl -X POST http://localhost:5678/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

---

## Integration Points

### Lead Creation Flow

**Current Code:**
```typescript
// src/app/api/leads/route.ts (or wherever leads are created)
const newLead = await db.lead.create({ data: {...} });
```

**Add Event Dispatch:**
```typescript
import { dispatchLeadCreated } from '@/lib/events';

const newLead = await db.lead.create({ data: {...} });

// Dispatch event (triggers n8n workflow)
await dispatchLeadCreated(
  workspaceId,
  newLead.id,
  {
    email: newLead.email,
    name: newLead.fullName,
    source: newLead.source,
    campaign: newLead.campaign
  }
);
```

**What Happens Next:**
1. Event emitted to eventEmitter
2. Persisted to AuditLog
3. n8n workflow triggered: "lead-created"
4. Welcome email sent
5. Lead added to CRM
6. Calendar invite created

### Email Reception Flow

**Current Code:**
```typescript
// src/app/api/webhooks/bird/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Process email and orchestration
}
```

**Already Implemented in `/api/webhooks/email-received`**
```typescript
// Automatically:
// 1. Validates webhook signature
// 2. Resolves lead by email
// 3. Dispatches EmailReceivedEvent
// 4. Runs sales orchestration
// 5. Triggers n8n "email-received" workflow
```

### Message Sending Flow

**Add to Email Service:**
```typescript
import { dispatchEmailSent } from '@/lib/events';

export async function sendEmail(params: EmailParams) {
  const result = await brevo.send(params);
  
  // Dispatch event
  await dispatchEmailSent(
    params.workspaceId,
    params.leadId,
    {
      emailId: result.messageId,
      to: params.to,
      subject: params.subject,
      templateId: params.templateId
    }
  );
  
  return result;
}
```

### Call Completion Flow

**Add to VAPI Handler:**
```typescript
import { dispatchCallLogged } from '@/lib/events';

export async function handleCallComplete(callData: CallData) {
  const callRecord = await db.callRecord.create({
    data: {
      leadId: callData.leadId,
      duration: callData.durationSec,
      status: callData.outcome,
      // ...
    }
  });
  
  // Dispatch event
  await dispatchCallLogged(
    workspaceId,
    callData.leadId,
    {
      callId: callRecord.id,
      duration: callData.durationSec,
      status: callData.outcome,
      transcriptUrl: callData.transcriptUrl
    }
  );
}
```

---

## Webhook Validation

All incoming webhooks are validated by default:

```typescript
// In webhook handlers
import { validateWebhookSignature } from '@/lib/webhooks';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-bird-signature');
  
  const isValid = validateWebhookSignature(
    body,
    signature,
    'bird',
    process.env.BIRD_WEBHOOK_SECRET || ''
  );
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }
  
  // Process webhook
}
```

---

## Idempotency

Prevent duplicate processing:

```typescript
import { claimWebhookEvent } from '@/lib/webhooks';

export async function POST(request: NextRequest) {
  const externalId = request.headers.get('x-message-id');
  
  // Only process if first time
  const isFirst = await claimWebhookEvent('bird', externalId);
  if (!isFirst) {
    // Already processed - return success (idempotent)
    return NextResponse.json({ ok: true });
  }
  
  // Process the event
}
```

---

## Error Handling & Retries

The event system includes automatic retries:

```typescript
// In n8n-trigger.ts - configured per workflow
const WORKFLOW_MAPPING = {
  'lead-created': {
    workflowId: 'lead-created',
    webhookPath: 'lead-created',
    retryOnFailure: true,
    maxRetries: 3,  // Exponential backoff
  },
  'email-received': {
    workflowId: 'email-received',
    webhookPath: 'email-received',
    retryOnFailure: true,
    maxRetries: 3,
  },
  'call-completed': {
    workflowId: 'call-completed',
    webhookPath: 'call-completed',
    retryOnFailure: true,
    maxRetries: 2,
  },
};
```

Failed events are logged and can be retried manually:

```typescript
import { getWebhookEventStatus } from '@/lib/webhooks';

const status = await getWebhookEventStatus('bird', eventId);
if (status === 'FAILED') {
  // Retry logic or manual intervention
}
```

---

## Monitoring & Debugging

### View Event Log

```bash
# Check recent events
SELECT * FROM "AuditLog"
WHERE "event" IN ('lead:created', 'email:received', 'call:logged')
ORDER BY "createdAt" DESC
LIMIT 50;
```

### Check Webhook Processing

```bash
# See which webhooks have been processed
SELECT source, externalId, status, processedAt
FROM "WebhookEvent"
ORDER BY "processedAt" DESC
LIMIT 100;
```

### Monitor n8n Health

```typescript
import { checkN8nHealth } from '@/lib/events';

setInterval(async () => {
  const isHealthy = await checkN8nHealth();
  if (!isHealthy) {
    console.error('n8n is down!');
    // Send alert
  }
}, 60000); // Check every minute
```

### Test Complete Flow

```bash
# 1. Create a test event
curl -X POST http://localhost:3000/api/webhooks/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "lead:created",
    "workspaceId": "test-ws",
    "leadId": "test-lead",
    "payload": {
      "leadId": "test-lead",
      "email": "test@example.com",
      "name": "Test Lead"
    }
  }'

# 2. Check n8n logs for incoming webhook
# 3. Verify email was sent (check Brevo/Resend)
# 4. Check lead status updated
```

---

## Production Deployment

### Secrets Management

Store all secrets in production environment:
```bash
# In DigitalOcean App Platform or similar
N8N_WEBHOOK_SECRET=xxxxx
BIRD_WEBHOOK_SECRET=xxxxx
BREVO_WEBHOOK_SECRET=xxxxx
# etc.
```

### Error Tracking

Integrate with Sentry or similar:
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  await triggerN8nWorkflow('lead-created', payload);
} catch (error) {
  Sentry.captureException(error);
  throw;
}
```

### Rate Limiting

Add rate limiting for webhook endpoints:
```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});

// In webhook handler
const { success } = await ratelimit.limit(request.ip);
if (!success) {
  return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
}
```

### Logging

Add structured logging:
```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  service: 'webhooks',
  event: 'email-received',
  leadId: lead.id,
  from: email.from,
  duration_ms: Date.now() - start,
}));
```

---

## Troubleshooting

### Webhook Not Triggering

1. Check n8n is running: `curl http://n8n:5678/health`
2. Verify webhook URL in n8n settings
3. Check signature validation isn't failing
4. Look at n8n execution logs

### Event Not Emitting

1. Verify `dispatchLeadCreated()` is being called
2. Check environment variable `N8N_WEBHOOK_URL` is set
3. Look at application logs for errors
4. Check database connectivity

### n8n Workflow Failing

1. Check n8n execution logs
2. Verify email service credentials (Brevo/Resend)
3. Test payload format with n8n test node
4. Check for timeout issues

### Signature Validation Failing

1. Verify secret matches exactly (case-sensitive)
2. Ensure raw body is used (not parsed JSON)
3. Check header name matches provider (x-bird-signature, etc.)
4. Verify algorithm matches (SHA256 for most)

---

## References

- [Phase 5A Overview](./PHASE_5A_WEBHOOKS.md)
- [n8n Workflows Setup](./N8N_WORKFLOWS_SETUP.md)
- [Event Types](../src/lib/events/types.ts)
- [EventEmitter](../src/lib/events/emitter.ts)
- [Webhook Signatures](../src/lib/webhooks/signature.ts)
- [Idempotency](../src/lib/webhooks/idempotency.ts)

