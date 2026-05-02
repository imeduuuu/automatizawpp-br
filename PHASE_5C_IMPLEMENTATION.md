# Phase 5C — Complete Automation Implementation

**Status:** IMPLEMENTED  
**Date:** 2026-05-01  
**Version:** 1.0

## Overview

Phase 5C implements full lead scoring, follow-up sequences, and AI-powered automation for AutomatizaWPP. System automatically qualifies leads, schedules emails, and triggers sales actions.

---

## Architecture

### 1. Lead Scoring Engine (`src/lib/scoring/engine.ts`)

**Components:**
- `scoreLeadComplete()` — Full scoring calculation with breakdown
- `quickScoreLead()` — Fast scoring for webhooks
- `getQualificationStatus()` — Returns COLD/WARM/HOT status

**Scoring Rules (0-100):**

| Category | Points | Conditions |
|----------|--------|-----------|
| **Form** | 0-50 | Budget (20), Timeline (20), Company size (10) |
| **Engagement** | 0-25 | Email opens (2-10), Clicks (5-15) |
| **Contact** | 0-25 | Calls (10-20), Email responses (8), Second contact (5) |
| **Signals** | 0-25 | Intent (15), Urgency (15), Buying stage (0-25) |

**Qualification Thresholds:**
- **HOT (≥80):** Immediate sales → `SALES_READY` status
- **WARM (60-79):** Qualified → Sequence assignment
- **COLD (<60):** Nurture → Win-back sequence

---

### 2. Follow-Up Sequences (`src/lib/sequences/`)

**Builders:** `src/lib/sequences/builder.ts`

**Default Sequences:**

#### A. QUALIFIED_LEAD (Score ≥60)
- Day 1: First contact + value prop
- Day 3: Case study + social proof
- Day 7: Final offer with incentive

#### B. DEMO_BOOKED
- Immediate: Demo confirmation
- 24h before: Demo reminder

#### C. COLD_LEAD (No response in 7 days)
- Day 7: Win-back email
- Day 14: Final attempt

#### D. OBJECTION_PRICE
- Immediate: ROI response email

**Scheduler:** `src/lib/sequences/scheduler.ts`
- `findPendingFollowUps()` — Find overdue tasks
- `dispatchFollowUp()` — Send via n8n webhook
- `processScheduledFollowUps()` — Batch processing
- `scheduleSequenceFollowUps()` — Create tasks for lead

---

### 3. Automation Rules Engine (`src/lib/scoring/automation-rules.ts`)

**5 Core Rules:**

1. **Rule: High Qualification (Score >80)**
   - Action: Update status to `SALES_READY`
   - Effect: Team receives lead immediately

2. **Rule: Engagement Demo (Email opened + clicked)**
   - Action: Auto-book 48h demo call
   - Effect: Update status to `CALL_SCHEDULED`

3. **Rule: No Response 7 Days**
   - Action: Update status to `COLD`
   - Effect: Trigger win-back sequence

4. **Rule: Budget Confirmed**
   - Action: Update status to `QUALIFIED`
   - Effect: Trigger proposal sequence

5. **Rule: Multiple Objections (≥3)**
   - Action: Escalate manually
   - Effect: Flag for sales review

---

### 4. AI Lead Qualification (`src/lib/scoring/ai-qualification.ts`)

**Claude Analysis:**
- Extract budget, timeline, pain points, objections
- Generate personalized follow-up messages
- Respond to objections intelligently

**Functions:**
- `qualifyLeadWithAI()` — Full analysis + insights
- `generatePersonalizedFollowUp()` — Custom message generation
- `generateObjectionResponse()` — Smart objection handling

---

## API Endpoints

### Scoring
**POST `/api/scoring/calculate`**
```json
{
  "leadId": "string",
  "detailed": true
}
```
Response:
```json
{
  "totalScore": 75,
  "isQualified": true,
  "formScore": 20,
  "engagementScore": 15,
  "contactScore": 20,
  "signalScore": 20,
  "reason": "Formulário: 20pts | Engagement: 15pts | Contatos: 20pts | Sinais: 20pts"
}
```

### Automation
**POST `/api/automation/trigger`**
```json
{
  "leadId": "string",
  "triggerEvent": "SCORE_UPDATED" | "EMAIL_OPENED" | "CALL_COMPLETED"
}
```

### AI Qualification
**POST `/api/scoring/ai-qualify`**
```json
{
  "leadId": "string"
}
```
Response:
```json
{
  "budget": "R$ 5.000-10.000/mês",
  "timeline": "URGENT",
  "painPoints": ["Resposta lenta", "Lead leakage"],
  "objections": ["Preço alto"],
  "score": 85,
  "recommendation": "Enviar proposta",
  "followUpMessage": "Oi João, baseado em nossa conversa..."
}
```

### Scheduler
**POST `/api/sequences/scheduler`**

Cron job → processes pending follow-ups every 15 minutes.

Response:
```json
{
  "success": true,
  "processed": 25,
  "successful": 23,
  "failed": 2
}
```

---

## Webhook Integration

### Email Events (`/api/webhooks/email-events`)

Receives Brevo/Resend events:
```json
{
  "leadId": "string",
  "email": "lead@company.com",
  "eventType": "OPENED" | "CLICKED" | "BOUNCED",
  "timestamp": "2026-05-01T10:00:00Z"
}
```

Triggers automation on OPENED/CLICKED.

---

## Database Updates

### New Tables
- `LeadScore` — Historical scores (already existed)
- `FollowUpTask` — Scheduled follow-ups (already existed)
- `Sequence` — Templates for sequences (already existed)
- `SequenceStep` — Individual steps (already existed)

### Modified Tables
- `Lead` — Added: `leadScoreValue`, `qualificationScore`, `assignedSequenceId`
- `ActivityLog` — Track scoring + automation events

---

## N8N Integration

### Required Webhook

**Environment:** `N8N_FOLLOWUP_WEBHOOK`

Format:
```
POST {N8N_FOLLOWUP_WEBHOOK}
Authorization: Bearer {N8N_API_KEY}

{
  "followUpTaskId": "id",
  "leadId": "id",
  "channel": "EMAIL",
  "leadEmail": "lead@company.com",
  "template": "follow_up_day3",
  "objective": "Case study + social proof"
}
```

N8N workflow:
1. Receive follow-up task
2. Render email template
3. Send via Brevo/Resend
4. Update task status
5. Log event

---

## Implementation Flow

### 1. Lead Creation
```
POST /api/leads
  ↓
Create lead (status: NEW)
  ↓
Async: triggerAutomation()
  ↓
scoreLeadComplete()
  ↓
Apply automation rules
  ↓
Assign applicable sequence
  ↓
Schedule follow-up tasks
```

### 2. Email Event
```
POST /api/webhooks/email-events
  ↓
Record event
  ↓
If OPENED/CLICKED → triggerAutomation()
  ↓
Apply engagement rules
  ↓
Update lead status
```

### 3. Scheduled Follow-up
```
CRON: POST /api/sequences/scheduler (every 15 min)
  ↓
Find pending follow-ups (scheduledFor <= now)
  ↓
For each:
  - Prepare n8n payload
  - POST to N8N_FOLLOWUP_WEBHOOK
  - Update status: SENT
  - Log activity
```

---

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-...
N8N_FOLLOWUP_WEBHOOK=https://n8n.yourserver.com/webhook/followups
N8N_API_KEY=n8n_...
CRON_TOKEN=secret_token_for_cron

# Database (already configured)
DATABASE_URL=postgresql://...
```

### Cron Jobs

**Option 1: Vercel Crons**

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sequences/scheduler",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Option 2: External Service (EasyCron, Setcronjob)**

```
POST https://automatizawpp.com/api/sequences/scheduler
Header: x-cron-token=secret_token_for_cron
Every 15 minutes
```

---

## Testing

### 1. Test Lead Scoring

```bash
curl -X POST http://localhost:3000/api/scoring/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-lead-123",
    "detailed": true
  }'
```

### 2. Test Automation Rules

```bash
curl -X POST http://localhost:3000/api/automation/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-lead-123",
    "triggerEvent": "SCORE_UPDATED"
  }'
```

### 3. Test AI Qualification

```bash
curl -X POST http://localhost:3000/api/scoring/ai-qualify \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-lead-123"
  }'
```

### 4. Test Scheduler

```bash
curl -X POST http://localhost:3000/api/sequences/scheduler \
  -H "x-cron-token: your-cron-token"
```

---

## File Structure

```
src/lib/scoring/
├── engine.ts                 # Scoring calculation
├── automation-rules.ts       # Rule engine + triggers
└── ai-qualification.ts       # Claude analysis

src/lib/sequences/
├── builder.ts               # Sequence templates + creation
└── scheduler.ts             # Task scheduling + dispatching

src/app/api/scoring/
├── calculate/route.ts       # POST /api/scoring/calculate
└── ai-qualify/route.ts      # POST /api/scoring/ai-qualify

src/app/api/automation/
└── trigger/route.ts         # POST /api/automation/trigger

src/app/api/sequences/
└── scheduler/route.ts       # POST /api/sequences/scheduler

src/app/api/webhooks/
└── email-events/route.ts    # POST /api/webhooks/email-events

src/app/api/leads/
└── route.ts                 # MODIFIED: Added automation hook
```

---

## Monitoring & Debugging

### Check Lead Score History
```sql
SELECT * FROM "LeadScore"
WHERE "leadId" = 'xxx'
ORDER BY "createdAt" DESC;
```

### Check Pending Follow-ups
```sql
SELECT * FROM "FollowUpTask"
WHERE status = 'QUEUED'
AND "scheduledFor" <= NOW()
ORDER BY "scheduledFor" ASC;
```

### Check Recent Activity
```sql
SELECT * FROM "ActivityLog"
WHERE type IN ('SCORE_UPDATED', 'FOLLOW_UP_SENT', 'STATUS_CHANGED')
ORDER BY "createdAt" DESC
LIMIT 50;
```

---

## Future Enhancements

1. **Lead Scoring ML** — Train model on historical conversions
2. **Predictive Churn** — Identify at-risk customers before they leave
3. **Dynamic Sequences** — AI-generated sequences per lead profile
4. **A/B Testing** — Template variations + automatic winner selection
5. **Predictive Timing** — Send emails at optimal open time per lead
6. **Advanced Analytics** — ROI per automation rule, sequence performance

---

## Support

For issues:
1. Check logs: `tail -f /var/log/automatizawpp.log`
2. Review LeadScore history
3. Check FollowUpTask queue
4. Verify N8N webhook connectivity
5. Validate ANTHROPIC_API_KEY

