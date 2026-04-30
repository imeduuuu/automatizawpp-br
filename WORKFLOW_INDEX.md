# Automação GitHub → Deploy → Verify Meta Tag → Notify

## Arquivo de Índice e Instruções Rápidas

Criado em 30/04/2026 para você automatizar deployments com verificação de meta tag.

---

## Arquivos Gerados

| Arquivo | Propósito | Ler Primeiro? |
|---------|----------|--------------|
| **QUICK_IMPORT_GUIDE.md** | Começo rápido (15 min) | SIM - Comece aqui |
| **github-deploy-n8n-workflow.json** | Template n8n pronto | Sim, mas depois do guia |
| **SETUP_GITHUB_DEPLOY_WORKFLOW.md** | Documentação completa n8n | Consultar quando precisar |
| **SETUP_MAKE_WORKFLOW.md** | Documentação completa Make.com | Consultar se usar Make |
| **test-workflow.sh** | Script de teste automatizado | Usar após setup |
| **WORKFLOW_INDEX.md** | Este arquivo | Referência |

---

## Fluxo de Implementação Recomendado

### Fase 1: Preparação (5 min)

```bash
# 1. Leia o guia rápido
cat QUICK_IMPORT_GUIDE.md

# 2. Configure variáveis de ambiente
echo "SITE_URL=https://seu-site.com" >> .env
echo "NOTIFICATION_EMAIL=seu-email@gmail.com" >> .env
```

### Fase 2: Configuração (10 min)

**Escolha: n8n ou Make.com**

**Se n8n:**
1. Abra `SETUP_GITHUB_DEPLOY_WORKFLOW.md`
2. Siga Passos 1-8 em ordem
3. Importe o JSON

**Se Make.com:**
1. Abra `SETUP_MAKE_WORKFLOW.md`
2. Construa o cenário visualmente
3. Configure credenciais

### Fase 3: Teste (5 min)

```bash
# Execute script de teste automatizado
./test-workflow.sh

# Teste manual
curl -X POST https://seu-n8n.com/webhook/github-deploy \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/main","after":"abc123","repository":{"full_name":"user/repo"},"pusher":{"name":"Test"}}'
```

### Fase 4: Validação (5 min)

```bash
# Faça um push real
git add .
git commit -m "Test workflow"
git push origin main

# Monitore execução
# n8n: Workflows → [Nome] → Executions
# Make: History
```

---

## Diagrama do Workflow

```
┌─────────────────────────┐
│  GitHub Push (main)     │
└──────────────┬──────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  n8n/Make Webhook                       │
│  ├─ Filtro: Branch = main?              │
│  └─ Passa → Deploy                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  HTTP Request: Dispara Deploy           │
│  POST /api/deploy                       │
│  (DigitalOcean ou GitHub Actions)       │
└──────────────┬──────────────────────────┘
               │
               ▼
         [Sleep 30s]
               │
               ▼
┌─────────────────────────────────────────┐
│  HTTP Request: Fetch Site HTML          │
│  GET seu-site.com.br                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Code Node: Parse HTML                  │
│  Buscar: google-site-verification       │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
    [SIM]             [NÃO]
      │                 │
      ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ SUCCESS      │   │ FAILURE      │
│ ├─ Slack     │   │ ├─ Slack     │
│ └─ Email     │   │ └─ Email     │
└──────────────┘   └──────────────┘
```

---

## Checklist Pré-Implementação

Certifique-se de que tem:

- [ ] Conta GitHub com repositório
- [ ] n8n rodando (https://seu-n8n.com) OU conta Make.com
- [ ] DigitalOcean droplet com app rodando
- [ ] Webhook de deploy no droplet (script ou GitHub Actions)
- [ ] Meta tag Google no `_document.tsx` do site
- [ ] Conta Slack com permissão para criar webhooks
- [ ] Conta Gmail com 2FA + App Password gerada
- [ ] Token API de GitHub (opcional)
- [ ] Token API de DigitalOcean (opcional)

---

## Variáveis de Ambiente Necessárias

```bash
# Mínimo (obrigatório)
SITE_URL=https://seu-site.com.br
NOTIFICATION_EMAIL=seu-email@gmail.com
DO_DEPLOY_WEBHOOK_URL=https://seu-droplet.com/api/deploy

# Recomendado
DO_API_TOKEN=seu-token-do
SLACK_CHANNEL_ID=C1234567890
DEPLOY_LOGS_URL=https://seu-site.com.br/logs
GITHUB_WEBHOOK_ID=abc-123-def

# Credenciais (guardadas em n8n/Make, não no .env)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
GMAIL_PASSWORD=app-password-16-caracteres
```

---

## Troubleshooting Rápido

### Webhook não ativa
```bash
# Verifique no GitHub
Settings → Webhooks → Recent Deliveries

# Teste manualmente
curl -X POST seu-webhook-url ...
```

### Deploy não executa
```bash
# Teste endpoint
curl -X POST seu-deploy-url \
  -H "Authorization: Bearer seu-token"

# Verifique logs do droplet
ssh user@seu-droplet
tail -f /var/log/deploy.log
```

### Meta tag não encontrada
```bash
# Verifique HTML
curl seu-site.com | grep "google-site-verification"

# Verifique arquivo
grep -r "google-site-verification" src/
```

### Notificações não chegam
```bash
# Slack: Teste webhook manualmente
curl -X POST seu-slack-webhook \
  -d '{"text":"Test message"}'

# Email: Verifique credenciais em n8n
# Teste enviando email manual
```

---

## Próximos Passos Após Ativar

### Melhorias Rápidas (1-2 horas)

1. **Verificações adicionais:**
   - Status HTTP 200
   - Performance (< 2s)
   - SSL certificate válido

2. **Notificações melhoradas:**
   - Slack threads
   - Mentions @channel
   - Discord webhook

3. **Logging:**
   - Google Sheets
   - Database Postgres
   - CloudWatch

### Automações Avançadas (8+ horas)

1. **Rollback automático** se deploy falhar
2. **Cache invalidation** automático
3. **Performance monitoring** em tempo real
4. **Multi-environment** (staging, prod)
5. **Approval workflow** para produção

---

## Recursos Externos

### Documentação Oficial
- n8n: https://docs.n8n.io
- Make: https://www.make.com/help
- GitHub Webhooks: https://docs.github.com/en/developers/webhooks-and-events/webhooks
- Slack API: https://api.slack.com/messaging/webhooks

### Tutoriais Relevantes
- n8n GitHub integration: https://docs.n8n.io/nodes/n8n-nodes-base.github/
- GitHub Actions Alternatives: https://docs.github.com/en/actions
- Deploy automation best practices: https://12factor.net/

### Comunidades
- n8n Community: https://community.n8n.io
- Make Community: https://www.make.com/community
- DevOps circles no Reddit, Discord

---

## Suporte e Debugging

### Se algo não funciona:

1. **Verifique logs do n8n:**
   ```
   Workflows → [Seu Workflow] → Executions → [Execução] → Ver erro
   ```

2. **Teste cada módulo isolado:**
   ```
   Clique em cada módulo → Run (ícone de play)
   ```

3. **Verifique variáveis de ambiente:**
   ```
   Settings → Variables (n8n)
   ```

4. **Procure no community:**
   - n8n: https://community.n8n.io/search
   - Make: https://www.make.com/community

5. **Contacte o autor:**
   - Email: eduardsmonteiro@gmail.com
   - Disponível para debugging

---

## Versionamento

| Data | Versão | Mudanças |
|------|--------|----------|
| 2026-04-30 | 1.0 | Versão inicial - n8n + Make |
| - | 1.1 | Planejado: Discord webhook |
| - | 1.2 | Planejado: Database logging |
| - | 2.0 | Planejado: Multi-environment |

---

## Contribuições e Feedback

Se você melhorou este workflow, compartilhe:
- Novos módulos
- Otimizações
- Casos de uso

Email: eduardsmonteiro@gmail.com

---

**Última atualização:** 30 de Abril de 2026
**Status:** Production Ready
**Mantido por:** Eduardo Silva - Antigravity

