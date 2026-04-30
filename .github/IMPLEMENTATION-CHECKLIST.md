# Implementation Checklist - Deploy Persistente

## Pre-Implementation (Preparação)

### GitHub Repository
- [ ] Repository é público ou private com access
- [ ] Branch `main` existe e protegido (opcional)
- [ ] `.gitignore` inclui: `.env`, `.env.production`, secrets

### DigitalOcean Account
- [ ] Conta criada em https://digitalocean.com
- [ ] API Token gerado (Settings → API → Tokens)
- [ ] SSH key adicionada (Account → Security → SSH Keys)
- [ ] Quota: Mínimo 1 droplet disponível

### Local Environment
- [ ] Git configurado com credenciais GitHub
- [ ] Docker instalado localmente (para testar)
- [ ] SSH key local gerada (`ssh-keygen -t ed25519`)

---

## Step 1: Preparar Secrets no GitHub

### Acessar GitHub Secrets
```
1. GitHub → Settings → Secrets and variables → Actions
2. Clique em "New repository secret"
```

### Secrets Obrigatórios (7)

#### 1. DO_TOKEN
```
Valor: Token da API DigitalOcean
Obter: DigitalOcean → Settings → API → Personal access tokens
       Criar novo → Copy token (aparece uma vez)
Formato: dop_v1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

- [ ] Criado
- [ ] Testado com: doctl auth init
```

#### 2. DO_DROPLET_NAME
```
Valor: Nome do droplet (ex: "sales-os-prod")
Usar: sales-os-prod (consistente com workflow)
Formato: string sem espaços, apenas hífens

- [ ] Criado com valor: sales-os-prod
```

#### 3. DO_SSH_PRIVATE_KEY
```
Valor: Conteúdo da chave privada SSH
Obter: 
  - Se você tem SSH key: cat ~/.ssh/id_ed25519
  - Se não tem: ssh-keygen -t ed25519 -f ~/.ssh/do_deploy
Copiar: Conteúdo inteiro (-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----)

IMPORTANTE: Não inclua este arquivo no repo!

- [ ] SSH key gerada (se necessário)
- [ ] Chave privada adicionada ao secret
- [ ] Chave pública adicionada ao DigitalOcean
```

#### 4. ANTHROPIC_API_KEY
```
Valor: Sua chave API Anthropic
Obter: https://console.anthropic.com/account/keys
       Criar nova → Copy (sk-ant-...)
Formato: sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

- [ ] Criada
- [ ] Copiada corretamente
```

#### 5. DATABASE_PASSWORD
```
Valor: Senha forte para PostgreSQL
Gerar: openssl rand -base64 32
Formato: string aleatória de 32+ caracteres

Exemplo:
  Xq8kL2mN9pR5jV7bC3dH8gF4eW6qT1sU+/=

- [ ] Gerada com openssl
- [ ] Copiada inteira (sem cortes)
- [ ] Armazenada em lugar seguro (1Password, etc)
```

#### 6. REDIS_PASSWORD
```
Valor: Senha forte para Redis
Gerar: openssl rand -base64 32
Formato: string aleatória de 32+ caracteres

- [ ] Gerada com openssl
- [ ] Copiada inteira
- [ ] Diferente de DATABASE_PASSWORD
```

#### 7. NEXTAUTH_SECRET
```
Valor: Senha criptográfica para NextAuth
Gerar: openssl rand -base64 32
Formato: string aleatória de 32+ caracteres

- [ ] Gerada com openssl
- [ ] Copiada inteira
- [ ] Armazenada em lugar seguro
```

### Secrets Opcionais (Recomendados)

#### SLACK_WEBHOOK_URL (Para notificações)
```
Obter:
1. Slack workspace → Settings → Manage apps
2. Create New App → From scratch
3. Incoming Webhooks → Add New Webhook to Workspace
4. Copy URL: https://hooks.slack.com/services/T.../B.../xxx

- [ ] Slack app criado
- [ ] Webhook URL copiada
```

#### APP_URL
```
Valor: https://automatizawpp.com
Ou: Seu domínio customizado
Padrão: https://automatizawpp.com

- [ ] Definido como: https://automatizawpp.com
```

#### APP_DOMAIN
```
Valor: automatizawpp.com
Padrão: automatizawpp.com
Usado para: SSL Let's Encrypt

- [ ] Definido como: automatizawpp.com
```

#### BIRD_API_KEY, BIRD_WORKSPACE_ID, BIRD_CHANNEL_ID, BIRD_EMAIL_CHANNEL_ID
```
Obter: Bird.com → API settings
Apenas se usar Bird para WhatsApp/Email

- [ ] [ ] Opcionais (se não usar Bird, deixe vazio)
```

#### BREVO_API_KEY
```
Obter: brevo.com → API & Apps → API Keys
Apenas se usar Brevo para Email

- [ ] [ ] Opcional (se não usar, deixe vazio)
```

#### SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
```
Exemplo com Gmail:
  SMTP_HOST: smtp.gmail.com
  SMTP_PORT: 587
  SMTP_USER: seu-email@gmail.com
  SMTP_PASS: app-password (não sua senha, gerar em Security)
  MAIL_FROM: Automatiza WPP <noreply@automatizawpp.com>

- [ ] Configurados (se necessário)
```

---

## Step 2: Verificar Workflow

### Arquivo workflow
- [ ] Arquivo criado: `.github/workflows/deploy-persistent.yml`
- [ ] Conteúdo válido (sem syntax errors)
- [ ] Teste de sintaxe: 
  ```bash
  # Verificar YAML válido
  pip install pyyaml
  python -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-persistent.yml'))"
  ```

### Workflow Triggers
- [ ] Trigger: `on push → branches: [main]` ✅
- [ ] Trigger: `workflow_dispatch` (manual) ✅

---

## Step 3: Primeira Execução

### Git Push
```bash
# Adicionar arquivos
git add .github/workflows/deploy-persistent.yml
git add .github/DEPLOY-STRATEGY.md
git add .github/IMPLEMENTATION-CHECKLIST.md

# Commit
git commit -m "Add persistent dual-stack deployment workflow"

# Push
git push origin main
```

- [ ] Commit criado e pushed

### Monitorar Execução
```
GitHub → Actions → Deploy Persistent → Watch run
```

Stages esperados:
1. [ ] validate - Build Docker image
2. [ ] prepare-primary - Create/verify droplet
3. [ ] deploy-primary - Deploy code & services
4. [ ] deploy-fallback - Skip (só se primary falha)
5. [ ] report - Generate report

Tempo esperado: 20-30 minutos (primeira execução)

### Resultado Esperado
```
Primary deployment ✅ HEALTHY
└─ IP: [PRIMARY_IP]
   Status: ✅ PRIMARY ACTIVE
```

---

## Step 4: Pós-Deploy

### Copiar Primary IP
```bash
# De GitHub Actions output ou:
ssh root@[PRIMARY_IP] "curl -s http://localhost:3000/api/health"
# Deve retornar: {"status":"ok"} ou similar
```

- [ ] IP do primary copiado
- [ ] Health check manual passou

### Configurar DNS
```
Seu registrador de domínio (GoDaddy, Cloudflare, etc):

Tipo: A
Nome: automatizawpp.com
Valor: [PRIMARY_IP]

Ou CNAME:
Nome: www.automatizawpp.com
Valor: automatizawpp.com
```

- [ ] DNS A record atualizado
- [ ] DNS propagação aguardada (5-30 min)
- [ ] Teste: `nslookup automatizawpp.com`
  ```
  Deve retornar: [PRIMARY_IP]
  ```

### Testar HTTPS
```bash
curl https://automatizawpp.com/api/health
# Deve retornar 200 OK
```

- [ ] HTTPS funcionando
- [ ] SSL certificado válido
- [ ] Health check respondendo

### Atualizar Webhooks
Se usa Bird, Brevo, n8n:

1. Bird:
   - [ ] Webhook URL: https://automatizawpp.com/api/webhook/bird
   
2. Brevo:
   - [ ] Webhook URL: https://automatizawpp.com/api/webhook/brevo
   
3. n8n:
   - [ ] URLs atualizadas no dashboard

---

## Step 5: Validação Completa

### Testes Básicos
```bash
# Health check
curl https://automatizawpp.com/api/health

# API test
curl -X GET https://automatizawpp.com/api/[endpoint]

# SSH ao server
ssh root@[PRIMARY_IP]
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml ps
```

- [ ] Health check OK
- [ ] API respondendo
- [ ] Docker services rodando
- [ ] Logs sem erros críticos

### Monitoring
- [ ] GitHub Actions history visível
- [ ] Slack notificações recebidas (se configurado)
- [ ] DigitalOcean dashboard mostra droplet
- [ ] Backups habilitados (opcional)

---

## Step 6: Backup & Documentação

### Salvar Credenciais
```
Armazenar em 1Password, Vault, ou similar:
- DO_TOKEN
- DO_SSH_PRIVATE_KEY
- DATABASE_PASSWORD
- REDIS_PASSWORD
- NEXTAUTH_SECRET
- APP_DOMAIN
- PRIMARY_IP
```

- [ ] Credenciais armazenadas com segurança
- [ ] Backup de SSH private key local

### Documentação
```
Criar doc interno com:
- URLs de acesso
- Credenciais (links para vault)
- Procedimento de rollback
- Contatos de suporte
```

- [ ] Documentação criada
- [ ] Team notificado de mudanças

---

## Step 7: Testando Fallback (Opcional)

### Simular Falha do Primary
```bash
# SSH ao primary
ssh root@[PRIMARY_IP]

# Derrubar app (simular falha)
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml down

# Fazer novo push para main
git commit --allow-empty -m "Test fallback deployment"
git push origin main

# Ir a GitHub Actions e monitorar
```

Resultado esperado:
1. Primary deploy falha ❌
2. Fallback deploy inicia automaticamente
3. Fallback passa no health check ✅
4. Relatório: "⚠️ FALLBACK ACTIVE"
5. IP mostrado: [FALLBACK_IP]

- [ ] Fallback workflow testado e funciona
- [ ] Reiniciar primary após teste:
  ```bash
  ssh root@[PRIMARY_IP]
  docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml up -d
  ```

---

## Step 8: Operação Normal

### Cada Push a Main
```bash
git push origin main
→ GitHub Actions triggered automaticamente
→ Deploy automático
→ Health check automático
→ Relatório gerado
```

- [ ] Procedimento documentado para time
- [ ] Checklist de commits antes de push (testes locais)

### Monitoramento Contínuo
```bash
# Ver histórico de deploys
GitHub → Actions → Deploy Persistent

# Ver logs do server
ssh root@[PRIMARY_IP]
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs -f app

# Ver métricas
DigitalOcean Dashboard → Droplet → Metrics
```

- [ ] Time sabe como monitorar
- [ ] Alertas configurados (Slack)

---

## Troubleshooting Checklist

### Se Primary deployment falha

1. [ ] Verificar GitHub Actions logs
2. [ ] SSH ao droplet: `ssh root@[PRIMARY_IP]`
3. [ ] Ver Docker status: 
   ```bash
   docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml ps
   ```
4. [ ] Ver logs:
   ```bash
   docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs app
   ```
5. [ ] Causas comuns:
   - [ ] Falta espaço em disco: `df -h`
   - [ ] OOM (out of memory): `free -m`
   - [ ] Migration timeout: aumentar em `docker-compose.prod.yml`
   - [ ] Variável de ambiente faltando: revisar `.env.production`

### Se Fallback foi ativado

1. [ ] [ ] Atualizar DNS para [FALLBACK_IP]
2. [ ] [ ] Investigar por que primary falhou
3. [ ] [ ] Fazer fix e re-deploy
4. [ ] [ ] Após estabilizar, migrar de volta ao primary

### Se ambas falharam

1. [ ] [ ] Contato de escalação
2. [ ] [ ] Revisar todos os secrets
3. [ ] [ ] Verificar DigitalOcean token ainda válido
4. [ ] [ ] Verificar SSH key permissões
5. [ ] [ ] Rollback manual ao commit anterior (se necessário)

---

## Final Checklist

Deploy está pronto quando:

- [ ] 7 secrets obrigatórios configurados
- [ ] Workflow arquivo criado
- [ ] Primeiro deploy executado com sucesso
- [ ] Primary droplet criado e saudável
- [ ] DNS apontando para PRIMARY_IP
- [ ] HTTPS funcionando
- [ ] Health check respondendo
- [ ] Team notificado e treinado
- [ ] Documentação atualizada
- [ ] Credenciais armazenadas com segurança
- [ ] Plano de fallback compreendido

---

## Próximas Melhorias (Roadmap)

Depois de estável:

- [ ] Adicionar Floating IP para failover mais rápido
- [ ] Implementar backup automático PostgreSQL
- [ ] Adicionar monitoring (Sentry, DataDog, etc)
- [ ] Adicionar rate limiting / DDoS protection
- [ ] Implementar CI (testes antes de deploy)
- [ ] Adicionar staging environment
- [ ] Implementar blue-green deployment
- [ ] Adicionar database replication

---

## Contato & Suporte

Por problemas com o workflow:
- [ ] Revisar GitHub Actions logs
- [ ] Revisar DEPLOY-STRATEGY.md
- [ ] Contatar Eduardo Silva (eduardosilva)

---

**Status:** ✅ Ready for Production

Parabéns! Seu deploy persistente está operacional.
