# Phase 5B - Quick Start (5 Minutos)

## Para Deploy Imediato

### 1. Aplicar Migração (1 min)

```bash
cd /Users/eduardosilva/Antigravity/automatizawppBR
npm run db:migrate
# ou
npx prisma db push
```

### 2. Regenerar Prisma (30 sec)

```bash
npm run db:generate
```

### 3. Build (2 min)

```bash
npm run build
```

### 4. Deploy (1 min)

```bash
git add .
git commit -m "feat: Phase 5B - Alerts & Notifications"
git push origin main
# Vercel auto-deploys ou:
npm run start
```

---

## Para Verificar Funcionamento

### Teste 1: Listar Notificações (deve retornar vazio)

```bash
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  | jq .
```

### Teste 2: Criar Notificação Manual

```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "ws_123",
    "userId": "user_456",
    "title": "Teste",
    "message": "Testando Phase 5B",
    "channel": "IN_APP",
    "priority": "HIGH",
    "template": "LEAD_CREATED"
  }'
```

### Teste 3: Verificar no BD

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Notification\";"
psql $DATABASE_URL -c "SELECT * FROM \"Notification\" LIMIT 5;"
```

---

## Integrações Necessárias

### 1. Adicionar NotificationBell ao Sidebar

Em `src/components/ui/Sidebar.tsx`:

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Sidebar() {
  return (
    <nav>
      <div className="flex items-center gap-4">
        <NotificationBell />
        {/* ... resto do sidebar ... */}
      </div>
    </nav>
  );
}
```

### 2. Triggar ao Criar Lead

Em `src/app/api/leads/route.ts` (POST handler):

```typescript
import { triggerLeadCreated } from '@/lib/notifications/triggers';

const lead = await prisma.lead.create({ /* ... */ });

// Disparo assíncrono (não bloqueia)
triggerLeadCreated({
  leadId: lead.id,
  workspaceId: lead.workspaceId,
  ownerUserId: lead.ownerUserId,
  fullName: lead.fullName,
  company: lead.company,
  email: lead.email,
  leadScoreValue: lead.leadScoreValue
}).catch(console.error);

return NextResponse.json({ lead });
```

### 3. Configurar Variáveis de Ambiente

Em `.env.production` ou Dashboard/Settings:

```env
BIRD_API_KEY=<seu-token-bird>
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../X...
ENABLE_NOTIFICATION_SCHEDULER=true
```

---

## Verificar Status Pós-Deploy

### 1. Ver Agendador Iniciou

Procure no log:
```
[NOTIFICATION SCHEDULER] Iniciando agendador de notificações
```

Se não aparecer, adicionar em `src/middleware.ts`:
```typescript
import { startNotificationScheduler } from '@/lib/notifications/scheduler';
startNotificationScheduler();
```

### 2. Testar Todos os Canais

```bash
# Email (requer BREVO_API_KEY ou RESEND_API_KEY)
curl -X POST http://localhost/api/notifications/test/email

# WhatsApp (requer BIRD_API_KEY)
curl -X POST http://localhost/api/notifications/test/whatsapp \
  -d '{"phone": "+5511999999999"}'

# Slack (requer SLACK_WEBHOOK_URL)
curl -X POST http://localhost/api/notifications/test/slack

# In-App (sempre funciona)
curl -X POST http://localhost/api/notifications/test/in-app
```

---

## Próximas Ações (Pós-Deploy)

- [ ] Integrar `triggerLeadCreated()` ao endpoint de leads
- [ ] Integrar `triggerLeadQualified()` ao scoring
- [ ] Configurar alertas no Slack para erros críticos
- [ ] Testar com um lead real
- [ ] Verificar emails são entregues
- [ ] Monitorar BD: `SELECT COUNT(*) FROM "Notification" WHERE status='FAILED' AND "retryCount">=3;`

---

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Migração falha | `npx prisma migrate deploy` |
| Prisma desatualizado | `npm run db:generate && npm run build` |
| Notificações não aparecem | Verificar `GET /api/notifications` retorna 200 |
| Email não envia | Verificar `BREVO_API_KEY` ou `RESEND_API_KEY` |
| WhatsApp não funciona | Verificar `BIRD_API_KEY` é válido |
| Slack não recebe | Testar webhook com curl |

---

## Documentação Completa

Depois do quick start, ler:
1. `PHASE_5B_NOTIFICATIONS.md` - API completa e tipos
2. `PHASE_5B_IMPLEMENTATION_GUIDE.md` - Guia detalhado de integração

---

**Tempo total de deploy: ~15 minutos**
**Risco: Baixo**
**Status: ✅ Pronto**
