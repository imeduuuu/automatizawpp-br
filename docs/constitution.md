# Constitution — AutomatizaWPP Sales OS

**Versión**: 2026-05-02  
**Proyecto**: automatizawppBR  
**Propósito**: Automatizar pipeline de ventas B2B con agentes de IA

---

## 1. Schemas de Datos

### Input Schema — Lead Inbound

```json
{
  "lead_input": {
    "type": "object",
    "required": ["email", "name"],
    "properties": {
      "email": { "type": "string" },
      "name": { "type": "string" },
      "phone": { "type": "string" },
      "company": { "type": "string" },
      "source": { "type": "string", "enum": ["email", "whatsapp", "api"] },
      "message": { "type": "string" },
      "timestamp": { "type": "string", "format": "date-time" }
    }
  },
  "example_input": {
    "email": "cliente@empresa.com",
    "name": "João Silva",
    "phone": "+55 11 99999-9999",
    "company": "TechCorp Brasil",
    "source": "email",
    "message": "Preciso de uma solução de automação para vendas",
    "timestamp": "2026-05-02T10:30:00Z"
  }
}
```

### Output Schema — Respuesta Automática

```json
{
  "response_output": {
    "type": "object",
    "required": ["lead_id", "response_text", "channel", "status"],
    "properties": {
      "lead_id": { "type": "string" },
      "response_text": { "type": "string" },
      "channel": { "type": "string", "enum": ["email", "whatsapp"] },
      "status": { "type": "string", "enum": ["qualified", "needs_followup", "escalated"] },
      "temperature": { "type": "number", "minimum": 0, "maximum": 1 },
      "next_followup": { "type": "string", "format": "date-time" },
      "assigned_agent": { "type": "string" }
    }
  },
  "example_output": {
    "lead_id": "lead_001",
    "response_text": "Olá João! Obrigado por se interessar em nossa solução. Gostaria de agendar uma chamada para entender melhor suas necessidades?",
    "channel": "email",
    "status": "qualified",
    "temperature": 0.85,
    "next_followup": "2026-05-04T09:00:00Z",
    "assigned_agent": "response-agent"
  }
}
```

### Database Schema (Prisma)

**Tablas críticas**:
- `Lead`: id, email, name, company, source, temperature, status, createdAt
- `Response`: id, leadId, text, channel, agentId, sentAt
- `FollowUpTask`: id, leadId, scheduledFor, type, status, attempts
- `ActivityLog`: id, leadId, action, agent, result, timestamp

---

## 2. Reglas de Comportamiento

### Tono y Lenguaje
- **Idioma**: Siempre PT-BR (Brasil)
- **Tono**: Profesional, consultivo, empático
- **No hacer**: Spam, pressure, promesas falsas
- **SLA**: Responder dentro de 30 min (durante horario comercial)

### Calificación de Leads
- **Hot (0.8-1.0)**: Empresa grande, intent claro, autoridad para decidir
- **Warm (0.5-0.79)**: Interés genuino, necesita contexto
- **Cold (0-0.49)**: Exploración, no hay urgencia

### Follow-ups
- **Intento 1**: +2 horas (si no respondió)
- **Intento 2**: +1 día (si primer intento falló)
- **Intento 3**: +3 días (último intento antes de escalar)
- **Max intentos**: 3. Después → escalación manual

### Escalación
- Lead no responde 3 intentos → Closer Agent
- Lead solicita presupuesto → Sales Agent
- Lead tiene objeción → Objection Handler Agent

---

## 3. Invariantes Arquitectónicos

### A.N.T. (3 Capas)

**Capa 1 — Agente** (`src/lib/agents/`)
- Orquestador central
- Decide qué tool llamar y cuándo
- Cero lógica de negocio dura

**Capa 2 — Núcleo** (`src/lib/followup/`, `src/lib/qualification/`, etc.)
- Reglas puras: calificación, scoring, scheduling
- Funciones determinísticas sin I/O
- Testeables

**Capa 3 — Tools** (scripts Python en `tools/`)
- Bird Email sender
- Scheduler (crear FollowUpTask)
- Runner (ejecutar tarefas)
- DB operations

### Entregables vs. Intermedios

| Componente | Ubicación | Responsabilidad |
|---|---|---|
| Lead inbound | POST `/api/events/inbound` | Webhook de CRM/Shopify |
| Qualification | `src/lib/qualification/agent.ts` | IA decide temperature |
| Response | `src/lib/followup/router.ts` | Routing a Bird Email |
| Follow-up | `src/lib/followup/scheduler.ts` + `runner.ts` | Cron job cada 5 min |
| Dashboard | `/app/dashboard/page.tsx` | KPIs públicos (PT) |

---

## 4. Endpoints Críticos

| Endpoint | Método | Propósito |
|---|---|---|
| `/api/events/inbound` | POST | Recibir leads nuevos |
| `/api/followups/run` | POST | Ejecutar follow-ups vencidos |
| `/api/ops/efficiency` | GET | KPIs (respuesta time, conversion rate) |
| `/dashboard` | GET | Dashboard público (PT) |

---

## 5. Decisiones Inmutables

1. **DB**: PostgreSQL + Prisma (nunca cambiar a otra)
2. **Email outbound**: Bird Email (nunca Sendgrid o similar)
3. **Agentes**: Claude 3.5 Sonnet via Anthropic SDK (nunca cambiar modelo sin testing)
4. **Lenguaje**: PT-BR siempre (regla 2a)
5. **Retry logic**: Máximo 3 intentos, espaciados exponencialmente
6. **Rate limiting**: 5 req/s per IP (para evitar spam)

---

**Cambios a esta constitución**: Solo con aprobación explícita de Eduardo.
