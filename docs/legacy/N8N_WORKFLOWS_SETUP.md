# n8n Workflows Setup Guide (Phase 5A)

## Overview

This guide explains how to set up n8n webhooks that integrate with the AutomatizaWPP event system.

## Workflows to Create

### 1. Lead Created Workflow

**Trigger:** Webhook at `/webhook/lead-created`

**Purpose:** Send welcome email when a new lead is created

**Steps:**
1. Webhook trigger (Listen on /webhook/lead-created)
2. Extract lead data (leadId, email, name)
3. Send welcome email via Brevo/Resend
4. Log lead creation in CRM
5. Create calendar invite for intro call
6. Return success response

**Webhook Signature:**
```json
{
  "eventType": "lead-created",
  "eventId": "evt_1714558200000_abc123",
  "timestamp": "2026-05-01T10:30:00Z",
  "workspaceId": "ws_123",
  "leadId": "lead_456",
  "data": {
    "leadId": "lead_456",
    "email": "customer@example.com",
    "name": "John Doe",
    "source": "website",
    "campaign": "summer_2026"
  }
}
```

**Implementation Example:**

```
Webhook Node:
- Path: /lead-created
- Method: POST
- Response Mode: After Input
- Headers: Check X-N8N-SIGNATURE

Email Node (Brevo):
- To: {{ $json.data.email }}
- Subject: "Welcome to AutomatizaWPP"
- Template: welcome_email

Update Lead Node:
- Lead ID: {{ $json.data.leadId }}
- Status: SALES_READY
- LastContactAt: Now

Return Response:
{
  "ok": true,
  "leadId": "{{ $json.data.leadId }}",
  "emailSent": true
}
```

---

### 2. Email Received Workflow

**Trigger:** Webhook at `/webhook/email-received`

**Purpose:** Process inbound customer emails

**Steps:**
1. Webhook trigger (Listen on /webhook/email-received)
2. Extract email data (from, subject, body, leadId)
3. Check if it's a reply or new thread
4. Queue auto-reply if applicable
5. Update conversation thread
6. Log email in lead history
7. Return success

**Webhook Signature:**
```json
{
  "eventType": "email-received",
  "eventId": "evt_1714558200001_def456",
  "timestamp": "2026-05-01T10:31:00Z",
  "workspaceId": "ws_123",
  "leadId": "lead_456",
  "data": {
    "leadId": "lead_456",
    "messageId": "msg_bird_12345",
    "from": "customer@example.com",
    "subject": "Question about pricing",
    "body": "I'm interested in learning more about your enterprise plan..."
  }
}
```

---

### 3. Call Completed Workflow

**Trigger:** Webhook at `/webhook/call-completed`

**Purpose:** Log call details and update lead status

**Steps:**
1. Webhook trigger (Listen on /webhook/call-completed)
2. Extract call data (leadId, duration, status, transcript)
3. Update lead call log
4. Update lead status based on outcome (QUALIFIED, FOLLOW_UP_REQUIRED, etc.)
5. Send follow-up email if needed
6. Create follow-up task
7. Return success

**Webhook Signature:**
```json
{
  "eventType": "call-completed",
  "eventId": "evt_1714558200002_ghi789",
  "timestamp": "2026-05-01T11:00:00Z",
  "workspaceId": "ws_123",
  "leadId": "lead_456",
  "data": {
    "leadId": "lead_456",
    "callId": "call_vapi_789",
    "duration": 1200,
    "status": "INTERESTED",
    "transcriptUrl": "https://..."
  }
}
```

---

## Setting Up Webhook Authentication

### n8n Side (Receiving from Next.js)

1. Get your n8n webhook secret (from .env)
2. In webhook node, add header validation:
   ```
   Header: x-n8n-signature
   Value: HMAC-SHA256 signature
   ```

3. To verify signature in n8n, add a Function node:
   ```javascript
   const crypto = require('crypto');
   const secret = process.env.N8N_WEBHOOK_SECRET;
   const signature = $request.header['x-n8n-signature'];
   const payload = JSON.stringify($json);
   
   const expectedSig = crypto
     .createHmac('sha256', secret)
     .update(payload)
     .digest('hex');
   
   return signature === expectedSig;
   ```

### Next.js Side (Sending to n8n)

1. Get your n8n webhook URL: `http://n8n.example.com/webhook/lead-created`
2. Set N8N_WEBHOOK_SECRET in .env
3. The app will automatically sign requests with HMAC-SHA256

---

## Webhook Testing

### Test from Command Line

```bash
# 1. Generate test signature
SECRET="your-n8n-webhook-secret"
PAYLOAD='{"eventType":"lead-created","leadId":"test-123"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# 2. Send to your n8n webhook
curl -X POST http://localhost:5678/webhook/lead-created \
  -H "Content-Type: application/json" \
  -H "x-n8n-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### Test from JavaScript

```javascript
const crypto = require('crypto');

async function testN8nWebhook() {
  const secret = 'your-n8n-webhook-secret';
  const payload = {
    eventType: 'lead-created',
    leadId: 'test-123',
    data: { email: 'test@example.com' }
  };
  
  const payloadStr = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex');
  
  const response = await fetch('http://localhost:5678/webhook/lead-created', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-n8n-signature': signature
    },
    body: payloadStr
  });
  
  return response.json();
}
```

---

## Workflow Management

### Export Workflow

```bash
# Get workflow JSON from n8n API
curl -X GET http://localhost:5678/api/v1/workflows/1 \
  -H "X-N8N-API-KEY: your-api-key" > workflow.json
```

### Import to Git

Store workflows in version control:
```
/n8n-workflows/
  ├── lead-created.json
  ├── email-received.json
  └── call-completed.json
```

### Deploy with Docker

```yaml
# docker-compose.yml
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_ADMIN_PASSWORD}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      - DB_POSTGRESDB_DATABASE=n8n
    ports:
      - "5678:5678"
    volumes:
      - ./n8n-workflows:/home/node/.n8n/workflows
    depends_on:
      - postgres
```

---

## Error Handling

### Retry Logic

The app will retry failed n8n webhooks with exponential backoff:
- Lead Created: up to 3 retries
- Email Received: up to 3 retries
- Call Completed: up to 2 retries

Delays: 1s, 2s, 4s, 8s...

### Monitor Webhook Health

```bash
# From Node.js
import { checkN8nHealth } from '@/lib/events';

const isHealthy = await checkN8nHealth();
if (!isHealthy) {
  console.error('n8n is unreachable!');
  // Alert ops team
}
```

---

## Production Checklist

- [ ] Generate strong webhook secrets (min 32 chars)
- [ ] Store secrets in .env (never in code)
- [ ] Set N8N_WEBHOOK_URL to production n8n instance
- [ ] Test all 3 workflows end-to-end
- [ ] Enable n8n basic auth
- [ ] Set up n8n database backup
- [ ] Configure n8n error handling/notifications
- [ ] Monitor webhook request/response times
- [ ] Log all webhook calls for debugging
- [ ] Set up alerting for failed webhooks
- [ ] Document custom nodes/logic in workflows
- [ ] Train team on n8n workflow management

---

## References

- [n8n Webhook Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n API Docs](https://docs.n8n.io/api/)
- [Event System](./PHASE_5A_WEBHOOKS.md)
- [Signature Validation](../src/lib/webhooks/signature.ts)
