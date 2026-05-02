# Phase 5D Setup Guide

## Passo 1: Atualizar o Database

```bash
# No seu projeto local ou produção
cd /Users/eduardosilva/Antigravity/automatizawppBR

# Criar migration
npx prisma migrate dev --name add_monitoring_observability

# Ou em produção (sem --dev)
npx prisma migrate deploy
```

Isso criará as 4 tabelas novas:
- `Event` - Logging centralizado
- `HealthCheck` - Status dos componentes
- `SystemAlert` - Alertas críticos
- `MetricsSnapshot` - Snapshots diários

## Passo 2: Adicionar Variáveis de Ambiente

### `.env.local` (desenvolvimento)
```env
# Monitoring
CRON_SECRET=seu-secret-seguro-aleatorio-aqui

# Já devem existir:
# RESEND_API_KEY=re_xxxxx
# N8N_WEBHOOK_URL=https://n8n.example.com/webhook/xxxxx
# VAPI_API_KEY=xxxxx
```

### `.env.production` (produção)
```env
# Monitoring
CRON_SECRET=$(openssl rand -base64 32)

# Já devem existir:
# RESEND_API_KEY=re_xxxxx
# N8N_WEBHOOK_URL=https://n8n.example.com/webhook/xxxxx
# VAPI_API_KEY=xxxxx
```

## Passo 3: Testar Localmente

```bash
# 1. Iniciar o servidor
npm run dev

# 2. Testar dashboard
# Acesse: http://localhost:3000/monitoring

# 3. Testar health checks (em outro terminal)
curl -H "Authorization: Bearer seu-secret" \
  http://localhost:3000/api/monitoring/health

# 4. Testar métricas
curl http://localhost:3000/api/monitoring/metrics

# 5. Testar logs
curl -H "Authorization: Bearer seu-secret" \
  "http://localhost:3000/api/monitoring/events?limit=10"
```

## Passo 4: Configurar Cron Jobs

### Opção A: Via n8n (Recomendado)

1. Criar webhook de saída em n8n para Health Checks:
   - **URL:** `https://automatizawpp.com/api/monitoring/check`
   - **Método:** GET
   - **Headers:** `Authorization: Bearer {CRON_SECRET}`
   - **Intervalo:** A cada 5 minutos

2. Criar webhook de saída em n8n para Metrics Snapshot:
   - **URL:** `https://automatizawpp.com/api/monitoring/snapshot`
   - **Método:** GET
   - **Headers:** `Authorization: Bearer {CRON_SECRET}`
   - **Intervalo:** Diariamente às 00:05 UTC

### Opção B: Via GitHub Actions

```yaml
# .github/workflows/monitoring-cron.yml
name: Monitoring Cron Jobs

on:
  schedule:
    - cron: '*/5 * * * *'    # Health checks a cada 5 min
    - cron: '5 0 * * *'      # Metrics snapshot às 00:05 UTC

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Run health checks
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://automatizawpp.com/api/monitoring/check

  metrics-snapshot:
    runs-on: ubuntu-latest
    if: github.event.schedule == '5 0 * * *'
    steps:
      - name: Create metrics snapshot
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://automatizawpp.com/api/monitoring/snapshot
```

### Opção C: Via Vercel Cron Functions

Já implementado em:
- `/api/monitoring/check`
- `/api/monitoring/snapshot`

Basta ativar no painel Vercel → Deployments → Cron Jobs

## Passo 5: Integração com Código Existente

Adicionar logging em pontos críticos:

### Em `src/app/api/leads/route.ts`
```typescript
import { logEvent } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const lead = await prisma.lead.create({ data });

    await logEvent({
      eventType: 'lead.created',
      title: `Novo lead: ${lead.firstName} ${lead.lastName}`,
      source: 'API',
      severity: 'INFO',
      context: {
        workspaceId: 'workspace-id', // Get from session
        leadId: lead.id,
        metadata: { source: data.source }
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    await logEvent({
      eventType: 'lead.create_failed',
      title: 'Erro ao criar lead',
      severity: 'ERROR',
      source: 'API',
      context: {
        metadata: { error: error instanceof Error ? error.message : '' }
      }
    });
    throw error;
  }
}
```

### Em `src/app/api/emails/route.ts`
```typescript
import { logEvent } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    const { leadId, template, recipient } = await request.json();

    const result = await resend.emails.send({
      from: 'noreply@automatizawpp.com',
      to: recipient,
      html: template
    });

    await logEvent({
      eventType: 'email.sent',
      title: `Email enviado para ${recipient}`,
      source: 'API',
      severity: 'INFO',
      context: {
        leadId,
        metadata: { template, resendId: result.id }
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    await logEvent({
      eventType: 'email.failed',
      title: 'Falha ao enviar email',
      severity: 'ERROR',
      source: 'API',
      context: {
        metadata: { error: error instanceof Error ? error.message : '' }
      }
    });
    throw error;
  }
}
```

### Em webhooks (Brevo, Vapi, etc)
```typescript
import { logEvent } from '@/lib/logging';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-brevo-signature');
  
  if (!verifyBrevoSignature(signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const body = await request.json();

  await logEvent({
    eventType: 'webhook.brevo',
    title: `Webhook Brevo: ${body.event}`,
    source: 'WEBHOOK',
    severity: 'INFO',
    context: {
      metadata: { event: body.event, contact: body.contact }
    }
  });

  // Processar webhook
  // ...

  return NextResponse.json({ success: true });
}
```

## Passo 6: Verificar Setup

```bash
# 1. Verificar se as tabelas existem
npx prisma studio

# 2. Acessar /monitoring
# http://localhost:3000/monitoring

# 3. Acessar /monitoring/logs
# http://localhost:3000/monitoring/logs

# 4. Testar cron manualmente
CRON_SECRET=seu-secret node -e "
  fetch('http://localhost:3000/api/monitoring/check', {
    headers: { Authorization: 'Bearer seu-secret' }
  }).then(r => r.json()).then(console.log)
"
```

## Passo 7: Deploy em Produção

```bash
# 1. Commit das mudanças
git add .
git commit -m "feat: Phase 5D - Monitoring & Observability

- Event logging system com database
- Metrics tracking (leads, emails, calls, MRR)
- Health checks para 4 componentes
- System alerts com auto-detection
- Monitoring dashboard em /monitoring
- Logs viewer com filtros
- Cron jobs para checks e snapshots"

# 2. Push
git push origin main

# 3. Vercel deploy automático (se config_github)
# Ou manual: vercel deploy --prod

# 4. Configurar secrets no Vercel
# CRON_SECRET = valor gerado

# 5. Ativar cron jobs no painel Vercel
# (se usando Vercel Cron Functions)

# 6. Configurar n8n webhooks
# (se usando n8n para cron)
```

## Troubleshooting

### Erro: "PrismaClientInitializationError"
```
Solução: Rodar migrate antes
npx prisma migrate dev
```

### Erro: "Unauthorized" em /api/monitoring/health
```
Solução: Este endpoint NÃO requer auth.
Se ainda der erro, verificar middleware.ts
```

### Erro: "401 - Invalid CRON_SECRET"
```
Solução: Verificar se CRON_SECRET está em .env
E se está sendo passado no header Authorization
```

### Dashboard /monitoring mostra erro 401
```
Solução: Fazer login primeiro
Dashboard precisa de sessão autenticada
```

### Logs vazios em /monitoring/logs
```
Normal se não há eventos registrados
Testar criando logs manualmente:
  curl http://localhost:3000/api/monitoring/events
```

## Checklist Final

- [ ] `npx prisma migrate dev` executado
- [ ] `CRON_SECRET` adicionado a `.env.local`
- [ ] Dashboard `/monitoring` acessível
- [ ] `/api/monitoring/health` retorna status dos componentes
- [ ] Cron job de health checks configurado (a cada 5 min)
- [ ] Cron job de metrics snapshot configurado (diariamente 00:05 UTC)
- [ ] Logging adicionado aos endpoints principais
- [ ] `/monitoring/logs` mostra eventos registrados
- [ ] Alertas ativos aparecem no dashboard

## Próximos: Integrações Opcionais

1. **Email notifications:**
   - Implementar `notifyAdminAboutAlert()` em `src/lib/alerts/index.ts`
   - Usar Resend para enviar alertas críticos

2. **Slack integration:**
   - POST para webhook de Slack quando alert criado

3. **Custom metrics:**
   - Adicionar métricas específicas do negócio

4. **Grafana integration:**
   - Export de métricas para Grafana/Prometheus

5. **Distributed tracing:**
   - Correlacionar eventos entre serviços (n8n, Vapi, Brevo)
