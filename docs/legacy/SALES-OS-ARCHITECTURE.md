# Sales OS — Plano Arquitectónico Completo

**Data:** 2026-04-29  
**Status:** Production Ready  
**Target:** Weighted Efficiency ≥85%  
**Stack:** Next.js 15 · PostgreSQL · Redis · n8n · Bird · Anthropic/OpenAI

---

## 1. Visión del Producto

**Sales OS** — Sistema operativo de ventas multi-agente para empresas B2B que necesitan:

- ✅ Respuesta inmediata a leads inbound (< 5 minutos)
- ✅ Calificación automática y scoring de oportunidades  
- ✅ Manejo de objeciones con memoria contextual
- ✅ Seguimiento persistente multi-canal sin spam
- ✅ Inteligencia de llamadas + transcripciones
- ✅ Coordinación de agentes IA con memoria completa

---

## 2. Flujo Principal — Bird Email → Sales OS

```
┌─────────────────────────────────────────┐
│ PASO 1: Bird recibe email               │
│ (Remitente: persona@company.com)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ PASO 2: Bird webhook POST /api/webhooks/bird
│ Payload normalizado:                    │
│ {                                       │
│   channel: "EMAIL",                     │
│   lead: { email, name, company },       │
│   message: "...",                       │
│   threadRef: "conv_123"                 │
│ }                                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ PASO 3: Orchestrator Agent              │
│ • Lee LeadMemory (contexto previo)      │
│ • Compliance check (opt-out, touches)   │
│ • Selecciona Next Best Action (NBA)     │
│ Decision: RESPOND | QUALIFY | CLOSE     │
└──────────────┬──────────────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
   RESPOND  QUALIFY   CLOSE
     │         │         │
┌────▼──┐ ┌────▼──┐ ┌────▼──┐
│LeadRsp│ │QualAgt│ │Closer │
└────┬──┘ └────┬──┘ └────┬──┘
     │         │         │
┌────▼─────────▼─────────▼──┐
│ PASO 4: Agentes especializados
│ • Generate response/question
└────┬──────────────────────┘
     │
┌────▼──────────────────────┐
│ PASO 5: Writer Agent      │
│ • Optimize para email     │
│ • Tone, length, clarity   │
└────┬──────────────────────┘
     │
┌────▼──────────────────────┐
│ PASO 6: Sales QA Agent    │
│ • Score de calidad        │
│ • Gate pre-envío          │
│ • Block si riesgo > 25    │
└────┬──────────────────────┘
     │
┌────▼──────────────────────┐
│ PASO 7: Channel Router    │
│ • Send via Brevo SMTP     │
│ • Track delivery          │
└────┬──────────────────────┘
     │
┌────▼──────────────────────┐
│ PASO 8: Memory Agent      │
│ • Extract context         │
│ • Update LeadMemory       │
│ • Save for next agent     │
└────┬──────────────────────┘
     │
┌────▼──────────────────────┐
│ PASO 9: Follow-Up Timer   │
│ • Hot: 6h, 18h, 36h       │
│ • Warm: 24h, 48h, 96h     │
│ • Cold: 72h, 7d, 14d      │
└───────────────────────────┘
```

---

## 3. 9 Agentes Especializados

| Agente | Responsabilidad | Triggered By | Output |
|--------|-----------------|--------------|--------|
| **Orchestrator** | Logica central de routing | Inbound message | Action (RESPOND, QUALIFY, CLOSE, HOLD) |
| **LeadResponseAgent** | < 5min reply auto | RESPOND action | Email/WhatsApp text |
| **QualificationAgent** | Score + intent + urgency | Inbound reply | Score 0-100, intent level |
| **ObjectionAgent** | Handle PRICE/TIMING/TRUST/FIT | Objection keywords | Reframe + question |
| **CloserAgent** | CTA with 2 clear options | High intent + score | Booking link + calendar |
| **FollowUpAgent** | Smart spacing + value rotation | No conversion in 6h | Sequence of follow-ups |
| **WriterAgent** | Optimize for channel | Pre-send from any agent | Channel-optimized copy |
| **SalesQAAgent** | Quality gate pre-send | Before any message send | Pass/Fail + risk score |
| **MemoryAgent** | Extract context | After each interaction | Updated LeadMemory |

---

## 4. Base de Datos — 22 Modelos Prisma

```
Lead
├── id, email, phone, name, company
├── source (BIRD_EMAIL, BIRD_WA, WEB_FORM)
├── score (0-100)
├── intent (NONE, LOW, MEDIUM, HIGH)
├── urgency (NONE, LOW, MEDIUM, HIGH)
├── stage (AWARENESS, CONSIDERATION, DECISION, WON, LOST)
├── touchesInLastDay
├── optedOut
└── lastMessageAt

Conversation
├── id, leadId
├── channelType (EMAIL, WHATSAPP, SMS)
├── birdConversationId
└── messages: Message[]

Message
├── id, conversationId
├── direction (INBOUND, OUTBOUND)
├── text, channel
├── agentRun_id (quién respondió)
└── timestamp

LeadMemory
├── id, leadId
├── objectionsHandled: ObjectionRecord[]
├── commitments: string[]
├── emotionalSignals: string[]
├── companyContext: { industry, size, ... }
└── lastUpdatedAt

ObjectionRecord
├── id, leadId
├── type (PRICE, TIMING, TRUST, FIT, AUTHORITY)
├── rawText, context
└── agentResponse

AgentRun
├── id, leadId, agent (name)
├── status (PENDING, SUCCESS, FAILED)
├── inputTokens, outputTokens
├── error_message
└── timestamp

ActivityLog
├── id, leadId
├── event (MESSAGE_RECEIVED, AGENT_RUN, NBA_EXECUTED)
├── metadata
└── timestamp

ToolCallLog
├── id, agentRunId, tool
├── input, output
└── timestamp (auditoría)

... (y 13 más: FollowUpTask, CallRecord, Workspace, etc.)
```

---

## 5. Endpoints Clave de API

### 📥 Inbound — Entry Point

```bash
POST /api/events/inbound

# Payload
{
  "channel": "EMAIL",
  "lead": {
    "email": "john@company.com",
    "name": "John Doe",
    "company": "Acme Corp"
  },
  "message": "Hello, I need info about pricing",
  "metadata": {
    "birdConversationId": "conv_123",
    "inReplyTo": "msg_456"
  }
}

# Response
{
  "leadId": "lead_abc123",
  "action": "RESPOND",
  "agentRun": "run_xyz789",
  "messageId": "msg_789",
  "timestamp": "2026-04-29T14:30:00Z"
}
```

### 📊 Eficiencia — KPIs en Tiempo Real

```bash
GET /api/ops/efficiency?days=7&workspaceId=demo_workspace

# Response
{
  "responseQuality": 87.5,      # Target: ≥90
  "nbaAccuracy": 82.3,          # Target: ≥85
  "complianceScore": 100,       # Target: 100
  "stageProgression": 58.2,     # Target: ≥60
  "followUpEffectiveness": 76.1, # Target: ≥80
  "weightedEfficiency": 83.4,   # Target: ≥85
  "trend": "📈 +2.1% vs yesterday"
}
```

### 🎯 NBA — Next Best Action

```bash
GET /api/leads/lead_abc123/next-action

# Response
{
  "action": "CLOSE",
  "score": 87,
  "intent": "HIGH",
  "urgency": "MEDIUM",
  "reason": "Price objection resolved in last message, high engagement",
  "recommendedFollowUp": {
    "delay": "2h",
    "template": "book_demo_cta"
  }
}
```

### 📝 Feedback Label (Training)

```bash
POST /api/ops/feedback/review

{
  "conversationId": "conv_123",
  "label": "QUALITY_HIGH",
  "notes": "Excellent rapport building, good objection handling",
  "agentName": "ObjectionAgent"
}
```

### ⚡ Run Follow-ups (Cron)

```bash
POST /api/followups/run

# Ejecuta todas las follow-up tasks vencidas
# Called every 15min por n8n o Vercel cron
```

---

## 6. KPI Formula — Eficiencia Ponderada

```
Weighted Efficiency = 
  0.30 × Response Quality          (How good are first replies?)
+ 0.20 × NBA Accuracy              (How often we pick right action?)
+ 0.20 × Compliance Score          (Do we break rules?)
+ 0.15 × Stage Progression         (Leads moving toward close?)
+ 0.15 × Follow-Up Effectiveness   (Do follow-ups convert?)

Target: ≥ 85%
Baseline Week 0: 67.65% (improvement needed in all areas)
```

---

## 7. Bird Setup — 3 Pasos

### Step 1: Configure Webhook en Bird Dashboard

```
1. Go to https://dash.bird.gg/webhooks
2. Click "Create Webhook"
3. URL: https://automatizawpp.com/api/webhooks/bird
4. Event: message.received
5. Click "Test" → Sample Payload
6. Verify POST response 200 OK
```

### Step 2: Add API Keys to Environment

```bash
# .env.production
BIRD_API_KEY=sk_live_...         # From dash.bird.gg/settings/api
BIRD_WORKSPACE_ID=ws_...         # From workspace dropdown

# Also add for AI agents
OPENAI_API_KEY=sk-...            # OR
ANTHROPIC_API_KEY=sk-ant-...     # (at least one required)

# Database & Queue
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Step 3: Test End-to-End

```bash
# From local or production
curl -X POST https://automatizawpp.com/api/events/inbound \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${WEBHOOK_SECRET}" \
  -d '{
    "channel": "EMAIL",
    "lead": { "email": "test@company.com" },
    "message": "Tell me about your pricing"
  }'

# Expected response in 5-30 seconds:
# - Email stored in DB
# - LeadResponseAgent replies via Brevo
# - LeadMemory updated
# - FollowUp task scheduled for tomorrow
```

---

## 8. Compliance Rules — Hard Stops

```javascript
// src/lib/compliance/rules.ts

const MAX_TOUCHES_PER_DAY = 5;        // Lead or company
const QUIET_HOURS = {
  start: 21,    // 21:00 = no outbound
  end: 9        // 09:00 = resume
};

// Violated → Immediate escalation
if (lead.optedOut) return BLOCK;
if (touches_today >= 5) return HOLD;
if (current_hour >= 21 || current_hour < 9) return HOLD;

// If any rule broken → Log violation + alert Slack
```

---

## 9. Tuning Loop — Semanas 2-4

### Daily Ritual (Mon-Fri, 09:00-17:00)

```
09:00 — Fetch KPIs
  curl /api/ops/efficiency?days=7
  → Look for: Response Quality, NBA Accuracy trends

13:00 — Label conversations for training
  POST /api/ops/feedback/review (≥30 conversations/day)
  → Identify patterns: what works, what fails

17:00 — Apply 1 tuning change
  • Modify prompt in /src/lib/agents/prompts.ts
  • Adjust threshold in /src/lib/decision/next-best-action.ts
  • Record hypothesis in docs
  • Push to production via GitHub Actions
```

### Success Criteria (5 consecutive days)

- ✅ Weighted Efficiency ≥ 85%
- ✅ Compliance incidents = 0
- ✅ QA pass rate ≥ 90%
- ✅ Stage progression positive trend

---

## 10. Deployment en DigitalOcean

### Opción A: Docker Compose (15 min)

```bash
# SSH en droplet
ssh root@YOUR_DROPLET_IP

# Clone repo
cd /opt && git clone https://github.com/YOUR_ORG/automatizawppBR.git
cd automatizawppBR

# Configure env
cp .env.production.example .env.production
nano .env.production  # edit values

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Initialize database
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed

# Verify
curl http://localhost:3000/health
```

### Opción B: GitHub Actions + CI/CD (Automático)

```yaml
# .github/workflows/deploy.yml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run tests
        run: npm test
      
      - name: Build Docker image
        run: docker build -t sales-os:${{ github.sha }} .
      
      - name: Deploy to DigitalOcean
        run: |
          ssh -i ${{ secrets.SSH_KEY }} root@${{ secrets.DROPLET_IP }} \
            'cd /opt/automatizawppBR && \
             git pull && \
             docker-compose pull && \
             docker-compose up -d && \
             docker-compose exec app npm run db:push'
```

---

## 11. Monitoreo Post-Deploy

```bash
# Real-time logs
docker-compose logs -f app

# Health check
curl http://your-droplet-ip/health → should return 200 OK

# KPI snapshot
curl http://your-droplet-ip/api/ops/efficiency?days=1

# Database admin
docker-compose exec app npm run db:studio

# Process status
docker-compose ps
```

---

## 12. Troubleshooting

### Bird webhook no dispara

```bash
1. Verificar URL reachable:
   curl https://your-domain/api/webhooks/bird
   → Should return 200 or 204

2. Check Bird API key:
   echo $BIRD_API_KEY | head -c 20

3. Check Bird dashboard logs:
   https://dash.bird.gg/logs?filter=webhook

4. Manual test:
   curl -X POST /api/events/inbound \
     -d '{"channel":"EMAIL","lead":{"email":"test@test.com"}}'
```

### Agentes no responden

```bash
1. Check API keys:
   echo $OPENAI_API_KEY | head -c 10
   echo $ANTHROPIC_API_KEY | head -c 10

2. Check agent logs:
   GET /api/agents → recent runs

3. Manual agent run:
   POST /api/agents/run
   { "agentId": "lead-response", "leadId": "lead_123" }
```

### Database connection fails

```bash
1. Verify URL format:
   postgresql://user:password@host:5432/sales_os

2. Test connection:
   psql $DATABASE_URL -c "SELECT 1"

3. Run migrations:
   npm run db:push

4. Check tables exist:
   psql $DATABASE_URL -c "\dt"
```

---

## 13. Roadmap Post-MVP

- [ ] **Week 1:** Database + Core agents + Bird webhook
- [ ] **Week 2:** Follow-up scheduler + n8n integration
- [ ] **Week 3:** Sales QA + advanced memory + objection training
- [ ] **Week 4:** Efficiency tuning → 85% target
- [ ] **Week 5+:** A/B testing, advanced analytics, multi-language

---

## 14. Files & Code Organization

```
src/
├── lib/agents/
│   ├── orchestrator.ts          # Main routing
│   ├── lead-response-agent.ts   # < 5min
│   ├── qualification-agent.ts   # Scoring
│   ├── objection-agent.ts       # PRICE/TIMING/etc
│   ├── closer-agent.ts          # CTA
│   ├── followup-agent.ts        # Spacing
│   ├── writer-agent.ts          # Optimization
│   ├── qa-agent.ts              # Quality gate
│   ├── memory-agent.ts          # Context
│   └── prompts.ts               # All system prompts
│
├── lib/channels/
│   ├── bird-normalizer.ts       # Bird → standard format
│   └── router.ts                # Send to providers
│
├── lib/compliance/rules.ts      # Hard stops
├── lib/decision/next-best-action.ts
├── lib/memory/memory-service.ts
├── lib/followup/sequence-engine.ts
│
└── app/api/
    ├── events/inbound/route.ts         # ★ Entry point
    ├── webhooks/bird/route.ts          # Bird receiver
    ├── leads/[id]/next-action/route.ts
    ├── followups/run/route.ts
    ├── ops/efficiency/route.ts
    └── ops/feedback/review/route.ts

prisma/
└── schema.prisma  # 22 models
```

---

## 15. Documentación Rápida

- **Para setup Bird:** Ver Step 1-3 arriba
- **Para testing:** Ver curl examples en Step 3
- **Para troubleshooting:** Ver sección 12
- **Para deployment:** Ver sección 10
- **Para tuning:** Ver sección 9

---

**Status:** 🟢 Production Ready

Última actualización: 2026-04-29  
Contacto: hola@automatizawpp.com
