# Phase 5B - Alertas e Notificações (Gatilho)

## Visão Geral

Sistema multi-canal de notificações para a plataforma AutomatizaWPP. Implementa alertas automáticos para leads qualificados, oportunidades de alto valor, erros do sistema e outras métricas críticas.

## Arquitetura

```
src/lib/notifications/
├── types.ts              # Tipos TypeScript
├── templates.ts          # Templates de mensagens (PT-BR)
├── alert-rules.ts        # Regras de gatilho
├── service.ts            # Serviço central de notificações
├── preferences.ts        # Gerenciador de preferências
├── triggers.ts           # Gatilhos de eventos
├── scheduler.ts          # Agendador de retry
└── channels/
    ├── email.ts         # Canal Email (SMTP/Brevo/Resend)
    ├── whatsapp.ts      # Canal WhatsApp (Bird API)
    ├── in-app.ts        # Canal In-App (WebSocket)
    └── slack.ts         # Canal Slack (Webhooks)

src/app/api/notifications/
├── route.ts              # GET/POST notificações
├── [id]/route.ts         # PATCH/DELETE notificação
├── clear-all/route.ts    # POST limpar tudo
└── preferences/route.ts  # GET/PUT preferências

src/components/notifications/
├── NotificationBell.tsx       # Sino de notificações
└── NotificationBell.module.css
```

## Banco de Dados

### Tabelas Criadas

1. **Notification**
   - Registra todas as notificações enviadas
   - Rastreia status (PENDING, SENT, FAILED, READ, ARCHIVED)
   - Suporta retry automático

2. **NotificationPreference**
   - Preferências de cada usuário por canal
   - Habilita/desabilita tipos de notificação
   - Única por usuário/canal

3. **NotificationTemplate**
   - Templates customizáveis por workspace
   - Suporta variáveis dinâmicas
   - Fallback para templates padrão

## Canais Suportados

### 1. Email
- Providers: Brevo, Resend, SMTP
- Usa sistema de email existente (`sendSmtpMail`)
- Fallback automático entre providers

### 2. WhatsApp
- API: Bird.com
- Requer `BIRD_API_KEY` configurada
- Formata números de telefone automaticamente

### 3. In-App
- Dados armazenados no banco
- Entrega em tempo real via WebSocket (future)
- Sino de notificações no dashboard

### 4. Slack
- Webhooks: `SLACK_WEBHOOK_URL`
- Mensagens formatadas com cores por prioridade
- Ideal para alertas de erro do sistema

## Templates de Notificação

Implementados 10 templates padrão (PT-BR):

1. **LEAD_CREATED** - Novo lead registrado
2. **LEAD_QUALIFIED** - Lead qualificado (score > 70)
3. **LEAD_HIGH_INTENT** - Alta intenção detectada
4. **LEAD_VIP** - Lead classificado como VIP
5. **EMAIL_FAILED** - Email falhou no envio
6. **CALL_COMPLETED** - Chamada realizada
7. **FOLLOW_UP_SENT** - Follow-up enviado
8. **SYSTEM_ERROR** - Erro crítico do sistema
9. **SYSTEM_HEALTH** - Relatório de saúde
10. **OPPORTUNITY_HIGH_VALUE** - Oportunidade $$$

## Regras de Alerta

Cada regra define:
- Template a usar
- Prioridade (LOW, MEDIUM, HIGH, URGENT)
- Canais de entrega
- Condições (opcional)

### Exemplos:

```typescript
'lead-created': {
  template: 'LEAD_CREATED',
  priority: 'MEDIUM',
  channels: ['IN_APP', 'EMAIL']
}

'lead-vip': {
  template: 'LEAD_VIP',
  priority: 'URGENT',
  channels: ['IN_APP', 'EMAIL', 'WHATSAPP', 'SLACK']
}
```

## API Endpoints

### GET /api/notifications
Listar notificações do usuário

```bash
GET /api/notifications?workspaceId=X&limit=20&page=1
Authorization: Bearer <token>

Response:
{
  "notifications": [...],
  "unreadCount": 5,
  "page": 1,
  "limit": 20
}
```

### PATCH /api/notifications/[id]
Marcar como lida

```bash
PATCH /api/notifications/abc123
Authorization: Bearer <token>

Response:
{
  "notification": {
    "id": "abc123",
    "status": "READ",
    "readAt": "2026-05-01T10:30:00Z"
  }
}
```

### DELETE /api/notifications/[id]
Arquivar notificação

```bash
DELETE /api/notifications/abc123
Authorization: Bearer <token>

Response:
{
  "success": true
}
```

### POST /api/notifications/clear-all
Limpar todas as notificações

```bash
POST /api/notifications/clear-all
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "xyz"
}

Response:
{
  "success": true,
  "archivedCount": 42
}
```

### GET /api/notifications/preferences
Obter preferências

```bash
GET /api/notifications/preferences?workspaceId=X&channel=EMAIL
Authorization: Bearer <token>

Response:
{
  "preferences": {
    "leadCreated": true,
    "leadQualified": true,
    "leadVip": true,
    ...
  }
}
```

### PUT /api/notifications/preferences
Atualizar preferências

```bash
PUT /api/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "channel": "EMAIL",
  "updates": {
    "leadVip": true,
    "systemHealth": false,
    ...
  }
}

Response:
{
  "preferences": { ... }
}
```

## Uso em Código

### Enviar Notificação Manual

```typescript
import { sendNotification } from '@/lib/notifications/service';

await sendNotification({
  payload: {
    workspaceId: 'ws_123',
    userId: 'user_456',
    leadId: 'lead_789',
    title: 'Lead Qualificado',
    message: 'João Silva foi qualificado como prospect',
    channel: 'IN_APP',
    priority: 'HIGH',
    template: 'LEAD_QUALIFIED',
    recipientEmail: 'sales@company.com',
    metadata: {
      leadName: 'João Silva',
      company: 'Acme Corp',
      score: 85
    }
  }
});
```

### Usar Gatilho Automático (ao criar lead)

```typescript
import { triggerLeadCreated } from '@/lib/notifications/triggers';

// Após criar lead no BD
await triggerLeadCreated({
  leadId: lead.id,
  workspaceId: lead.workspaceId,
  ownerUserId: lead.ownerUserId,
  fullName: lead.fullName,
  company: lead.company,
  email: lead.email,
  leadScoreValue: lead.leadScoreValue
});
```

### Usar no Dashboard

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Sidebar() {
  return (
    <div>
      <NotificationBell />
      {/* ... resto do sidebar ... */}
    </div>
  );
}
```

## Variáveis de Ambiente

```env
# Email (já existentes)
BREVO_API_KEY=
RESEND_API_KEY=
SMTP_USER=
SMTP_PASS=
SMTP_HOST=
SMTP_PORT=

# WhatsApp
BIRD_API_KEY=<seu-token-bird>

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# Feature flags
ENABLE_NOTIFICATION_SCHEDULER=true
```

## Configuração

### 1. Criar e Aplicar Migração

```bash
npm run db:migrate
# ou
npx prisma migrate dev --name add_notifications_schema
```

### 2. Regenerar Prisma Client

```bash
npm run db:generate
```

### 3. Configurar Variáveis de Ambiente

Adicionar `BIRD_API_KEY` e `SLACK_WEBHOOK_URL` ao `.env` ou deploy.

### 4. Iniciar Agendador (em produção)

O agendador inicia automaticamente em produção se `ENABLE_NOTIFICATION_SCHEDULER=true`.

Para manual:

```typescript
import { startNotificationScheduler } from '@/lib/notifications/scheduler';
startNotificationScheduler();
```

## Retry Automático

- Notificações com falha entram em fila de retry
- Máximo 3 tentativas por notificação
- Agendador tenta 10 notificações a cada 5 minutos
- Logs disponíveis em produção

## Segurança

- Notificações requerem autenticação (exceto webhooks internos)
- Usuário só pode ver/editar suas próprias notificações
- Templates customizáveis apenas por workspace
- Sem exposição de dados sensíveis nos templates

## Monitoramento

### Métricas Disponíveis

```sql
-- Notificações pendentes
SELECT COUNT(*) FROM "Notification"
WHERE status = 'PENDING' AND "retryCount" < 3;

-- Taxa de sucesso por canal
SELECT channel, 
  COUNT(*) as total,
  COUNTIF(status = 'SENT') as sent,
  ROUND(100.0 * COUNTIF(status = 'SENT') / COUNT(*), 2) as success_rate
FROM "Notification"
GROUP BY channel;

-- Notificações não lidas
SELECT "userId", COUNT(*) as unread
FROM "Notification"
WHERE status != 'READ'
GROUP BY "userId"
ORDER BY unread DESC;
```

## Troubleshooting

### Email não é enviado
1. Verificar `BREVO_API_KEY` e `RESEND_API_KEY`
2. Verificar credenciais SMTP (`SMTP_USER`, `SMTP_PASS`)
3. Verificar `MAIL_FROM` ou `RESEND_FROM`
4. Ver logs da BD: `Notification.failureReason`

### WhatsApp não funciona
1. Verificar `BIRD_API_KEY`
2. Verificar formato do telefone (com +55 para Brasil)
3. Verificar conta Bird está ativa

### Slack não envia
1. Verificar `SLACK_WEBHOOK_URL` é válida
2. Testar webhook com `curl -X POST`
3. Verificar permissões no Slack workspace

### Notificações In-App não aparecem
1. Verificar que `userId` é válido
2. Verificar que cliente está chamando `GET /api/notifications`
3. Implementar WebSocket para tempo real (future)

## Roadmap Futuro

- [ ] WebSocket para entrega em tempo real
- [ ] Dashboard de Analytics de notificações
- [ ] Templates customizáveis por usuário
- [ ] SMS via Twilio
- [ ] Push notifications (PWA)
- [ ] Template builder UI
- [ ] Scheduling de notificações futuras
- [ ] A/B testing de templates

## Testes

Ver arquivos de teste em `__tests__/notifications/`:

```bash
npm run test:notifications
```

## Suporte

Para problemas, verificar:
1. Logs: `console.error('[NOTIFICATION ...]')`
2. BD: `SELECT * FROM "Notification" WHERE status = 'FAILED' LIMIT 10;`
3. Env vars: `echo $BIRD_API_KEY` etc
