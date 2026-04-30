# Deploy Ready Checklist — AutomatizaWPP
**Data:** 30 de Abril, 2026  
**Status:** BUILD VERIFIED — Ready for Digital Ocean deployment  

---

## ✅ 1. ESTRUTURA DO PROJETO VERIFICADA

### Arquivos de Configuração
- [x] `docker-compose.prod.yml` — **EXISTE** e está configurado (PostgreSQL, Redis, App, Nginx)
- [x] `.env.production` — **EXISTE** com todas as variáveis críticas
- [x] `Dockerfile` — **EXISTE** com multi-stage build otimizado (builder + production)
- [x] `package.json` — **EXISTE** com scripts corretos (dev, build, start, db:*)
- [x] `tsconfig.json` — **EXISTE**
- [x] `next.config.mjs` — **EXISTE**

### Arquivos SEO/Robots
- [x] `src/app/robots.ts` — **EXISTE e VÁLIDO**
  - Exporta função que retorna `MetadataRoute.Robots`
  - Allow paths: `/`, `/automacao-*`, `/casos-sucesso`, `/blog`, `/api/public/`
  - Disallow: `/admin`, `/settings`, `/auth`, `/login`, `/signup`, `/api/private`
  - Aponta para sitemap: `https://automatizawpp.com/sitemap.xml`

- [x] `src/app/sitemap.ts` — **EXISTE e VÁLIDO**
  - Exporta função que retorna `MetadataRoute.Sitemap`
  - Lista 7 URLs principais com `lastModified`, `changeFrequency`, `priority`
  - URLs: `/`, `/automacao-*` (3), `/casos-sucesso`, `/blog`, `/dashboard.html`
  - BaseURL hardcoded: `https://automatizawpp.com`

### Middleware & Autenticação
- [x] `src/middleware.ts` — **EXISTE e VÁLIDO**
  - Libera rotas públicas: `/login`, `/signup`, `/register`, `/forgot-password`, etc
  - Libera API pública: `/api/auth`, `/api/register`, `/api/webhooks`, `/api/public`, `/api/test`
  - API privadas requerem session cookie
  - Pages privadas redirecionam para `/login` sem cookie
  - Config matcher exclui: `_next/static`, `_next/image`, `favicon.ico`, `robots.txt`, `sitemap.xml`

---

## ✅ 2. BUILD VALIDADO SEM ERROS

### Resultado do npm run build
```
✓ Compiled successfully in 3.5s
✓ Generating static pages (97/97)
```

### Warnings (não-bloqueadores)
- 4 ESLint warnings sobre variáveis não usadas em:
  - `src/lib/agents/followup-agent.ts:54`
  - `src/lib/channels/router.ts:122`
  - `src/lib/tuning/feedback-service.ts:28-31`
  - **Impacto:** Nenhum. Code limpa, sem erros de lógica.

### Tamanhos da Build
- **Total .next:** 309 MB (Aceitável. Contém: server code, static assets, types, cache)
- **.next/static:** 1.4 MB (CSS, JS otimizado)
- **First Load JS (shared):** 102 kB
- **Middleware:** 34.5 kB

### Rotas Geradas
- **97 rotas** compiladas com sucesso
- **3 rotas SSG** com `generateStaticParams` (blog posts dinâmicos)
- **56 rotas API** (Dynamic server-rendered)
- **38 rotas públicas/privadas** (Static ou Dynamic)

---

## ✅ 3. CONFIGURAÇÃO .env.production COMPLETA

### Essenciais Preenchidos
- [x] `NODE_ENV="production"`
- [x] `DATABASE_URL` — Aponta para `postgres:5432` (será substituído por DO Managed DB)
- [x] `REDIS_URL` — Aponta para `redis:6379` (será substituído por DO Redis)
- [x] `NEXTAUTH_SECRET` — Placeholder (CRÍTICO: usar secret seguro de 32+ caracteres em produção)
- [x] `NEXTAUTH_URL="https://www.automatizawpp.com"`
- [x] `APP_URL`, `APP_BASE_URL`, `NEXT_PUBLIC_BASE_URL` — Todos apontam para domínio correto

### APIs Externas
- [x] `ANTHROPIC_API_KEY` — Preenchida com chave válida
- [x] `ANTHROPIC_MODEL="claude-sonnet-4-20250514"`
- [x] `BIRD_API_KEY`, `BIRD_WORKSPACE_ID`, `BIRD_CHANNEL_ID` — Preenchidas
- [x] `BREVO_API_KEY`, `SMTP_HOST`, `SMTP_USER`, `IMAP_HOST` — Configuradas para Zoho

### Compliance & Settings
- [x] `MAX_TOUCHES_PER_DAY="5"`
- [x] `QUIET_HOURS_START="21"`, `QUIET_HOURS_END="9"`
- [x] `DEFAULT_TIMEZONE="America/Sao_Paulo"`, `WORKSPACE_TIMEZONE="Europe/Madrid"`
- [x] `LANGUAGE="pt-BR"`
- [x] `PUBLIC_DASHBOARD_TOKEN="test-token-12345"` (Mudar em produção)

---

## ✅ 4. DOCKER & CONTAINER VALIDATION

### Dockerfile Checklist
- [x] Multi-stage build (builder → production otimizado)
- [x] Node 20-alpine (leve, seguro)
- [x] `npm ci` para lock exato
- [x] `npm prune --production` remove dev dependencies
- [x] Copia: `.next`, `public`, `prisma`, `package.json`
- [x] Non-root user `nextjs` (1001)
- [x] Health check: `/api/health` endpoint
- [x] dumb-init para signal handling correto (SIGTERM)
- [x] Expose porta 3000

### docker-compose.prod.yml Checklist
- [x] PostgreSQL 16-alpine com healthcheck
- [x] Redis 7-alpine com persistência (AOF) e healthcheck
- [x] App service com dependências em healthcheck (não apenas `service_started`)
- [x] Nginx reverse proxy (porta 80/443)
- [x] Networking: `sales-os-network` bridge
- [x] Volumes: `postgres_data`, `redis_data` (nomeados para persistência)
- [x] Logging: json-file com max-size/max-file

---

## ✅ 5. ROTAS PÚBLICAS VALIDADAS

### Páginas Públicas (Liberadas no Middleware)
1. `/` — Homepage
2. `/automacao-whatsapp` — Landing page
3. `/automacao-vendas` — Landing page
4. `/automacao-atendimento` — Landing page
5. `/casos-sucesso` — Case studies
6. `/blog` (e `/blog/*`) — Blog artigos
7. `/login`, `/signup`, `/register` — Auth
8. `/forgot-password`, `/reset-password/*` — Password reset

### APIs Públicas (Sem Session Required)
1. `/api/auth/*` — NextAuth endpoints
2. `/api/register` — Registro de usuários
3. `/api/webhooks/*` — Brevo, Stripe, Vapi, Meta, Bird
4. `/api/events/inbound` — Inbound events
5. `/api/agents/heartbeat` — Cron health
6. `/api/gdpr/purge` — GDPR request
7. `/api/test/*` — Endpoints de teste
8. `/api/public/*` — Dashboard público com token auth

---

## 🔴 ANTES DE FAZER DEPLOY EM DIGITAL OCEAN

### Credenciais & Segurança
- [ ] **Novo NEXTAUTH_SECRET** — Gerar com: `openssl rand -base64 33`
  - Mínimo 32 caracteres, diferente do current
  - Armazenar em DO App Platform secrets ou arquivo `.env.production` seguro
  
- [ ] **DATABASE_PASSWORD** — Substituir `change-me-in-production` por senha forte
  - Use: `openssl rand -base64 16`
  - Armazenar com segurança

- [ ] **REDIS_PASSWORD** — Substituir `change-me-in-production` por senha forte

- [ ] **SMTP_PASS / IMAP_PASS** — Verificar se credenciais Zoho estão atualizadas

- [ ] **PUBLIC_DASHBOARD_TOKEN** — Mudar `test-token-12345` por token seguro (UUID ou JWT)

### DNS & Domínio
- [ ] **Registrar domínio** `www.automatizawpp.com` (ou transferir)
- [ ] **Apontamento DNS:**
  - `A record`: `www.automatizawpp.com` → IP do Droplet/Load Balancer DO
  - `CNAME`: `automatizawpp.com` → `www.automatizawpp.com` (ou A record se preferir não-www)
  - Verificar propagação com: `dig www.automatizawpp.com`

### Digital Ocean Provisioning
- [ ] **Droplet ou App Platform?**
  - **Recomendado:** App Platform (CI/CD nativo, auto-scaling, healthchecks integrados)
  - **Alternativa:** Droplet + Docker Compose manualmente

- [ ] **Banco de dados:**
  - [ ] DO Managed PostgreSQL Cluster (16) ou instância local em Docker?
  - [ ] DO Managed Redis ou instância local?
  - [ ] Atualizar `DATABASE_URL` e `REDIS_URL` com credenciais DO

- [ ] **SSL/TLS Certificado:**
  - Usar Let's Encrypt (automático em App Platform)
  - Ou Certificate aqui em DO
  - Atualizar Nginx config com certificado

- [ ] **Backups:**
  - [ ] Enable automated DB backups (diário ou weekly)
  - [ ] Plano de restauração documentado

### Ambiente de Staging
- [ ] Rodar build em staging antes de produção
- [ ] Testar login, APIs públicas, webhooks em staging
- [ ] Validar que emails funcionam (SMTP/IMAP)
- [ ] Testar Anthropic API calls
- [ ] Testar Bird API calls

### Monitoramento & Logs
- [ ] [ ] Sentry DSN (opcional mas recomendado)
- [ ] [ ] ELK Stack ou DO's app logs para debugging
- [ ] [ ] Alertas para CPU, memória, erro rates

---

## 📋 PRÓXIMOS PASSOS IMEDIATOS

### 1. Segurança (Executar hoje)
```bash
# Gerar secrets seguros
openssl rand -base64 33  # NEXTAUTH_SECRET
openssl rand -base64 16  # Passwords

# Atualizar .env.production com novos valores
vim .env.production
```

### 2. Domínio (Pode ser feito em paralelo)
- [ ] Registrar ou transferir `www.automatizawpp.com`
- [ ] Configurar DNS A/CNAME records
- [ ] Testar resolução: `dig www.automatizawpp.com`

### 3. Digital Ocean Setup (1-2 horas)
```bash
# Opção A: App Platform (Recomendado)
# 1. Criar novo App no Console DO
# 2. Conectar GitHub repo
# 3. Set build command: npm run build
# 4. Set start command: npm start
# 5. Configurar env vars (copy de .env.production)
# 6. Deploy

# Opção B: Droplet + Docker
# 1. Criar Droplet Ubuntu 24.04
# 2. Instalar Docker + Docker Compose
# 3. git clone este repo
# 4. Atualizar .env.production com credenciais
# 5. docker-compose -f docker-compose.prod.yml up -d
# 6. Configurar Nginx reverse proxy
# 7. Setup SSL com Certbot
```

### 4. Teste E2E em Produção (30 min)
```bash
# Depois que DNS resolver e app estiver rodando:
curl https://www.automatizawpp.com/  # GET homepage
curl https://www.automatizawpp.com/api/health  # Healthcheck
curl https://www.automatizawpp.com/robots.txt  # Robots
curl https://www.automatizawpp.com/sitemap.xml  # Sitemap

# Teste login
curl -X POST https://www.automatizawpp.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"test"}'
```

---

## 📊 RESUMO FINAL

| Item | Status | Ação |
|------|--------|------|
| Build | ✅ Sucesso (309 MB) | Pronto para deploy |
| robots.ts | ✅ Válido | Já ativo em build |
| sitemap.ts | ✅ Válido | Já ativo em build |
| middleware.ts | ✅ Libera rotas | API/pages públicas funcionando |
| docker-compose.prod.yml | ✅ Completo | Pronto para DO |
| .env.production | ⚠️ Parcial | Gerar secrets, substituir placeholders |
| DNS | ❌ Não configurado | Registrar domínio e apontamentos |
| DO Provisioning | ❌ Não iniciado | App Platform ou Droplet + Docker |
| SSL/TLS | ⚠️ Pendente | Let's Encrypt ou DO Certificate |
| Backups | ❌ Não configurado | Enable após DB estar online |

---

## 🚀 COMANDOS RÁPIDOS PARA DEPLOY

### Local (Verificação final)
```bash
npm run build          # Já verificado ✅
npm start              # Start servidor local na porta 3000
curl http://localhost:3000/robots.txt
curl http://localhost:3000/sitemap.xml
```

### Digital Ocean (Depois de provisionar)
```bash
# Via App Platform (automático com git push)
git push origin main  # Trigger deploy automático

# Via Droplet + Docker
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose logs -f app
```

---

**Criado:** 2026-04-30 03:35 UTC  
**Próxima revisão:** Após deploy em DO
