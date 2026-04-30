# Sales OS - Multi-Agent AI Revenue Platform

Production-ready foundation for a multi-agent AI sales operating system.

This system is designed to:

- respond instantly to inbound leads
- qualify and score opportunities
- handle objections
- schedule persistent follow-up sequences
- support AI-assisted call workflows and transcript intelligence
- coordinate multi-agent collaboration with full lead memory

## Deliverables Implemented

1. Product overview (`docs/architecture.md`)
2. Sales system architecture (`docs/architecture.md`)
3. Agent collaboration design (`src/lib/agents/orchestrator.ts`)
4. CRM + memory architecture (`prisma/schema.prisma`, `src/lib/memory/memory-service.ts`)
5. Call architecture (`src/lib/calls/*`)
6. Database schema with all requested models (`prisma/schema.prisma`)
7. Folder structure (below)
8. Full implementation code in `src/`
9. System prompts for all agents (`src/lib/agents/prompts.ts`, `docs/system-prompts.md`)
10. Example workflows (`docs/workflows.md`)
11. Setup instructions (this README)
12. Real-data tuning plan for 85% target (`docs/tuning-plan-2-4-weeks.md`)

## Tech Stack

- Next.js + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- OpenAI API (structured prompt execution)
- Redis-ready architecture for queue runners
- Twilio-ready call provider abstraction

## Folder Structure

```text
sales-os/
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ agents/run/route.ts
│  │  │  ├─ calls/outbound/route.ts
│  │  │  ├─ calls/transcripts/route.ts
│  │  │  ├─ events/inbound/route.ts
│  │  │  ├─ followups/run/route.ts
│  │  │  └─ leads/
│  │  ├─ agents/page.tsx
│  │  ├─ calls/page.tsx
│  │  ├─ conversations/page.tsx
│  │  ├─ dashboard/page.tsx
│  │  ├─ follow-ups/page.tsx
│  │  ├─ leads/page.tsx
│  │  ├─ leads/[id]/page.tsx
│  │  ├─ login/page.tsx
│  │  └─ settings/page.tsx
│  ├─ components/layout/
│  ├─ components/ui/
│  └─ lib/
│     ├─ agents/
│     ├─ ai/
│     ├─ calls/
│     ├─ channels/
│     ├─ compliance/
│     ├─ decision/
│     ├─ followup/
│     ├─ memory/
│     ├─ orchestration/
│     └─ repositories/
└─ docs/
   ├─ architecture.md
   ├─ system-prompts.md
   └─ workflows.md
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Set PostgreSQL URL and OpenAI key in `.env`.

4. Generate Prisma client and push schema:

```bash
npm run db:generate
npm run db:push
```

5. Run locally:

```bash
npm run dev
```

## Key API Endpoints

- `POST /api/events/inbound` - Trigger orchestrated sales response flow.
- `POST /api/agents/run` - Run a specific agent manually.
- `GET /api/leads` - List leads.
- `GET /api/leads/[leadId]` - Full lead detail package.
- `GET /api/leads/[leadId]/next-action` - Next best action recommendation.
- `POST /api/calls/outbound` - Create AI-assisted outbound call package.
- `POST /api/calls/transcripts` - Ingest transcript + extract sales signals.
- `POST /api/followups/run` - Execute due follow-up tasks.
- `POST /api/ops/feedback/review` - Store human QA labels (training data for Alex).
- `GET /api/ops/training/weekly` - Weekly tuning guidance based on live KPIs.

## n8n Integration Pattern

1. Channel webhook enters n8n.
2. n8n normalizes payload into `{workspaceId, leadId, channel, message}`.
3. n8n calls `POST /api/events/inbound`.
4. Optional cron in n8n calls `POST /api/followups/run` every 10-15 minutes.
5. Telephony callback sends transcript to `POST /api/calls/transcripts`.

## Alex Weekly Data Loop (2-4 Weeks)

Use this loop to improve intelligence with real data:

1. Label real outputs with `POST /api/ops/feedback/review`.
2. Review weekly guidance from `GET /api/ops/training/weekly`.
3. Track global efficiency at `GET /api/ops/efficiency`.
4. Iterate prompts/routing every 48h using labeled data.

ROI_SALES_MODE is now integrated in Orchestrator, Closer, Follow-Up, and Memory.

## DigitalOcean Deployment

Recommended production options:

- **App Platform** for easiest deployment from repo.
- **Droplet + Docker** for full infrastructure control.

Required services:

- Next.js app container
- PostgreSQL database
- Redis (optional but recommended for queues)

Environment variables:

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `VOICE_PROVIDER` (`internal-ai-voice` or `twilio`)
- compliance controls (`MAX_TOUCHES_PER_DAY`, quiet hours)

## Compliance and Safety Controls

- Max touches/day guardrail
- Quiet hours guardrail
- Opt-out hard stop
- QA review stage before high-risk sends
- Tool/action logging

## Replacing Legacy Call Logic

This build is ready to replace previous call logic:

- set `VOICE_PROVIDER=internal-ai-voice` (default)
- use `POST /api/calls/outbound` for call prep + call record
- ingest transcripts in `POST /api/calls/transcripts`

Then phase out legacy call automation once QA validates results.
