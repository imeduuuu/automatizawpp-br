# Últimos Passos Após Deploy em Digital Ocean

**Data**: 2026-04-30
**Status**: Container iniciando em 143.198.46.37:3000

---

## ✅ O Que Já Foi Feito

- ✅ Build compilado e testado localmente
- ✅ Código sincronizado para Digital Ocean
- ✅ npm install e npm run build concluídos
- ✅ Docker image criada
- ✅ Container iniciando
- ✅ Nginx configurado como reverse proxy
- ✅ Database backup criado (seguro)
- ✅ PostgreSQL + Redis rodando

---

## 🔗 Próximos Passos (Após Container estar 100% pronto)

### 1. Verificar se Container está Respondendo

```bash
# SSH no droplet
ssh -i ~/.ssh/opencode_do_ed25519 root@143.198.46.37

# Verificar status
docker ps | grep automatizawppbr-sales-os-prod

# Testar endpoint
curl -s http://localhost:3000 | head -20
```

**Esperado**: HTTP 200, HTML da página inicial

### 2. Apontar DNS para Digital Ocean

**No seu registrador de domínio** (GoDaddy, Cloudflare, etc):

```
A Record:
  Name: @
  Value: 143.198.46.37
  TTL: 3600

CNAME Record:
  Name: www
  Value: automatizawpp.com
  TTL: 3600
```

**Tempo para propagar**: 5-30 minutos

### 3. Instalar SSL Certificate (Let's Encrypt)

Uma vez que DNS estiver apontando:

```bash
ssh -i ~/.ssh/opencode_do_ed25519 root@143.198.46.37

certbot certonly --nginx \
  -d automatizawpp.com \
  -d www.automatizawpp.com \
  --email admin@automatizawpp.com \
  --agree-tos \
  --non-interactive
```

### 4. Verificar HTTPS

```bash
curl -I https://www.automatizawpp.com
# Esperado: HTTP/2 200, Valid SSL cert
```

### 5. Testar Páginas Públicas

```bash
# Devem retornar 200 OK:
curl -I https://www.automatizawpp.com/automacao-whatsapp
curl -I https://www.automatizawpp.com/automacao-vendas
curl -I https://www.automatizawpp.com/automacao-atendimento
curl -I https://www.automatizawpp.com/casos-sucesso
curl -I https://www.automatizawpp.com/blog
```

### 6. Testar API Pública com Token

```bash
TOKEN="test-token-12345"

curl -H "Authorization: Bearer $TOKEN" \
  https://www.automatizawpp.com/api/public/leads | jq .
```

**Esperado**: JSON array de leads

### 7. Configurar Google Search Console

```
1. Ve a https://search.google.com/search-console
2. Add property: automatizawpp.com (Domain)
3. Verify via DNS TXT (seu registrador)
4. Submit sitemap: https://www.automatizawpp.com/sitemap.xml
5. Wait 24-48h para indexação
```

---

## 📋 Checklist de Validação

- [ ] Container respondendo em localhost:3000
- [ ] Nginx proxy funcionando
- [ ] DNS apontando para 143.198.46.37
- [ ] SSL cert instalado e válido
- [ ] HTTPS funcionando (verificar com curl -I)
- [ ] Páginas públicas carregando
- [ ] API respondendo com token
- [ ] Google Search Console configurado
- [ ] Sitemap submetido ao Google

---

## 📊 Monitoramento Pós-Deploy

### Verificar Logs em Tempo Real

```bash
ssh -i ~/.ssh/opencode_do_ed25519 root@143.198.46.37

# Logs da aplicação
docker logs -f automatizawppbr-sales-os-prod

# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Health Check

```bash
curl https://www.automatizawpp.com/api/health
# Esperado: { "status": "ok", "timestamp": "..." }
```

### Métricas

```bash
# CPU/Memory
docker stats automatizawppbr-sales-os-prod

# Database connection
docker exec -it automatizawppbr_postgres_1 psql -U postgres -c "SELECT 1"
```

---

## 🔒 Backups & Segurança

### Backup Automático do Droplet

```bash
# Habilitar backups (Digital Ocean Console)
doctl compute droplet enable-backups automatizawppbr
```

### Backup Manual de Database

```bash
ssh -i ~/.ssh/opencode_do_ed25519 root@143.198.46.37

docker exec automatizawppbr_postgres_1 pg_dump -U postgres sales_os | \
  gzip > backup-$(date +%Y%m%d_%H%M%S).sql.gz

# Copiar para local
scp -i ~/.ssh/opencode_do_ed25519 \
  root@143.198.46.37:backup-*.sql.gz \
  ./backups/
```

### Restaurar Database

```bash
gunzip < backup-20260430_120000.sql.gz | \
  docker exec -i automatizawppbr_postgres_1 psql -U postgres sales_os
```

---

## 🚨 Troubleshooting

### Container não inicia

```bash
docker logs automatizawppbr-sales-os-prod
# Verificar erros e corrigir
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar se container está respondendo
curl -s http://localhost:3000

# Verificar config Nginx
nginx -t

# Ver erro no log
tail -20 /var/log/nginx/error.log
```

### SSL Certificate não renova

```bash
certbot renew --dry-run
certbot renew --force-renewal
```

### Database connection failed

```bash
docker exec automatizawppbr_postgres_1 psql -U postgres -c "SELECT 1"
docker inspect automatizawppbr_postgres_1 | grep IPAddress
```

---

## 📞 Contatos & Recursos

- **Digital Ocean**: https://cloud.digitalocean.com/
- **Certbot**: https://certbot.eff.org/
- **Google Search Console**: https://search.google.com/search-console
- **Nginx**: https://nginx.org/

---

## Resumo Rápido

Após deploy:

```bash
# 1. Testar app localmente
curl http://143.198.46.37:3000

# 2. Apontar DNS
# (seu registrador)

# 3. Esperar DNS propagar (5-30 min)
# Verificar: nslookup automatizawpp.com

# 4. Instalar SSL
# (rodar certbot após DNS)

# 5. Testar HTTPS
curl https://www.automatizawpp.com

# 6. Monitorar logs
docker logs -f automatizawppbr-sales-os-prod
```

---

**Próximo checkpoint**: Container rodando + DNS configurado + SSL instalado

**Tempo estimado**: 1-2 horas (incluindo propagação DNS)
