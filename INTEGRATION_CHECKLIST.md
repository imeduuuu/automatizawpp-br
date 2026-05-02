# Phase 5C Integration Checklist

## Pre-Deployment Steps

### 1. Environment Configuration
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local` and Vercel
- [ ] Add `N8N_FOLLOWUP_WEBHOOK` to environment
- [ ] Add `N8N_API_KEY` to environment
- [ ] Add `CRON_TOKEN` for scheduler (random secret)

### 2. Database Migrations
- [ ] Verify `LeadScore` table exists
- [ ] Verify `FollowUpTask` table exists
- [ ] Verify `Sequence` table exists
- [ ] Verify `SequenceStep` table exists
- [ ] Check Lead table has: `leadScoreValue`, `qualificationScore`, `assignedSequenceId`

```sql
-- Quick verification
SELECT * FROM information_schema.tables 
WHERE table_name IN ('Lead', 'LeadScore', 'FollowUpTask', 'Sequence', 'SequenceStep');
```

### 3. N8N Workflow Setup
- [ ] Create webhook receiver in n8n for follow-ups
- [ ] Test webhook with POST to `/webhook/followups`
- [ ] Verify template rendering works
- [ ] Test Brevo/Resend email sending
- [ ] Set up error handling + retry logic
- [ ] Document n8n workflow in PHASE_5C_IMPLEMENTATION.md

### 4. Email Event Webhook Setup
- [ ] Configure Brevo webhook → `/api/webhooks/email-events`
- [ ] Configure Resend webhook → `/api/webhooks/email-events`
- [ ] Test webhook with sample OPENED/CLICKED events
- [ ] Verify automation triggers correctly

### 5. Cron Job Setup
**Option A: Vercel Crons**
```
1. Add to vercel.json:
{
  "crons": [{
    "path": "/api/sequences/scheduler",
    "schedule": "*/15 * * * *"
  }]
}
2. Deploy to Vercel
3. Verify in Vercel dashboard → Settings → Crons
```

**Option B: External Service**
```
1. Go to https://www.easycron.com or similar
2. Create cron job:
   - URL: https://automatizawpp.com/api/sequences/scheduler
   - Method: POST
   - Headers: x-cron-token: {your-cron-token}
   - Schedule: Every 15 minutes
3. Test run
```

**Option C: GitHub Actions**
```
1. Create .github/workflows/scheduler.yml
2. Run: on schedule every 15 min
3. Call POST /api/sequences/scheduler
4. Commit to main
```

### 6. API Testing

#### A. Score Calculation
```bash
# Test endpoint exists
curl -X POST http://localhost:3000/api/scoring/calculate \
  -H "Content-Type: application/json" \
  -d '{"leadId": "test-123", "detailed": true}'

# Should return: totalScore, breakdown, isQualified
```

#### B. Automation Rules
```bash
curl -X POST http://localhost:3000/api/automation/trigger \
  -H "Content-Type: application/json" \
  -d '{"leadId": "test-123", "triggerEvent": "SCORE_UPDATED"}'

# Should return: updated lead with new status
```

#### C. AI Qualification
```bash
curl -X POST http://localhost:3000/api/scoring/ai-qualify \
  -H "Content-Type: application/json" \
  -d '{"leadId": "test-123"}'

# Should return: budget, timeline, painPoints, objections, etc.
```

#### D. Scheduler
```bash
curl -X POST http://localhost:3000/api/sequences/scheduler \
  -H "x-cron-token: your-secret-token"

# Should return: processed count, successful, failed
```

### 7. Database Seeding (Optional)

Create default sequences for workspace:

```bash
# In your app or via database UI
POST /api/sequences/init (if you create this endpoint)

Payload:
{
  "workspaceId": "workspace-123"
}
```

Or manually via SQL:
```sql
INSERT INTO "Sequence" (id, "workspaceId", name, description, "triggerType", active, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'workspace-id', 'Sequência de Lead Qualificado', '...', 'LEAD_SCORED', true, now(), now()),
  (gen_random_uuid(), 'workspace-id', 'Sequência de Reaquecimento', '...', 'LEAD_SCORED', true, now(), now());
```

### 8. Monitoring Setup

#### A. Logs
- [ ] Set up log aggregation (Datadog, LogRocket, etc.)
- [ ] Create alerts for automation errors
- [ ] Monitor scheduler cron runs

#### B. Dashboards
- [ ] Create metrics dashboard:
  - Leads scored per day
  - Average score distribution
  - Automation rule triggers
  - Follow-up delivery rate
  - N8N webhook success rate

#### C. Alerts
```
Critical:
- Scheduler failing 3+ times
- N8N webhook unreachable
- ANTHROPIC_API_KEY invalid

Warning:
- Follow-up delivery < 95%
- Email event webhook latency > 5s
```

### 9. Testing in Production

#### Day 1: Dry Run
- [ ] Create test leads manually
- [ ] Verify scoring calculates correctly
- [ ] Check sequence assignment
- [ ] Monitor for errors

#### Day 2-3: Limited Rollout
- [ ] Enable for 10% of leads
- [ ] Monitor conversion metrics
- [ ] Check for automation bugs
- [ ] Review log errors

#### Day 4+: Full Rollout
- [ ] Enable for all leads
- [ ] Monitor KPIs:
  - Lead qualification rate
  - Response rate to follow-ups
  - Demo booking rate
  - Sales cycle shortening

### 10. Documentation

- [ ] Update README with Phase 5C info
- [ ] Document API endpoints
- [ ] Add troubleshooting guide
- [ ] Create runbook for common issues
- [ ] Document n8n workflow setup

## Files Created

**Scoring Engine:**
- `/src/lib/scoring/engine.ts` — Lead scoring calculation
- `/src/lib/scoring/automation-rules.ts` — Rule engine
- `/src/lib/scoring/ai-qualification.ts` — Claude analysis

**Sequences:**
- `/src/lib/sequences/builder.ts` — Sequence templates
- `/src/lib/sequences/scheduler.ts` — Task scheduling

**APIs:**
- `/src/app/api/scoring/calculate/route.ts`
- `/src/app/api/scoring/ai-qualify/route.ts`
- `/src/app/api/automation/trigger/route.ts`
- `/src/app/api/sequences/scheduler/route.ts`
- `/src/app/api/webhooks/email-events/route.ts`

**Modified:**
- `/src/app/api/leads/route.ts` — Added automation hook

**Documentation:**
- `/PHASE_5C_IMPLEMENTATION.md` — Full implementation guide

## Risk Mitigation

### Data Safety
- [ ] Backup database before deployment
- [ ] Test with staging data first
- [ ] Monitor failed automations

### Performance
- [ ] Scheduler processes max 100 follow-ups per run
- [ ] Lead scoring is async (non-blocking)
- [ ] AI qualification limited to 1 per lead at a time

### Rollback Plan
If critical issues occur:
1. Disable cron jobs
2. Revert lead creation hook (remove automation trigger)
3. Keep all data intact (no data loss)
4. Restore from git if needed

## Success Metrics (30 days)

- [ ] 80%+ leads scored within 1 hour of creation
- [ ] 85%+ follow-ups delivered on schedule
- [ ] 20%+ improvement in response rate vs manual
- [ ] 15%+ improvement in demo booking rate
- [ ] Zero critical automation errors

