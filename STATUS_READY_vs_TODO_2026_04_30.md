# Status: Ready vs TODO — AutomatizaWPP Deploy
**30 de Abril, 2026**

---

## ✅ PRONTOS PARA DEPLOY (Code + Config)

### 1. Build & Compilation
- [x] `npm run build` executa com sucesso
- [x] 97 rotas compiladas (38 static, 56 dynamic, 3 SSG)
- [x] Zero erros TypeScript
- [x] Zero erros de build
- [x] Build size: 309 MB (.next)

### 2. SEO & Robots
- [x] `src/app/robots.ts` exporta corretamente
- [x] `src/app/sitemap.ts` lista todas as URLs públicas
- [x] Robots apontando para sitemap correto
- [x] Middleware não bloqueando /robots.txt e /sitemap.xml

### 3. Segurança & Middleware
- [x] `src/middleware.ts` implementado
- [x] Rotas públicas liberadas (login, signup, auth, webhooks)
- [x] Rotas privadas protegidas (session required)
- [x] API públicas identificadas (/api/auth, /api/register, /api/webhooks)
- [x] API privadas requerem cookie (/api/leads, /api/calls, etc)

### 4. Docker & Deployment Config
- [x] `Dockerfile` multi-stage otimizado
- [x] `docker-compose.prod.yml` com PostgreSQL, Redis, App, Nginx
- [x] Non-root user (nextjs)
- [x] Health checks configurados
- [x] Logging estruturado
- [x] Volumes persistentes (postgres_data, redis_data)

### 5. Environment Setup
- [x] `.env.production` existe com todas as seções
- [x] NODE_ENV = "production"
- [x] DATABASE_URL estruturado
- [x] REDIS_URL estruturado
- [x] NEXTAUTH_URL = "https://www.automatizawpp.com"
- [x] APP_* URLs apontando para domínio correto
- [x] Anthropic API key preenchida
- [x] Bird API configurado
- [x] Brevo/SMTP/IMAP configurados

### 6. Documentação & Guides
- [x] DEPLOY_READY_CHECKLIST_2026_04_30.md (criado)
- [x] VERIFICATION_REPORT_2026_04_30.txt (criado)
- [x] QUICK_COMMANDS_2026_04_30.sh (criado)
- [x] DEPLOYMENT_SUMMARY_2026_04_30.md (criado)

---

## ❌ FALTANDO (Ações Manuais Necessárias)

### 1. Segurança: Gerar Secrets Novos
**Ação:** Executar estes comandos e copiar valores para `.env.production`

```bash
# NEXTAUTH_SECRET — Mínimo 32 caracteres
openssl rand -base64 33

# DATABASE_PASSWORD
openssl rand -base64 16

# REDIS_PASSWORD
openssl rand -base64 16

# PUBLIC_DASHBOARD_TOKEN
openssl rand -hex 32
```

**Arquivos a atualizar:**
- `/.env.production` — substituir placeholders

**Criticidade:** 🔴 CRÍTICO (impede login e integrações)

---

### 2. Domínio & DNS
**Ação:** 
1. Registrar domínio `www.automatizawpp.com` ou transferir registrante
2. Configurar apontamentos DNS:
   - A record: `www.automatizawpp.com` → [IP_DO_DROPLET]
   - Opcional: CNAME `automatizawpp.com` → `www.automatizawpp.com`

**Onde fazer:** Registrante (Namecheap, GoDaddy, Hostinger, etc)

**Tempo estimado:** 15 min + 1-2h para propagação DNS

**Criticidade:** 🔴 CRÍTICO (sem domínio, não há deploy)

---

### 3. Digital Ocean: Provisioning
**Ação:** Escolher uma das 2 opções e executar:

#### Opção A: App Platform (Recomendado)
- Criar novo App no console.digitalocean.com
- Conectar GitHub repo
- Build command: `npm run build`
- Start command: `npm start`
- Configurar env vars (copiar `.env.production`)
- Deploy automático

**Tempo:** ~30 min

#### Opção B: Droplet + Docker
- Criar Droplet Ubuntu 24.04
- Instalar Docker + Docker Compose
- Git clone do repo
- Atualizar `.env.production` com credenciais
- `docker-compose -f docker-compose.prod.yml up -d --build`

**Tempo:** ~1h

**Criticidade:** 🔴 CRÍTICO (precisa ser feito antes do deploy)

---

### 4. Digital Ocean: Banco de Dados
**Ação:** Escolher:

- [x] **Opção A:** DO Managed PostgreSQL + DO Managed Redis
  - Criar clusters em DO console
  - Atualizar DATABASE_URL e REDIS_URL em `.env.production`
  - Tempo: ~20 min

- [x] **Opção B:** Instâncias locais em Docker (docker-compose.prod.yml já tem)
  - Usar PostgreSQL + Redis locais
  - Manter DATABASE_URL e REDIS_URL como estão
  - Configurar volumes para persistência
  - Tempo: ~5 min

**Criticidade:** 🟡 ALTA (sem BD, app não funciona)

---

### 5. SSL/TLS Certificate
**Ação:**

- Se usando **App Platform:** Automático (Let's Encrypt)
- Se usando **Droplet + Docker:**
  ```bash
  sudo apt-get install certbot python3-certbot-nginx
  sudo certbot certonly --standalone -d www.automatizawpp.com
  ```
  Depois atualizar Nginx config em docker-compose.prod.yml

**Tempo:** ~15 min

**Criticidade:** 🟡 ALTA (produção sem SSL é inseguro)

---

### 6. Backups (Pós-Deploy)
**Ação:**
- Configurar backups automáticos da BD no DO console
- Documentar plano de restauração
- Configurar health monitoring

**Tempo:** ~30 min

**Criticidade:** 🟢 MÉDIA (pode fazer após deploy)

---

### 7. Monitoramento (Pós-Deploy)
**Ação:**
- [Opcional] Configurar Sentry para error tracking
- [Opcional] Configurar logs centralizados (ELK ou DO apps logs)
- [Opcional] Configurar alertas (CPU, memória, error rates)

**Tempo:** ~1h

**Criticidade:** 🟢 BAIXA (nice-to-have)

---

## Timeline para Deploy

### Hoje (4-5 horas)
1. Gerar secrets: 15 min ⏱️
2. Atualizar .env.production: 10 min ⏱️
3. Registrar domínio: 15 min ⏱️ (+ 1-2h propagação DNS)
4. Digital Ocean setup: 1-2h ⏱️
5. Deploy: 30 min ⏱️
6. Testes: 30 min ⏱️

### Próximos dias (Pós-Deploy)
- Backups
- Monitoramento
- Verificação de performance

---

## Checklist de Execução

### Antes de fazer deploy
- [ ] Gerar NEXTAUTH_SECRET
- [ ] Gerar DATABASE_PASSWORD
- [ ] Gerar REDIS_PASSWORD
- [ ] Atualizar `.env.production`
- [ ] Registrar domínio
- [ ] Configurar DNS A record
- [ ] Escolher App Platform ou Droplet
- [ ] Provisionar infraestrutura DO
- [ ] Fazer deploy

### Após deploy
- [ ] Testar `https://www.automatizawpp.com/api/health`
- [ ] Testar `https://www.automatizawpp.com/robots.txt`
- [ ] Testar `https://www.automatizawpp.com/sitemap.xml`
- [ ] Testar login
- [ ] Testar APIs públicas
- [ ] Configurar SSL/TLS
- [ ] Configurar backups
- [ ] Verificar logs

---

## Resumo: O Que Você Precisa Fazer

| Tarefa | Tempo | Criticidade | Instruções |
|--------|-------|-------------|-----------|
| Gerar secrets | 15 min | 🔴 | Ver QUICK_COMMANDS_2026_04_30.sh |
| Registrar domínio | 15 min | 🔴 | Seu registrante (Namecheap, etc) |
| Configurar DNS | 15 min | 🔴 | Seu registrante + aguardar propagação |
| DO: App Platform | 30 min | 🔴 | console.digitalocean.com |
| DO: Droplet + Docker | 1h | 🔴 | SSH + docker-compose up |
| DO: BD Provisioning | 20 min | 🟡 | DO Managed ou Docker local |
| SSL/TLS | 15 min | 🟡 | App Platform (automático) ou Certbot |
| Backups | 30 min | 🟢 | Após deploy estar online |
| Monitoramento | 1h | 🟢 | Sentry + logs (opcional) |

---

**Status Final:** Código 100% pronto. Faltam apenas decisões infraestruturais e configuração manual de domínio/DNS.
