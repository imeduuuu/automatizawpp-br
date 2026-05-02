# Phase 5D: Monitoring & Observability

## Visão Geral

Phase 5D implementa um sistema completo de monitoramento, observabilidade e alertas para a plataforma AutomatizaWPP. 

**Componentes implementados:**
1. ✅ Event Logging System
2. ✅ Metrics Tracking  
3. ✅ Health Checks
4. ✅ System Alerts
5. ✅ Monitoring Dashboard
6. ✅ Logs Viewer
7. ✅ Cron Jobs para Health Checks e Snapshots

---

## 1. Database Schema

Três novas tabelas foram adicionadas ao schema Prisma:

### Event (Logging de eventos)
```prisma
model Event {
  id            String         @id @default(cuid())
  workspaceId   String?
  userId        String?
  leadId        String?
  eventType     String         // "lead.created", "email.sent", etc
  source        EventSource    // API, WEBHOOK, CRON, AGENT, SYSTEM
  severity      EventSeverity  // INFO, WARNING, ERROR, CRITICAL
  title         String
  description   String?
  metadata      Json?
  createdAt     DateTime       @default(now())
}
```

### HealthCheck (Status dos componentes)
```prisma
model HealthCheck {
  id            String        @id @default(cuid())
  component     String        // "database", "resend_email", "n8n_webhook", "vapi_calls"
  status        HealthStatus  // HEALTHY, DEGRADED, UNHEALTHY
  lastCheckedAt DateTime
  lastErrorAt   DateTime?
  errorMessage  String?
  responseTimeMs Int?
}
```

### SystemAlert (Alertas críticos)
```prisma
model SystemAlert {
  id             String       @id @default(cuid())
  workspaceId    String?
  title          String
  description    String
  alertType      String       // "service_down", "high_error_rate", "quota_exceeded"
  status         AlertStatus  // ACTIVE, ACKNOWLEDGED, RESOLVED
  severity       EventSeverity
  component      String?
}
```

### MetricsSnapshot (Snapshot diário)
```prisma
model MetricsSnapshot {
  id                String   @id @default(cuid())
  workspaceId       String
  date              DateTime @db.Date
  
  // Lead metrics
  leadsCreated      Int
  leadsQualified    Int
  leadsUnqualified  Int
  
  // Email metrics
  emailsSent        Int
  emailsOpened      Int
  emailsClicked     Int
  emailsBounced     Int
  
  // Call metrics
  callsLogged       Int
  callsDuration     Int
  callsConnected    Int
  
  // Revenue
  conversionRate    Float
  mrrActive         Float
  
  // Performance
  avgApiResponseMs  Int
  webhookErrors     Int
}
```

---

## 2. Logging System (`src/lib/logging/index.ts`)

### Usar o sistema de logging:

```typescript
import { logEvent, logError, queryEvents } from '@/lib/logging';

// Log um evento simples
await logEvent({
  eventType: 'lead.created',
  title: 'Novo lead criado',
  description: 'Lead from WhatsApp',
  source: 'WEBHOOK',
  severity: 'INFO',
  context: {
    workspaceId: 'workspace-123',
    leadId: 'lead-456',
    metadata: { source: 'whatsapp' }
  }
});

// Log de erro
await logError({
  eventType: 'email.failed',
  title: 'Falha ao enviar email',
  error: new Error('SMTP connection timeout'),
  context: { leadId: 'lead-456' }
});

// Query de eventos
const result = await queryEvents({
  workspaceId: 'workspace-123',
  severity: 'ERROR',
  startDate: new Date('2026-05-01'),
  limit: 50
});

// Obter estatísticas
const stats = await getEventStats('workspace-123');
```

---

## 3. Metrics System (`src/lib/metrics/index.ts`)

### Obter métricas em tempo real:

```typescript
import { getMetrics, createMetricsSnapshot, getMetricsHistory } from '@/lib/metrics';

// Obter métricas dos últimos 30 dias
const metrics = await getMetrics('workspace-123');
console.log(metrics.leads.qualified);        // 45
console.log(metrics.emails.openRate);        // 32.5
console.log(metrics.conversion.overall);     // 18.2%
console.log(metrics.mrr.active);             // $5,240.50

// Criar snapshot diário (chamado pelo cron)
await createMetricsSnapshot('workspace-123');

// Obter histórico (últimos 30 dias)
const history = await getMetricsHistory('workspace-123', 30);
history.forEach(snap => {
  console.log(`${snap.date}: ${snap.leadsCreated} leads`);
});
```

**Métricas incluídas:**
- **Leads:** Total, qualificados, desqualificados, por status
- **Emails:** Enviados, abertos, clicados, rebotados, taxa de abertura/clique
- **Calls:** Registradas, conectadas, duração total/média
- **Conversão:** Lead → Qualificado, Qualificado → Fechado, Overall
- **MRR:** Total ativo, por plano
- **Performance:** Latência API média, erros de webhook

---

## 4. Health Checks (`src/lib/health/index.ts`)

### Sistema de health checks para componentes críticos:

```typescript
import { 
  checkDatabase, 
  checkEmailService,
  checkN8nWebhook,
  checkCallService,
  runAllHealthChecks,
  getHealthStatus
} from '@/lib/health';

// Executar checks individuais
const dbHealth = await checkDatabase();
// { component: "database", status: "HEALTHY", responseTimeMs: 45 }

// Executar todos os checks
const results = await runAllHealthChecks();

// Obter status geral
const status = await getHealthStatus();
// {
//   overallStatus: "HEALTHY" | "DEGRADED" | "UNHEALTHY",
//   components: [...],
//   summary: { healthy: 4, degraded: 0, unhealthy: 0 }
// }
```

**Componentes verificados:**
1. **Database** - PostgreSQL connectivity
2. **Resend Email** - API availability
3. **N8N Webhook** - Webhook endpoint reachability
4. **Vapi Calls** - Call service availability

---

## 5. Alerting System (`src/lib/alerts/index.ts`)

### Criar e gerenciar alertas:

```typescript
import { 
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  getActiveAlerts,
  checkAndCreateAlerts
} from '@/lib/alerts';

// Criar alerta manualmente
await createAlert({
  title: 'Email service degradado',
  description: 'Resend API respondendo lentamente (>2s)',
  alertType: 'service_down',
  severity: 'WARNING',
  component: 'resend_email',
  workspaceId: 'workspace-123'
});

// Reconhecer alerta
await acknowledgeAlert('alert-id', 'user-id');

// Resolver alerta
await resolveAlert('alert-id', 'user-id');

// Obter alertas ativos
const activeAlerts = await getActiveAlerts('workspace-123');

// Verificar e criar alertas automáticos
// (chamado pelo cron a cada 5-10 min)
await checkAndCreateAlerts('workspace-123');
```

**Tipos de alertas criados automaticamente:**
- High error rate (>5 erros em 5 min)
- Webhook failures (>3 falhas em 10 min)
- Service down (componente UNHEALTHY)

---

## 6. API Endpoints

### `/api/monitoring/metrics` (GET)
Retorna métricas atualizadas do workspace
```bash
curl -H "Authorization: Bearer {token}" \
  https://automatizawpp.com/api/monitoring/metrics
```

### `/api/monitoring/health` (GET)
Executa health checks e retorna status
```bash
curl https://automatizawpp.com/api/monitoring/health
```

### `/api/monitoring/alerts` (GET)
Retorna alertas ativos
```bash
curl -H "Authorization: Bearer {token}" \
  https://automatizawpp.com/api/monitoring/alerts
```

### `/api/monitoring/events` (GET)
Query interface para buscar eventos com filtros
```bash
curl -H "Authorization: Bearer {token}" \
  "https://automatizawpp.com/api/monitoring/events?eventType=lead.created&severity=ERROR&limit=50"
```

### `/api/monitoring/check` (GET) - CRON
Executa health checks e alertas automáticos
```bash
# Chamar a cada 5-10 minutos
curl -H "Authorization: Bearer {CRON_SECRET}" \
  https://automatizawpp.com/api/monitoring/check
```

### `/api/monitoring/snapshot` (GET) - CRON
Cria snapshot diário de métricas
```bash
# Chamar uma vez por dia (ex: 00:05 UTC)
curl -H "Authorization: Bearer {CRON_SECRET}" \
  https://automatizawpp.com/api/monitoring/snapshot
```

---

## 7. Monitoring Dashboard

### Página: `/monitoring`
Dashboard em tempo real com:
- Status geral dos componentes (health check visual)
- 4 cards principais: Leads, Emails, Chamadas, MRR
- Lista de alertas ativos
- Link para visualizar logs detalhados

### Página: `/monitoring/logs`
Viewer completo de eventos com:
- Filtros: eventType, severity, source, date range
- Busca full-text
- Paginação
- Metadados expandíveis por evento

---

## 8. Integração com Código Existente

### Registrar eventos em ações principais:

```typescript
// Em src/app/api/leads/route.ts
await logEvent({
  eventType: 'lead.created',
  title: 'Lead criado via API',
  source: 'API',
  context: { workspaceId, leadId, userId }
});

// Em src/app/api/emails/route.ts
await logEvent({
  eventType: 'email.sent',
  title: 'Email enviado via Resend',
  source: 'API',
  context: { leadId, metadata: { template, recipient } }
});

// Em webhooks (Brevo, Vapi, etc)
await logEvent({
  eventType: 'webhook.received',
  title: 'Webhook recebido de Brevo',
  source: 'WEBHOOK',
  context: { metadata: { eventType: 'email:opened' } }
});
```

---

## 9. Cron Jobs Setup

### Via n8n (Recomendado)

1. **Health Checks** - Executar a cada 5 minutos
```
GET https://automatizawpp.com/api/monitoring/check
Headers: Authorization: Bearer {CRON_SECRET}
```

2. **Metrics Snapshot** - Executar diariamente às 00:05 UTC
```
GET https://automatizawpp.com/api/monitoring/snapshot
Headers: Authorization: Bearer {CRON_SECRET}
```

### Via Vercel Cron Functions

Criar arquivos em `src/app/api/monitoring/cron/`:
```typescript
// src/app/api/monitoring/cron/health.ts
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  return fetch('https://automatizawpp.com/api/monitoring/check', {
    headers: { Authorization: `Bearer ${secret}` }
  });
}
```

---

## 10. Variáveis de Ambiente

Adicionar ao `.env.local` e `.env.production`:

```env
# Cron secret para health checks e snapshots
CRON_SECRET=seu-secret-aleatorio-forte

# Senviços a monitorar (já devem existir)
RESEND_API_KEY=re_xxxxx
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/xxxxx
VAPI_API_KEY=xxxxx

# Email admin para notificações (TODO: implementar)
ADMIN_EMAIL=admin@example.com
```

---

## 11. Próximos Passos

### Não implementado ainda (fora do escopo de Phase 5D):
- [ ] Notificações por email de alertas críticos
- [ ] Integração com Slack/Discord
- [ ] Dashboards históricos com gráficos
- [ ] Análise de tendências e previsões
- [ ] Custom metrics/KPIs por workspace
- [ ] SLA monitoring
- [ ] Distributed tracing (correlação de eventos entre serviços)

### Para integração imediata:
1. Executar `prisma migrate dev` para criar as tabelas
2. Adicionar `CRON_SECRET` ao `.env.local` e `.env.production`
3. Configurar n8n workflows para chamar `/api/monitoring/check` e `/api/monitoring/snapshot`
4. Testar dashboard em `/monitoring`

---

## 12. Exemplo de Uso End-to-End

```typescript
// 1. Criar um novo lead
const newLead = await prisma.lead.create({ data: {...} });

// 2. Log do evento
await logEvent({
  eventType: 'lead.created',
  title: `Novo lead: ${newLead.firstName}`,
  source: 'API',
  context: { workspaceId: 'ws-123', leadId: newLead.id }
});

// 3. Cron a cada 5 min: Health checks
// GET /api/monitoring/check?Authorization=Bearer {CRON_SECRET}
// → Verifica DB, Email, n8n, Vapi
// → Se erros > 5 em 5 min → cria SystemAlert
// → Gera Event com severity=WARNING

// 4. Cron diariamente: Metrics snapshot
// GET /api/monitoring/snapshot?Authorization=Bearer {CRON_SECRET}
// → Calcula métricas do workspace
// → Cria MetricsSnapshot para o dia
// → Log: "Snapshots criados: 5 workspaces"

// 5. Admin acessa /monitoring
// → Vê health checks em tempo real
// → Vê cards com leads, emails, calls, MRR do dia
// → Vê alertas ativos
// → Clica em "Ver Logs" → /monitoring/logs

// 6. Admin filtra logs
// eventType=email.failed, severity=ERROR, limit=100
// → Vê todos os erros de email das últimas 24h
// → Clica em cada log → metadados expandem
// → Vê stacktrace, recipient, template, etc
```

---

## Conclusão

Phase 5D fornece observabilidade completa do sistema com:
- ✅ Logging centralizado de eventos
- ✅ Métricas detalhadas de performance
- ✅ Health checks automáticos
- ✅ Alertas inteligentes
- ✅ Dashboard em tempo real
- ✅ Histórico e análise

Sistema pronto para produção com tratamento de erros, fallbacks, e índices de banco de dados para performance.
