# Configuração Completa: GitHub Push → Deploy → Verify Meta Tag → Notify

## Overview do Workflow

Este workflow automatiza:
1. **GitHub Webhook**: Detecta push na branch `main`
2. **Deploy Automático**: Aciona deploy no DigitalOcean via webhook
3. **Verificação de Meta Tag**: Espera 30s e verifica se a meta tag está no site
4. **Notificação**: Envia Slack + Email com sucesso ou erro

---

## Passo 1: Preparar Variáveis de Ambiente

Adicione ao seu `.env` ou `.env.production`:

```bash
# GitHub Webhook
GITHUB_WEBHOOK_ID=seu-webhook-id-aleatorio

# DigitalOcean Deploy
DO_DEPLOY_WEBHOOK_URL=https://seu-droplet.com/api/deploy
DO_API_TOKEN=seu-token-do-api

# Site
SITE_URL=https://seu-site.com.br
DEPLOY_LOGS_URL=https://seu-site.com.br/logs

# Notificações
NOTIFICATION_EMAIL=seu-email@gmail.com
SLACK_CHANNEL_ID=C1234567890
```

---

## Passo 2: Configurar GitHub Webhook

### No GitHub (repositório):

1. Vá para **Settings → Webhooks**
2. Clique em **Add webhook**
3. Configure:
   - **Payload URL**: `https://seu-n8n.com/webhook/github-deploy`
   - **Content type**: `application/json`
   - **Events**: Selecione **Just the push event**
   - **Active**: Marque

4. Salve e copie o **Webhook ID** (ou use um aleatório)

### Teste o webhook:
```bash
curl -X POST https://seu-n8n.com/webhook/github-deploy \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/main","after":"abc123","repository":{"full_name":"seu-repo"},"pusher":{"name":"Test User"}}'
```

---

## Passo 3: Importar Workflow no n8n

### Opção A: Via Interface Web

1. Abra **n8n** (https://seu-n8n.com)
2. Vá para **Workflows → Import**
3. Cole o conteúdo de `github-deploy-n8n-workflow.json`
4. Clique em **Import**

### Opção B: Via API do n8n

```bash
curl -X POST https://seu-n8n.com/api/v1/workflows \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: seu-token-n8n" \
  -d @github-deploy-n8n-workflow.json
```

---

## Passo 4: Configurar Credenciais no n8n

### 4.1 - Slack Webhook

1. No n8n, vá para **Credentials**
2. Clique em **New → Slack**
3. Selecione **Webhook** como tipo
4. Obtenha seu Slack Webhook URL:
   - Vá para Slack: **Settings → Apps → Manage apps**
   - Procure por **Incoming Webhooks**
   - Crie novo e copie a URL
5. Cole a URL em n8n e salve com nome `slack-webhook-prod`

### 4.2 - Email (Gmail/SMTP)

1. No n8n, vá para **Credentials → New → Email**
2. Configure:
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Email**: seu-email@gmail.com
   - **Password**: senha de app do Gmail

Se usar Gmail:
- Habilite 2FA
- Gere uma **App Password**: https://myaccount.google.com/apppasswords
- Use essa senha no n8n

---

## Passo 5: Configurar Deploy Webhook (DigitalOcean)

Você precisa de um endpoint que acione o deploy. Opções:

### Opção A: Script bash no seu droplet

Crie `/opt/deploy-webhook.sh`:

```bash
#!/bin/bash

# /opt/deploy-webhook.sh

if [ "$REQUEST_METHOD" != "POST" ]; then
  echo "Method not allowed"
  exit 1
fi

COMMIT_SHA=$(echo "$PAYLOAD" | jq -r '.commit')
BRANCH=$(echo "$PAYLOAD" | jq -r '.branch')

if [ "$BRANCH" != "main" ]; then
  echo "Skipping non-main branch"
  exit 0
fi

cd /var/www/seu-app && {
  git fetch origin
  git checkout main
  git reset --hard "$COMMIT_SHA"
  
  # Reinstalar dependências e rebuild
  npm install
  npm run build
  
  # Reiniciar serviço
  systemctl restart seu-app-service
  
  echo "Deploy completed: $COMMIT_SHA"
}
```

Dê permissão:
```bash
chmod +x /opt/deploy-webhook.sh
```

### Opção B: GitHub Actions (Recomendado)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DO_HOST }}
          username: ${{ secrets.DO_USER }}
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd /var/www/seu-app
            git pull origin main
            npm install
            npm run build
            systemctl restart seu-app-service
```

Adicione secrets no GitHub:
- `DO_HOST`: IP do seu droplet
- `DO_USER`: user SSH (root ou app)
- `DO_SSH_KEY`: chave SSH privada

---

## Passo 6: Verificar Meta Tag no Site

Seu site Next.js deve ter a meta tag no `_document.tsx` ou layout:

```tsx
// pages/_document.tsx ou app/layout.tsx

import Document, { Html, Head, Main, NextScript } from 'next/document';

export default function MyDocument() {
  return (
    <Html>
      <Head>
        <meta 
          name="google-site-verification" 
          content="seu-codigo-de-verificacao-aqui" 
        />
        <meta property="og:title" content="Seu Site" />
        <meta property="og:description" content="Descrição" />
        <meta property="og:image" content="/og-image.jpg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

---

## Passo 7: Testar o Workflow Completo

### Teste 1: Via Webhook Manual

```bash
# No seu terminal local:
curl -X POST https://seu-n8n.com/webhook/github-deploy \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "ref": "refs/heads/main",
    "after": "abc1234567890def",
    "repository": {
      "full_name": "seu-usuario/seu-repo",
      "owner": {
        "avatar_url": "https://avatars.githubusercontent.com/u/123?v=4"
      }
    },
    "pusher": {
      "name": "Test User"
    }
  }'
```

### Teste 2: Via GitHub (Push Real)

```bash
git add .
git commit -m "Test deploy trigger"
git push origin main
```

### Esperado:
1. n8n recebe o webhook
2. Filtra para `refs/heads/main`
3. Aciona o deploy
4. Espera 30 segundos
5. Faz GET no seu site
6. Verifica a meta tag
7. Envia Slack + Email com resultado

---

## Passo 8: Variáveis de Ambiente do n8n

No painel de configuração do workflow, adicione estas variáveis:

| Nome | Valor | Exemplo |
|------|-------|---------|
| `GITHUB_WEBHOOK_ID` | ID único do webhook | `abc-123-def-456` |
| `DO_DEPLOY_WEBHOOK_URL` | URL do endpoint de deploy | `https://seu-droplet.com/api/deploy` |
| `DO_API_TOKEN` | Token de autenticação | `dop_v1_xxx...` |
| `SITE_URL` | URL do site | `https://seu-site.com.br` |
| `NOTIFICATION_EMAIL` | Email para notificações | `seu-email@gmail.com` |
| `SLACK_CHANNEL_ID` | ID do canal Slack | `C1234567890` |
| `DEPLOY_LOGS_URL` | URL dos logs | `https://seu-site.com.br/logs` |

---

## Passo 9: Monitoramento

### Ver logs do workflow:

1. No n8n, clique no workflow
2. Vá para **Executions**
3. Clique em cada execução para ver detalhes

### Debugging:

Se o workflow falhar:

1. Verifique o **erro específico** na execução
2. Teste cada node isoladamente:
   - GitHub Webhook: Envie dados de teste
   - Deploy: Teste se o endpoint está respondendo
   - Fetch Website: Teste se o site está acessível
   - Check Meta Tags: Verifique a lógica no Code node
   - Slack/Email: Teste credenciais

---

## Troubleshooting

### Problema: Webhook não é acionado

```bash
# 1. Verifique se o endpoint n8n está acessível
curl https://seu-n8n.com/webhook/github-deploy

# 2. Verifique logs do n8n
docker logs n8n-container

# 3. No GitHub Settings → Webhooks, veja o histórico de tentativas
```

### Problema: Deploy não executa

- Verifique se o endpoint `DO_DEPLOY_WEBHOOK_URL` está correto
- Teste o endpoint manualmente:
  ```bash
  curl -X POST https://seu-droplet.com/api/deploy \
    -H "Authorization: Bearer seu-token" \
    -d '{"branch":"main"}'
  ```

### Problema: Meta tag não é encontrada

- Verifique se a meta tag está no HTML:
  ```bash
  curl https://seu-site.com.br | grep "google-site-verification"
  ```
- Se não aparecer, verifique `_document.tsx` ou layout
- Espere cache limpar (5-10 minutos)

### Problema: Notificações não chegam

**Para Slack:**
- Verifique se o webhook URL está correto
- Teste no Slack: **Apps → Manage apps → Custom integrations → Incoming Webhooks**

**Para Email:**
- Verifique credenciais Gmail/SMTP em **Credentials**
- Se Gmail, gere App Password: https://myaccount.google.com/apppasswords

---

## Estrutura Final

```
seu-repo/
├── .github/workflows/
│   └── deploy.yml                    (GitHub Actions - opcional)
├── pages/ ou app/
│   └── _document.tsx ou layout.tsx   (Meta tag Google)
├── .env
├── .env.production
└── n8n-workflows/
    └── github-deploy-n8n-workflow.json (Seu workflow importado)
```

---

## Resumo de URLs/Tokens Necessários

1. **n8n**
   - URL: `https://seu-n8n.com`
   - API Key: `seu-token-n8n`

2. **GitHub**
   - Webhook URL em Settings
   - Token pessoal (opcional): `ghp_xxx`

3. **DigitalOcean**
   - Droplet IP/Host
   - Deploy webhook endpoint
   - API Token (opcional)

4. **Slack**
   - Webhook URL: `https://hooks.slack.com/services/...`
   - Channel ID: `C1234567890`

5. **Gmail/SMTP**
   - Email: `seu-email@gmail.com`
   - App Password ou senha

---

## Próximas Melhorias

- Adicionar verificação de status HTTP (200 OK)
- Rollback automático se deploy falhar
- Registrar logs em banco de dados
- Dashboard com histórico de deployments
- Alertas no Discord/Telegram
- Execução condicional por arquivo alterado

