# Phase 5A Deployment Checklist

## Pre-Deployment Verification

### Code Quality
- [x] All files created and in correct locations
- [x] TypeScript compilation passes (no errors in Phase 5A code)
- [x] Imports are correct and resolvable
- [x] No console warnings or deprecations
- [x] Code follows existing project patterns (PT language, async/await, error handling)

### Architecture
- [x] Event types cover all lead activities
- [x] EventEmitter uses singleton pattern
- [x] Webhook handlers validate signatures
- [x] Idempotency prevents duplicate processing
- [x] Retry logic with exponential backoff configured

### Documentation
- [x] PHASE_5A_WEBHOOKS.md - complete overview
- [x] N8N_WORKFLOWS_SETUP.md - implementation guide
- [x] PHASE_5A_INTEGRATION.md - integration checklist
- [x] PHASE_5A_IMPLEMENTATION_SUMMARY.md - detailed summary
- [x] Code comments in PT/ES (not English)

### Testing
- [x] Test files created for signatures
- [x] Test files created for events
- [x] Test structure matches Jest/Playwright setup

## Deployment Steps

### Step 1: Configure Environment Variables
```bash
# In DigitalOcean App Platform Settings or .env.local:
N8N_WEBHOOK_URL=http://n8n.yourdomain.com/webhook
N8N_WEBHOOK_SECRET=generate-strong-32-char-secret
N8N_WEBHOOK_AUTH=  # Optional
BIRD_WEBHOOK_SECRET=get-from-bird-dashboard
BREVO_WEBHOOK_SECRET=get-from-brevo-dashboard
VAPI_WEBHOOK_SECRET=get-from-vapi-dashboard
STRIPE_WEBHOOK_SECRET=get-from-stripe-dashboard
```

### Step 2: Push Code to Repository
```bash
git add src/lib/events/
git add src/lib/webhooks/
git add src/app/api/webhooks/events/
git add src/app/api/webhooks/n8n/
git add src/app/api/webhooks/email-received/
git add tests/webhooks/
git add docs/PHASE_5A_*.md
git add PHASE_5A_*.md
git add .env.example  # Updated

git commit -m "Phase 5A: Webhooks & Event Triggers implementation

- Event system with 12+ event types
- EventEmitter with handler registration
- n8n workflow integration with retry logic
- Multi-provider webhook signature validation
- Idempotent webhook processing
- Comprehensive documentation
"

git push origin main
```

### Step 3: Deploy to DigitalOcean
```bash
# Option 1: Via CLI
vercel deploy --prod

# Option 2: Via UI
- Push to GitHub/GitLab
- DigitalOcean auto-deploys from main
```

### Step 4: Set Up n8n Workflows

Create 3 workflows in n8n instance:

**Workflow 1: lead-created**
- Webhook trigger at /webhook/lead-created
- Actions: Send welcome email, update CRM, create calendar invite
- Test with curl command in N8N_WORKFLOWS_SETUP.md

**Workflow 2: email-received**
- Webhook trigger at /webhook/email-received
- Actions: Process email, send auto-reply, update conversation

**Workflow 3: call-logged**
- Webhook trigger at /webhook/call-logged
- Actions: Log call details, update lead status, create follow-up

### Step 5: Configure Webhook Endpoints

#### Bird API
1. Go to Bird Dashboard → Settings → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/email-received`
3. Add secret from N8N_WEBHOOK_SECRET
4. Test webhook

#### Brevo
1. Go to Brevo → Settings → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/brevo`
3. Select events: Email Received, Bounce, Complaint
4. Add signature

#### VAPI
1. Go to VAPI → Settings → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/vapi`
3. Events: call.ended, transcript.ready
4. Add signature

### Step 6: Test Complete Flow

```bash
# 1. Test event creation
curl -X POST https://yourdomain.com/api/webhooks/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "lead:created",
    "workspaceId": "test-ws",
    "leadId": "test-lead",
    "payload": {
      "leadId": "test-lead",
      "email": "test@example.com",
      "name": "Test User"
    }
  }'

# Should return: { ok: true, eventId: "evt_...", type: "lead:created" }

# 2. Check n8n logs for incoming webhook
# 3. Verify lead created in database
# 4. Check email sent (if configured)
# 5. Verify lead status updated
```

### Step 7: Integrate with Existing APIs

Update the following files to call dispatch functions:

**File: src/app/api/leads/route.ts** (or lead creation endpoint)
```typescript
import { dispatchLeadCreated } from '@/lib/events/dispatch';

// After creating lead
const newLead = await db.lead.create({ ... });

await dispatchLeadCreated(workspaceId, newLead.id, {
  email: newLead.email,
  name: newLead.fullName,
  source: newLead.source,
  campaign: newLead.campaign
});
```

**File: src/lib/email/send.ts** (or email service)
```typescript
import { dispatchEmailSent } from '@/lib/events/dispatch';

// After sending email
const result = await brevo.send(params);

await dispatchEmailSent(workspaceId, leadId, {
  emailId: result.messageId,
  to: params.to,
  subject: params.subject,
  templateId: params.templateId
});
```

**File: src/app/api/calls/route.ts** (or call handler)
```typescript
import { dispatchCallLogged } from '@/lib/events/dispatch';

// After call completes
const callRecord = await db.callRecord.create({ ... });

await dispatchCallLogged(workspaceId, leadId, {
  callId: callRecord.id,
  duration: callData.durationSec,
  status: callData.outcome,
  transcriptUrl: callData.transcriptUrl
});
```

### Step 8: Monitor & Verify

```bash
# Check event logs
SELECT * FROM "AuditLog"
WHERE "event" LIKE '%:created' OR "event" LIKE '%:received'
ORDER BY "createdAt" DESC
LIMIT 50;

# Check webhook processing
SELECT * FROM "WebhookEvent"
WHERE source IN ('bird', 'brevo', 'vapi')
ORDER BY "processedAt" DESC
LIMIT 50;

# Test n8n health
curl https://yourdomain.com/api/webhooks/events
# Should return: { ok: true, service: "AutomatizaWPP Event Bus" }
```

## Post-Deployment Checklist

- [ ] All 3 n8n workflows created and active
- [ ] All webhook endpoints configured in providers
- [ ] Test event successfully triggers n8n workflow
- [ ] Lead created event triggers welcome email
- [ ] Email received event triggers sales orchestration
- [ ] Call log event updates lead status
- [ ] Event logs appear in AuditLog table
- [ ] WebhookEvent table tracking successful claims
- [ ] No errors in application logs
- [ ] Team trained on event-driven flow
- [ ] Monitoring/alerting set up for webhook failures
- [ ] Documentation added to team wiki

## Rollback Plan

If issues occur post-deployment:

1. **Event System Issues**
   ```bash
   # Disable n8n triggers (temporarily)
   # Edit: src/lib/events/emitter.ts
   # Comment out: this.on(EventType.LEAD_CREATED, ...)
   # Redeploy
   ```

2. **Webhook Signature Failures**
   ```bash
   # Check secrets match exactly
   # Verify algorithm (SHA256)
   # Test signature generation manually
   ```

3. **n8n Unreachable**
   ```bash
   # Check n8n health: curl http://n8n:5678/health
   # Check network connectivity
   # Verify N8N_WEBHOOK_URL environment variable
   ```

4. **Complete Rollback**
   ```bash
   # Revert to previous commit
   git revert [commit-hash]
   git push origin main
   # DigitalOcean auto-redeploys
   ```

## Performance Monitoring

### Expected Response Times
- Event emission: <1ms (async)
- Webhook signature validation: ~5ms
- Idempotency check: ~10ms
- n8n webhook call: 100-500ms
- Total webhook processing: 100-600ms

### Metrics to Track
- Event emission rate (events/minute)
- n8n webhook latency (ms)
- Failed webhook retries
- Idempotent claim hit rate
- Database query times

## Success Criteria

Phase 5A is successfully deployed when:

✅ Events emit without errors
✅ n8n workflows receive events within 1 second
✅ All 3 workflows execute successfully
✅ Lead status updates after events
✅ No duplicate event processing
✅ Signature validation passes for all providers
✅ Event history available in logs
✅ Team can create new workflows in n8n
✅ Zero production errors related to events
✅ Documentation reviewed by team

## Next Phases

- **Phase 5B**: Event filtering & subscriptions
- **Phase 5C**: Event replay & debugging tools
- **Phase 5D**: Advanced webhook retry policies
- **Phase 5E**: Event aggregation for batch processing
