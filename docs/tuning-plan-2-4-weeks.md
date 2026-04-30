# 2-4 Week Real-Data Tuning Plan (Target >=85% Efficiency)

## Target Definition

**Minimum efficiency target: 85%** measured as weighted operational efficiency:

`Efficiency = 0.30*ResponseQuality + 0.20*NextBestActionAccuracy + 0.20*ComplianceScore + 0.15*StageProgression + 0.15*FollowUpEffectiveness`

Where each component is scored 0-100.

## KPI Framework

### Core KPIs (daily)

1. First response under 5 minutes (%).
2. QA-approved outbound messages (%).
3. Correct next-best-action decisions (% judged by reviewer rubric).
4. Compliance incidents (must trend to 0 severe).
5. Stage progression rate (% leads moving forward).

### Revenue KPIs (weekly)

1. Booked call rate.
2. Show-up rate.
3. Close rate.
4. Reactivation conversion rate.
5. No-show recovery conversion rate.

## Week-by-Week Plan

## Week 1 - Instrumentation + Baseline

Objective: establish reliable baseline and safe controls.

Actions:

- Enable full logging for `AgentRun`, `AgentTask`, `ToolCallLog`, `ActivityLog`.
- Start human labeling pipeline with `POST /api/ops/feedback/review`.
- Tag each lead interaction with:
  - route chosen
  - objection type (if any)
  - next best action chosen
  - final send decision
- Run QA sample on 100% of high-intent messages and 30% of others.
- Build baseline report for:
  - response quality
  - action accuracy
  - compliance score
  - conversion proxy metrics

Exit criteria:

- Data completeness >=95%
- Daily dashboard stable
- No severe compliance break

## Week 2 - Prompt + Routing Tuning

Objective: improve decision quality and objection handling.

Actions:

- Refine orchestrator routing thresholds:
  - when to route to closer
  - when to route to objection handler
  - when to pause outreach
- Run A/B on 2 variants for:
  - lead response opener
  - qualification question sequence
  - objection response framing (price/timing/trust)
- Add stricter QA fails for repetitive or generic messages.

Targets:

- NBA accuracy >=80%
- QA pass rate >=85%

## Week 3 - Follow-Up Persistence Optimization

Objective: increase revival and late-stage progression without spam.

Actions:

- Tune follow-up spacing by lead temperature:
  - hot: 6h -> 18h -> 36h
  - warm: 24h -> 48h -> 96h
  - cold: 72h -> 7d -> 14d
- Rotate value angles (case study, ROI estimate, risk-reversal, short audit).
- Enforce anti-repetition check across last 3 touches.
- Deploy no-show recovery sequence with two channel variants.

Targets:

- Follow-up effectiveness >=75%
- Reactivation conversion +15% vs week 1 baseline

## Week 4 - Closing + Call Optimization

Objective: push system above 85% efficiency and stabilize.

Actions:

- Tune closer prompts with real objection patterns from transcripts.
- Add call script variants by segment (SMB local, agency, service business).
- Improve post-call next-step recommendations.
- Roll out winning A/B variants from weeks 2-3.
- Freeze prompt versions and publish `v1.0` playbook.

Targets:

- Weighted efficiency >=85%
- Booked-call rate +20% vs baseline
- Close-rate lift >=10% vs baseline

## Daily Operating Ritual (Mon-Fri)

1. **Morning (15 min):** review critical KPIs + compliance alerts.
   - Endpoint: `GET /api/ops/efficiency?workspaceId=demo_workspace&days=7`
2. **Midday (20 min):** review failed/low-QA conversations.
   - Label at least 30 conversations/day using `POST /api/ops/feedback/review`
3. **Evening (20 min):** apply one small tuning change + log hypothesis.

## Weekly Review Ritual

1. Compare KPI trend vs baseline.
   - Endpoint: `GET /api/ops/training/weekly?workspaceId=demo_workspace&week=<n>`
2. Promote or kill A/B variants.
3. Update routing rules.
4. Update objection library from real transcripts.
5. Publish weekly changelog with measurable impact.

## Acceptance Gate for >=85%

System is accepted only if for 5 consecutive business days:

- weighted efficiency >=85%
- severe compliance incidents = 0
- QA pass >=90% in high-intent flows
- stage progression trend positive

## Rollback Rules

Rollback immediately if any of the following happens:

- severe compliance violation
- QA pass <75% for one day
- booked-call rate drops >20% vs previous 7-day moving average

Rollback strategy:

- revert to previous prompt/routing version
- pause high-risk sequences
- force QA approval on outbound for affected segment
