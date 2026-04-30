# Guia Rápido: Importar e Testar o Workflow

## Arquivos Criados para Você

1. **github-deploy-n8n-workflow.json** - Template pronto para n8n
2. **SETUP_GITHUB_DEPLOY_WORKFLOW.md** - Guia completo n8n
3. **SETUP_MAKE_WORKFLOW.md** - Guia completo Make.com
4. **QUICK_IMPORT_GUIDE.md** - Este arquivo

---

## Passo 1: Escolha a Plataforma

### Se você tem n8n rodando (recomendado):
→ Siga: **SETUP_GITHUB_DEPLOY_WORKFLOW.md**

### Se você prefere Make.com (SaaS, visual):
→ Siga: **SETUP_MAKE_WORKFLOW.md**

---

## Passo 2: Configuração Mínima (15 minutos)

### 2.1 - GitHub Webhook
```bash
# No seu repositório GitHub:
Settings → Webhooks → Add webhook

Payload URL: https://seu-n8n.com/webhook/github-deploy
# ou Make vai gerar automaticamente

Content type: application/json
Event: Just the push event
```

### 2.2 - Variáveis de Ambiente
```bash
# Crie arquivo .env.local ou adicione a .env

SITE_URL=https://seu-site.com.br
NOTIFICATION_EMAIL=seu-email@gmail.com
SLACK_CHANNEL_ID=C1234567890  # Opcional
DO_DEPLOY_WEBHOOK_URL=https://seu-droplet.com/api/deploy
DO_API_TOKEN=seu-token-do
```

### 2.3 - Meta Tag no Site
```tsx
// pages/_document.tsx (Next.js)

<head>
  <meta 
    name="google-site-verification" 
    content="seu-codigo-aqui" 
  />
</head>
```

---

## Passo 3: Importar (Escolha Uma)

### Opção A: n8n Interface Web (Mais Fácil)

```
1. Abra https://seu-n8n.com
2. Workflows → Import
3. Cole o conteúdo de github-deploy-n8n-workflow.json
4. Clique em Import
5. Configure credenciais (Slack, Email)
6. Ative o workflow
```

### Opção B: n8n via cURL

```bash
N8N_URL="https://seu-n8n.com"
N8N_API_KEY="seu-token-n8n"
WORKFLOW_FILE="github-deploy-n8n-workflow.json"

curl -X POST "$N8N_URL/api/v1/workflows" \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -d @"$WORKFLOW_FILE"
```

### Opção C: Make.com (Arrastar e Soltar)

```
1. Make.com → Create new scenario
2. GitHub + HTTP + Sleep + HTTP + Text Parser
3. Siga passo a passo em SETUP_MAKE_WORKFLOW.md
4. Clique em ON para ativar
```

---

## Passo 4: Teste End-to-End

### Teste 1: Webhook Manual

```bash
# Teste com curl
curl -X POST https://seu-n8n.com/webhook/github-deploy \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "ref": "refs/heads/main",
    "after": "1a2b3c4d5e6f7g8h9i0j",
    "repository": {
      "full_name": "seu-usuario/seu-repo",
      "owner": {"avatar_url": "https://avatars.githubusercontent.com/u/123?v=4"}
    },
    "pusher": {"name": "Test User"}
  }'
```

**Esperado**: n8n mostra execução bem-sucedida

### Teste 2: Push Real no GitHub

```bash
# No seu repositório local:
git add .
git commit -m "Test deploy workflow"
git push origin main
```

**Esperado**:
1. GitHub envia webhook
2. n8n/Make recebe
3. Deploy é acionado
4. Espera 30s
5. Verifica meta tag
6. Envia Slack + Email

### Verificar Execução

**n8n:**
```
Workflows → [Seu Workflow] → Executions
```

**Make:**
```
History → Veja cada execução
```

---

## Passo 5: Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Webhook não chega | GitHub Settings → Webhooks → Recent Deliveries |
| Deploy não executa | Teste endpoint manualmente com curl |
| Meta tag não encontrada | `curl seu-site.com \| grep google-site-verification` |
| Slack não notifica | Verifique webhook URL em Slack → Apps |
| Email não chega | Gmail: gere App Password em https://myaccount.google.com/apppasswords |

---

## Checklist Final

- [ ] Webhook GitHub criado
- [ ] Variáveis de ambiente definidas
- [ ] Meta tag no seu site
- [ ] Workflow importado (n8n ou Make)
- [ ] Credenciais Slack configuradas
- [ ] Credenciais Email configuradas
- [ ] Teste com curl funcionando
- [ ] Teste com push real funcionando
- [ ] Notificações chegando (Slack + Email)

---

## Exemplos de Resposta Esperada

### Sucesso (Slack):
```
✅ Deploy Successful - Meta Tag Verified

Repository: seu-repo
Branch: main
Commit: 1a2b3c4
Author: Seu Nome
Google Meta Tag: Found ✓
Time: 30/04/2026 14:30
```

### Erro (Email):
```
Subject: ❌ Deploy Failed - Meta Tag NOT Found

Deploy Issue - Meta Tag Missing
The deployment completed but the Google site 
verification meta tag was not found.

Details:
- Repository: seu-repo
- Commit: 1a2b3c4
- Meta Tag Status: NOT FOUND ✗

Troubleshooting:
1. Check if deployment was successful
2. Wait 5 minutes for cache
3. Verify _document.tsx has the meta tag
...
```

---

## Customização Avançada

Depois de funcionar, você pode:

1. **Adicionar mais verificações:**
   - Status HTTP 200 OK
   - Performance check
   - SSL certificate validation

2. **Melhorar notificações:**
   - Adicionar webhook Discord
   - Telegram notification
   - Google Sheets logging

3. **Automação avançada:**
   - Rollback automático em erro
   - Slack thread replies
   - Re-run automático após erro

---

## Recursos Adicionais

- **n8n Docs**: https://docs.n8n.io
- **Make Docs**: https://www.make.com/help
- **GitHub Webhooks**: https://docs.github.com/en/developers/webhooks-and-events/webhooks
- **Slack Webhooks**: https://api.slack.com/messaging/webhooks
- **Gmail SMTP**: https://support.google.com/accounts/answer/185833

