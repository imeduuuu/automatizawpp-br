# Pre-Deploy Checklist

Valide todos os itens abaixo antes de executar o deploy final para DigitalOcean.

---

## Build & Dependencies

- [ ] **npm run build completa sem erros**
  ```bash
  npm run build
  ```
  Procure por linhas com `error` ou `failed`. Se houver, corrija antes de prosseguir.

- [ ] **node_modules existe e está completo**
  ```bash
  ls -la node_modules | head
  ```
  Se vazio ou faltando, execute: `npm install`

- [ ] **Versão do Node.js é compatível**
  ```bash
  node --version
  ```
  Esperado: v18.x ou v20.x (confira package.json engines)

---

## Docker Configuration

- [ ] **docker-compose.prod.yml existe**
  ```bash
  ls -la docker-compose.prod.yml
  ```
  Arquivo deve estar na raiz do projeto.

- [ ] **docker-compose.prod.yml é válido**
  ```bash
  docker-compose -f docker-compose.prod.yml config > /dev/null
  ```
  Se tiver erro, corrija antes de prosseguir.

- [ ] **Docker e Docker Compose instalados no servidor**
  ```bash
  docker --version
  docker-compose --version
  ```
  Mínimo: Docker 20.10, Docker Compose 2.0

---

## Environment Variables

- [ ] **.env.production existe e está preenchido**
  ```bash
  ls -la .env.production
  cat .env.production | grep -v "^#" | grep "="
  ```

- [ ] **DATABASE_URL configurado**
  ```bash
  grep DATABASE_URL .env.production
  ```
  Formato esperado: `postgresql://user:pass@host:port/dbname`

- [ ] **REDIS_URL configurado (se usado)**
  ```bash
  grep REDIS_URL .env.production
  ```
  Formato esperado: `redis://host:port`

- [ ] **ANTHROPIC_API_KEY configurado**
  ```bash
  grep ANTHROPIC_API_KEY .env.production
  ```
  Valor deve estar presente (não exibir a senha, apenas confirmar)

- [ ] **API Keys e Secrets não estão em git**
  ```bash
  git status
  ```
  Confirme que .env.production não aparece (deve estar em .gitignore)

- [ ] **.env.production não será commitado**
  ```bash
  grep ".env.production" .gitignore
  ```
  Padrão esperado: `*.env.local`, `*.env.production`, etc

---

## Domain & SSL

- [ ] **Domínio DNS configurado**
  - Domínio: `automatizawpp.com`
  - Tipo de record: `A`
  - IP: Droplet IP do DigitalOcean (ex: 123.45.67.89)
  - TTL: 3600 ou menor (para propagação rápida)
  
  Teste:
  ```bash
  nslookup automatizawpp.com
  # Ou
  dig automatizawpp.com
  ```
  Esperado: retorna o IP do Droplet

- [ ] **SSL/HTTPS funcional**
  ```bash
  curl -I https://automatizawpp.com
  ```
  Esperado: HTTP 200-399, sem erros SSL

- [ ] **Certificado SSL válido**
  ```bash
  openssl s_client -connect automatizawpp.com:443 -servername automatizawpp.com < /dev/null | grep "Verify return code"
  ```
  Esperado: `Verify return code: 0 (ok)`

---

## SEO & Public Files

- [ ] **robots.txt acessível**
  ```bash
  curl -I https://automatizawpp.com/robots.txt
  ```
  Esperado: HTTP 200

- [ ] **robots.txt contém sitemap**
  ```bash
  curl https://automatizawpp.com/robots.txt | grep sitemap
  ```
  Esperado: linha com `Sitemap: https://automatizawpp.com/sitemap.xml`

- [ ] **sitemap.xml acessível**
  ```bash
  curl -I https://automatizawpp.com/sitemap.xml
  ```
  Esperado: HTTP 200

- [ ] **sitemap.xml é válido XML**
  ```bash
  curl https://automatizawpp.com/sitemap.xml | head -20
  ```
  Esperado: começa com `<?xml version="1.0"?>`

- [ ] **sitemap.xml contém URLs**
  ```bash
  curl https://automatizawpp.com/sitemap.xml | grep "<loc>" | wc -l
  ```
  Esperado: número > 0

---

## Application Health

- [ ] **Homepage acessível**
  ```bash
  curl -I https://automatizawpp.com/
  ```
  Esperado: HTTP 200

- [ ] **Homepage renderiza (sem JavaScript errors)**
  ```bash
  curl https://automatizawpp.com/ | grep "<title>" | head -1
  ```
  Esperado: contém título da página

- [ ] **API endpoints acessíveis**
  ```bash
  curl -I https://automatizawpp.com/api/health
  ```
  Se houver endpoint `/api/health`, esperado: HTTP 200

- [ ] **Docker logs sem erros críticos**
  ```bash
  docker-compose -f docker-compose.prod.yml logs --tail 50
  ```
  Procure por `panic`, `fatal`, `error` — se houver, investigue

---

## Security

- [ ] **Não exponha dados sensíveis**
  - Confirme que `/api/*` endpoints validam autenticação
  - Teste acesso sem token: `curl https://automatizawpp.com/api/private`
  - Esperado: HTTP 401 ou 403 (não 200)

- [ ] **CORS configurado corretamente**
  - Se frontend chama backend externo, confirme CORS headers
  - Teste: `curl -H "Origin: https://app.example.com" https://automatizawpp.com/api/data`

- [ ] **Security headers presentes**
  ```bash
  curl -I https://automatizawpp.com | grep -i "Content-Security-Policy\|X-Frame-Options\|X-Content-Type-Options"
  ```
  Esperado: pelo menos alguns headers presentes

---

## Database & Services

- [ ] **Banco de dados acessível do Droplet**
  ```bash
  psql $DATABASE_URL -c "SELECT 1;"
  ```
  Ou via Docker:
  ```bash
  docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d automatizawpp -c "SELECT 1;"
  ```
  Esperado: saída sem erro, mostra `1`

- [ ] **Migrations executadas**
  ```bash
  docker-compose -f docker-compose.prod.yml logs | grep -i "migration"
  ```
  Esperado: log mostra que migrations rodaram

- [ ] **Redis acessível (se usado)**
  ```bash
  docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
  ```
  Esperado: `PONG`

---

## Backup & Disaster Recovery

- [ ] **Backup do banco de dados feito**
  ```bash
  pg_dump $DATABASE_URL > automatizawpp_$(date +%Y%m%d).sql
  # Ou via Droplet
  ssh root@<droplet-ip> "pg_dump -U postgres automatizawpp > /backups/automatizawpp_$(date +%Y%m%d).sql"
  ```

- [ ] **Backup armazenado fora do servidor**
  - Upload para AWS S3, Google Drive, ou similar
  - Teste restauração em ambiente local

---

## Monitoring & Logging

- [ ] **Log rotation configurado**
  - Docker logs devem ser rotacionados (não crescer indefinidamente)
  - Verifique docker-compose.prod.yml tem `logging` config

- [ ] **Error tracking configurado (se usar Sentry, Datadog, etc)**
  - Confirme SENTRY_DSN ou equivalente em .env.production
  - Teste: gere um erro e confirme que aparece no dashboard

---

## Final Verification

- [ ] **Tudo acima foi validado**
  
- [ ] **Nenhum bloqueador encontrado**

- [ ] **Time está ciente do deploy**

- [ ] **Rollback plan existe**
  - Se problema acontecer, sabe-se como reverter?
  - Script de backup dos dados está pronto?

---

## Deploy Command

Se tudo acima passou, execute:

```bash
./scripts/deploy-do.sh
```

Ou manualmente:

```bash
git pull origin main
npm run build
docker-compose -f docker-compose.prod.yml up -d
```

---

## Post-Deploy

Após deploy, valide:

1. **Acesso ao site:**
   ```bash
   curl -I https://automatizawpp.com
   ```

2. **Logs não têm erros:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail 100
   ```

3. **Google Search Console:**
   - Submeta o sitemap
   - Aguarde 3-5 dias para indexação

4. **Analytics:**
   - Configure Google Analytics (se não estiver)
   - Verifique que eventos estão sendo registrados

---

## Troubleshooting Links

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Connection Issues](https://www.postgresql.org/docs/current/libpq-envars.html)
- [SSL Certificate Problems](https://support.google.com/domains/answer/3437971)
- [robots.txt Syntax](https://www.robotstxt.org/)
- [Sitemap XML Format](https://www.sitemaps.org/protocol.html)

---

**Checklist preparado em:** 2026-04-30  
**Próxima revisão:** Após cada major deploy
