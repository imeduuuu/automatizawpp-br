# Phase 5B - Checklist de Integração

## ✅ Pré-Deploy (Local)

- [ ] Executar `npm run build` sem erros
- [ ] Executar `npm run db:migrate` (modo dev)
- [ ] Verificar que tabelas foram criadas:
  ```sql
  \dt "Notification*"
  ```
- [ ] Prisma types gerados:
  ```bash
  npm run db:generate
  ```
- [ ] Testar endpoints localmente:
  ```bash
  curl http://localhost:3000/api/notifications \
    -H "Authorization: Bearer test-token"
  ```

## ✅ Deploy para Produção

- [ ] Commit e push para main
  ```bash
  git add .
  git commit -m "feat: Phase 5B - Alerts & Notifications"
  git push origin main
  ```
- [ ] Aguardar deploy do Vercel/DO
- [ ] Verificar health check: `GET /`
- [ ] Confirmar tabelas no produção:
  ```bash
  psql $PROD_DATABASE_URL -c "\dt"
  ```

## ✅ Configuração de Ambiente

### Variáveis Já Existentes (verificar)
- [ ] `BREVO_API_KEY` - Email
- [ ] `RESEND_API_KEY` - Email fallback
- [ ] `SMTP_USER` e `SMTP_PASS` - Email SMTP
- [ ] `DATABASE_URL` - PostgreSQL

### Variáveis Novas (adicionar)
- [ ] `BIRD_API_KEY` - WhatsApp
  - Obter em: https://dashboard.bird.com/
  - Formato: `live_xxxxx` ou `sandbox_xxxxx`
- [ ] `SLACK_WEBHOOK_URL` - Slack
  - Obter em: Slack App Incoming Webhooks
  - Formato: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
- [ ] `ENABLE_NOTIFICATION_SCHEDULER=true` - Feature flag

No Vercel Dashboard:
1. Ir para Project Settings → Environment Variables
2. Adicionar `BIRD_API_KEY`
3. Adicionar `SLACK_WEBHOOK_URL`
4. Redeploy

No DigitalOcean:
1. SSH para servidor
2. `export BIRD_API_KEY=...`
3. `export SLACK_WEBHOOK_URL=...`
4. Adicionar a `.env` ou docker-compose.yml
5. Reiniciar aplicação

## ✅ Integração com Features Existentes

### Lead Creation

Em `src/app/api/leads/route.ts` POST handler:

```typescript
import { triggerLeadCreated } from '@/lib/notifications/triggers';

// Após criar lead
const lead = await prisma.lead.create({
  data: { /* ... */ }
});

// Disparo notificação
triggerLeadCreated({
  leadId: lead.id,
  workspaceId: lead.workspaceId,
  ownerUserId: lead.ownerUserId,
  fullName: lead.fullName,
  company: lead.company,
  email: lead.email,
  leadScoreValue: lead.leadScoreValue
}).catch(console.error); // Fire-and-forget

return NextResponse.json({ lead });
```

- [ ] Código adicionado
- [ ] Build sem erros
- [ ] Teste: Criar lead → verificar notificação IN_APP aparece

### Lead Qualification

Em agent ou endpoint que qualifica:

```typescript
import { triggerLeadQualified, triggerHighIntentLead, triggerVipLead } from '@/lib/notifications/triggers';

if (qualificationScore > 70) {
  triggerLeadQualified({
    leadId: lead.id,
    workspaceId: lead.workspaceId,
    ownerUserId: lead.ownerUserId,
    fullName: lead.fullName,
    company: lead.company,
    email: lead.email,
    qualificationScore
  }).catch(console.error);
}

if (intentLevel === 'HIGH') {
  triggerHighIntentLead(
    lead.id,
    lead.workspaceId,
    lead.ownerUserId,
    lead.fullName,
    lead.company,
    lead.email
  ).catch(console.error);
}

if (lead.isVip) {
  triggerVipLead(
    lead.id,
    lead.workspaceId,
    lead.ownerUserId,
    lead.fullName,
    lead.company,
    lead.email
  ).catch(console.error);
}
```

- [ ] Código adicionado
- [ ] Build sem erros
- [ ] Teste: Qualificar lead → múltiplas notificações disparam

### Email Failed

Em `src/lib/mail.ts` ou `sendSmtpMail()`:

```typescript
import { triggerEmailFailed } from '@/lib/notifications/triggers';

const result = await sendSmtpMail({ /* ... */ });

if (!result.ok) {
  triggerEmailFailed({
    leadId: lead.id,
    workspaceId: lead.workspaceId,
    ownerUserId: lead.ownerUserId,
    recipientEmail: lead.email,
    reason: result.error || 'Unknown error'
  }).catch(console.error);
}
```

- [ ] Código adicionado
- [ ] Build sem erros
- [ ] Teste: Simular falha de email → notificação criada

### Dashboard/Sidebar

Em `src/components/ui/Sidebar.tsx`:

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Sidebar() {
  return (
    <nav>
      <div className="flex items-center">
        <NotificationBell /> {/* Adicionar aqui */}
        {/* ... resto ... */}
      </div>
    </nav>
  );
}
```

- [ ] Componente importado
- [ ] Build sem erros
- [ ] Teste: Verificar sino aparece no dashboard
- [ ] Teste: Clicar sino → dropdown funciona
- [ ] Teste: Badge mostra contagem correta

## ✅ Testes Funcionais

### Teste 1: Lead Created

1. Criar novo lead via UI ou API
2. Verificar:
   - [ ] Notificação aparece no sino (IN_APP)
   - [ ] Notificação marcada como não-lida
   - [ ] Dados corretos (nome, company)
   - [ ] Timestamp correto
   - [ ] Registro no BD: `SELECT * FROM "Notification" WHERE template='LEAD_CREATED' ORDER BY createdAt DESC LIMIT 1;`

### Teste 2: Lead Qualified

1. Criar lead com score > 70
2. Verificar:
   - [ ] Notificação LEAD_QUALIFIED criada
   - [ ] Múltiplos canais (se configurados): IN_APP, EMAIL, WHATSAPP
   - [ ] Prioridade HIGH
   - [ ] Score mostrado corretamente

### Teste 3: Email Fallback

1. Forçar falha de Brevo/Resend
2. Verificar:
   - [ ] SMTP tenta como fallback
   - [ ] Email é entregue
   - [ ] Notificação de erro não é criada

### Teste 4: Preferências

1. Desabilitar LEAD_CREATED para EMAIL
2. Criar novo lead
3. Verificar:
   - [ ] IN_APP é enviado
   - [ ] EMAIL não é enviado
   - [ ] Pode re-habilitar e tenta novamente

### Teste 5: Retry

1. Forçar falha de envio (mock API retorna erro)
2. Aguardar ~5 minutos
3. Verificar:
   - [ ] Agendador reprocessa
   - [ ] `retryCount` incrementa
   - [ ] Após 3 tentativas, para
   - [ ] Logs: `[NOTIFICATION RETRY] {sent: X, failed: Y}`

### Teste 6: UI Interactions

1. Abrir notificações
2. Teste:
   - [ ] Marcar como lida (check icon)
   - [ ] Remover (X icon)
   - [ ] Badge atualiza
   - [ ] Limpar tudo funciona
   - [ ] Refresh automático a cada 30s

## ✅ Monitoramento Pós-Deploy

### Métricas a Verificar (Diariamente na Primeira Semana)

```sql
-- Volume diário
SELECT DATE(createdAt) as date, COUNT(*) as count
FROM "Notification"
GROUP BY DATE(createdAt)
ORDER BY date DESC;

-- Taxa de sucesso por canal
SELECT channel, 
  COUNT(*) as total,
  SUM(CASE WHEN status='SENT' THEN 1 ELSE 0 END) as sent,
  ROUND(100.0 * SUM(CASE WHEN status='SENT' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM "Notification"
WHERE createdAt >= NOW() - INTERVAL '24 hours'
GROUP BY channel;

-- Falhas que precisam de atenção
SELECT id, title, reason, failureReason, retryCount
FROM "Notification"
WHERE status = 'FAILED'
AND retryCount >= 3
ORDER BY createdAt DESC
LIMIT 20;

-- Status do agendador (procurar por logs)
-- Ver logs da app: grep "NOTIFICATION" logs.txt
```

### Alertas a Configurar

1. **Muitas falhas:**
   - Se `SELECT COUNT(*) FROM "Notification" WHERE status='FAILED' AND retryCount>=3` > 50 em 24h
   - Ação: Investigar BIRD_API_KEY ou SLACK_WEBHOOK_URL

2. **Taxa de sucesso baixa:**
   - Se qualquer canal < 90% de sucesso
   - Ação: Verificar credenciais do provider

3. **Agendador não rodando:**
   - Se não houver logs `[NOTIFICATION RETRY]` em 10 minutos
   - Ação: Reiniciar aplicação

## ✅ Documentação de Rollback

Se houver problema crítico:

1. **Remover NotificationBell do Sidebar**
   ```typescript
   // Comentar import e componente
   // export function Sidebar() { ... }
   ```

2. **Desabilitar Agendador**
   ```env
   ENABLE_NOTIFICATION_SCHEDULER=false
   ```

3. **Remover Triggers (opcional)**
   - Comentar chamadas a `triggerLeadCreated()` etc
   - Deixar tabelas no BD para data recovery

4. **Deploy revert (se necessário)**
   ```bash
   git revert HEAD
   git push origin main
   ```

## ✅ Sign-Off

- [ ] Migração aplicada com sucesso
- [ ] Variáveis de ambiente configuradas
- [ ] NotificationBell no dashboard
- [ ] Triggers integrados com leads
- [ ] Todos os 6 testes funcionais passaram
- [ ] Métricas sendo coletadas
- [ ] Alertas configurados
- [ ] Documentação lida
- [ ] Time treinado (se aplicável)
- [ ] Go-live autorizado

**Data de Deploy:** ___________
**Responsável:** ___________
**Observações:** ___________

---

**Status Final:** ✅ Ready to Production
