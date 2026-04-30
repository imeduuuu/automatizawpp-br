# AutomatizaWPP — Digital Ocean Deployment Guide

**Status**: Build ✅ Fixed | Middleware ✅ Updated | Pages ✅ Accessible Locally | **Ready for Production Deployment**

**Date**: 2026-04-30

---

## Overview

This guide covers deploying AutomatizaWPP to Digital Ocean production environment at `www.automatizawpp.com`.

### What's Been Completed Locally

- ✅ Build errors fixed (Prisma schema mapping corrected)
- ✅ Middleware updated to expose public pages (`/automacao-*`, `/casos-sucesso`, `/blog`)
- ✅ API endpoints `/api/public/*` configured and token-validated
- ✅ Dashboard HTML and React components ready
- ✅ SEO files created (`sitemap.xml`, `robots.txt`)
- ✅ Production env template created (`.env.production`)

### What Needs to Be Done

1. **Digital Ocean Infrastructure** — Create/update resources
2. **Database Setup** — PostgreSQL migrations
3. **SSL Certificate** — Install/renew (previously reset)
4. **Environment Variables** — Configure with production credentials
5. **Deploy Application** — Push to production
6. **Verification** — Test all endpoints

---

## Option 1: Digital Ocean App Platform (Recommended - No Docker)

### Step 1: Create PostgreSQL Database on DO

```bash
doctl databases create sales-os-db \
  --engine pg \
  --region nyc3 \
  --version 16 \
  --size db-s-1vcpu-1gb
```

Get credentials:
```bash
doctl databases db-user get sales-os-db db_user --format password --no-header
doctl databases get sales-os-db --format host,port --no-header
```

### Step 2: Create Redis Database on DO

```bash
doctl databases create sales-os-redis \
  --engine redis \
  --region nyc3 \
  --size db-s-1vcpu-1gb
```

### Step 3: Create App Platform Deployment

Link your GitHub repo to Digital Ocean App Platform:

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Select your GitHub repository
4. Configure build: `npm run build`
5. Set environment variables from `.env.production`
6. Set database connection strings (from Step 1 & 2)
7. Configure domain: `www.automatizawpp.com`

### Step 4: Configure SSL

Digital Ocean App Platform includes automatic SSL via Let's Encrypt. Just configure the custom domain and it will auto-provision.

---

## Option 2: Digital Ocean Droplet + Docker (More Control)

### Step 1: Create Droplet

```bash
doctl compute droplet create automatizawpp-prod \
  --region nyc3 \
  --size s-2vcpu-4gb \
  --image ubuntu-24-04-x64 \
  --enable-backups \
  --enable-ipv6
```

### Step 2: SSH into Droplet

```bash
# Get IP
IP=$(doctl compute droplet get automatizawpp-prod --format PublicIPv4 --no-header)
ssh root@$IP
```

### Step 3: Install Dependencies

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.25.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install certbot for SSL
apt-get install -y certbot python3-certbot-nginx

# Clone repo
cd /opt
git clone https://github.com/your-user/automatizawpp.git
cd automatizawpp
```

### Step 4: Configure Environment

```bash
cp .env.production /opt/automatizawpp/.env

# Edit with production values
nano /opt/automatizawpp/.env
```

Update these values:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@your-do-db-host:25060/sales_os
REDIS_URL=redis://:YOUR_PASSWORD@your-do-redis-host:25061
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
SMTP_PASS=<your Zoho password>
IMAP_PASS=<your Zoho password>
PUBLIC_DASHBOARD_TOKEN=<keep or regenerate>
```

### Step 5: Start Services

```bash
cd /opt/automatizawpp
docker-compose -f docker-compose.prod.yml up -d
```

### Step 6: Run Database Migrations

```bash
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate:deploy
```

### Step 7: Configure SSL with Let's Encrypt

```bash
certbot certonly --standalone \
  -d automatizawpp.com \
  -d www.automatizawpp.com \
  --email admin@automatizawpp.com \
  --agree-tos \
  --non-interactive
```

### Step 8: Configure Nginx Reverse Proxy

```bash
apt-get install -y nginx

cat > /etc/nginx/sites-available/automatizawpp << 'NGINX'
server {
    listen 80;
    server_name www.automatizawpp.com automatizawpp.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.automatizawpp.com automatizawpp.com;

    ssl_certificate /etc/letsencrypt/live/www.automatizawpp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.automatizawpp.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -s /etc/nginx/sites-available/automatizawpp /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

---

## Verification Checklist

### 1. Pages Load

- [ ] https://www.automatizawpp.com/automacao-whatsapp
- [ ] https://www.automatizawpp.com/automacao-vendas
- [ ] https://www.automatizawpp.com/automacao-atendimento
- [ ] https://www.automatizawpp.com/casos-sucesso
- [ ] https://www.automatizawpp.com/blog

### 2. API Endpoints

```bash
TOKEN="test-token-12345"

# Leads
curl -H "Authorization: Bearer $TOKEN" https://www.automatizawpp.com/api/public/leads

# Conversations
curl -H "Authorization: Bearer $TOKEN" https://www.automatizawpp.com/api/public/conversations

# Analytics
curl -H "Authorization: Bearer $TOKEN" https://www.automatizawpp.com/api/public/analytics
```

### 3. Dashboard

- [ ] https://www.automatizawpp.com/dashboard.html loads
- [ ] Metrics cards render
- [ ] Leads table shows data
- [ ] Filters work

### 4. SSL

```bash
curl -I https://www.automatizawpp.com
# Should show: HTTP/2 200 with valid SSL cert
```

### 5. Sitemap

```bash
curl https://www.automatizawpp.com/sitemap.xml
# Should return valid XML
```

---

## Rollback Procedure

If deployment fails:

### Option 1: Droplet
```bash
# Restore from backup
doctl compute droplet-backup list automatizawpp-prod
doctl compute droplet restore automatizawpp-prod --backup-id BACKUP_ID
```

### Option 2: App Platform
```bash
# Revert to previous deployment
# Via UI: Apps > Your App > Deployment > View Previous Deployments
```

---

## Monitoring & Maintenance

### Health Check

```bash
curl https://www.automatizawpp.com/api/health
# Expected: 200 OK with { "status": "ok" }
```

### View Logs

**Droplet with Docker:**
```bash
docker-compose -f /opt/automatizawpp/docker-compose.prod.yml logs -f app
```

**App Platform:**
```bash
doctl apps logs YOUR_APP_ID --component app
```

### Database Backups

**Droplet:**
```bash
# Automatic via DO backups (enabled)
# Or manual:
docker-compose exec -T postgres pg_dump -U postgres sales_os | gzip > backup-$(date +%s).sql.gz
```

**App Platform:**
```bash
# Automatic via DO Managed Database
```

---

## Next Steps

1. **DNS Configuration** — Point `www.automatizawpp.com` to Digital Ocean droplet/App Platform IP
2. **Database Migration** — Run `npm run db:migrate:deploy` in production
3. **Google Search Console** — Submit sitemap at https://www.automatizawpp.com/sitemap.xml
4. **Email Setup** — Configure Zoho Mail SMTP credentials
5. **Monitoring** — Set up alerts (uptime, error rate, database)

---

## Support & Troubleshooting

### Build Errors
```bash
npm run build
# Check for missing environment variables
```

### Database Connection
```bash
# Test connection
docker-compose exec app psql $DATABASE_URL -c "SELECT 1"
```

### SSL Issues
```bash
# Renew certificate
certbot renew --force-renewal
```

### Redis Issues
```bash
# Test Redis connection
docker-compose exec redis redis-cli -a $REDIS_PASSWORD ping
```

---

**Document Updated**: 2026-04-30
**Build Status**: ✅ Ready for Production
