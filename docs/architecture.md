# Product Overview

Sales OS is a multi-agent AI sales platform designed to convert inbound and outbound demand into booked calls and closed deals. It combines an AI-native CRM, channel router, sequence engine, call-assist architecture, and a central orchestration layer.

## System Architecture

### Core Layers

1. **Channel Ingestion Layer**
   - API endpoint: `POST /api/events/inbound`
   - Supports: web chat, email, SMS, WhatsApp, Instagram DM, Facebook Messenger, voice events.

2. **Orchestration Layer**
   - `OrchestratorAgent` selects next best action.
   - Applies compliance guardrails before any outbound action.
   - Prevents duplicate or conflicting contact.

3. **Specialized Agent Layer**
   - Lead Response, Qualification, Memory, Objection, Follow-Up, Call Assist, Closer, Sales QA, Writer.
   - Agent prompts enforce role boundaries and collaboration rules.

4. **Decision + Compliance Layer**
   - Next best action logic in `src/lib/decision/next-best-action.ts`.
   - Consent/frequency/quiet-hours checks in `src/lib/compliance/rules.ts`.

5. **CRM + Memory Layer**
   - PostgreSQL + Prisma stores full lead lifecycle.
   - Lead memory (`LeadMemory`) is refreshed after interactions.
   - Timeline data available in lead detail page and API.

6. **Execution Layer**
   - Follow-up scheduler creates queued tasks.
   - Channel router dispatches outbound messages.
   - Call orchestrator handles AI-assisted call planning and transcript analysis.

## Agent Collaboration Design

1. **Orchestrator** reads memory + compliance + lead state.
2. Routes to **primary specialist** (response, qualification, objection, closer).
3. **Writer Agent** polishes final channel output.
4. **Sales QA Agent** validates risk, tone, and quality.
5. Memory and task logs are persisted for future runs.

## CRM and Memory Architecture

Each lead stores:

- status, score, intent, urgency, buying stage
- source attribution, product interest, close probability
- objections, emotional tone, summaries, next action
- follow-up schedule, call records, transcript intelligence

Memory is channel-agnostic and reused in all future outputs.

## Call Architecture

The call stack is provider-abstracted:

- `VoiceProvider` interface (Twilio-ready)
- internal AI voice provider default (`internal-ai-voice`)
- call script generation via `CallAssistAgent`
- transcript ingestion via `POST /api/calls/transcripts`
- objection extraction + next action update on each transcript

This supports replacing older call tooling and running this platform as the primary call system.

## DigitalOcean + n8n Deployment Pattern

Recommended runtime:

- Host this Next.js app on DigitalOcean App Platform or Droplet (Docker)
- PostgreSQL managed database
- Redis for queue execution
- n8n receives events and can trigger `POST /api/events/inbound`

n8n integration options:

1. Inbound webhook (Meta/WhatsApp/form) -> normalize -> call Sales OS inbound API
2. Cron in n8n -> call `POST /api/followups/run`
3. Call provider webhooks -> `POST /api/calls/transcripts`
