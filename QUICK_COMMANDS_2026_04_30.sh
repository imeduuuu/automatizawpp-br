#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# AutomatizaWPP — Comandos Rápidos para Deploy
# ═══════════════════════════════════════════════════════════════════════════════
# Executar apenas comandos que você vai usar. Não execute tudo de uma vez.
# ═══════════════════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "AutomatizaWPP — Quick Deploy Commands"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# 1. GERAR SECRETS SEGUROS (Copiar os valores para .env.production)
# ─────────────────────────────────────────────────────────────────────────────────
echo "1. GERAR SECRETS SEGUROS"
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "NEXTAUTH_SECRET (copiar este valor para .env.production):"
openssl rand -base64 33
echo ""
echo "DATABASE_PASSWORD:"
openssl rand -base64 16
echo ""
echo "REDIS_PASSWORD:"
openssl rand -base64 16
echo ""
echo "PUBLIC_DASHBOARD_TOKEN (pode ser UUID ou qualquer string aleatória):"
openssl rand -hex 32
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# 2. VERIFICAR BUILD LOCAL (antes de fazer deploy)
# ─────────────────────────────────────────────────────────────────────────────────
echo "2. VERIFICAR BUILD LOCAL"
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "Comando:"
echo "  npm run build"
echo ""
echo "Se tudo OK, você vai ver: ✓ Compiled successfully"
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# 3. TESTAR BUILD LOCALMENTE
# ─────────────────────────────────────────────────────────────────────────────────
echo "3. TESTAR SERVER LOCALMENTE (porta 3000)"
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "Comando:"
echo "  npm start"
echo ""
echo "Depois, em outro terminal:"
echo "  curl http://localhost:3000/"
echo "  curl http://localhost:3000/robots.txt"
echo "  curl http://localhost:3000/sitemap.xml"
echo "  curl http://localhost:3000/api/health"
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# 4. TESTAR DOCKER LOCALMENTE (antes de fazer deploy)
# ─────────────────────────────────────────────────────────────────────────────────
echo "4. TESTAR DOCKER COMPOSE LOCALMENTE"
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "Comandos:"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "Verificar:"
echo "  docker-compose logs -f app"
echo "  curl http://localhost:3000/api/health"
echo ""
echo "Parar:"
echo "  docker-compose -f docker-compose.prod.yml down"
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# 5. DEPLOY VIA DIGITAL OCEAN — OPÇÃO A: APP PLATFORM (Recomendado)
# ─────────────────────────────────────────────────────────────────────────────────
echo "5. DEPLOY VIA DIGITAL OCEAN — OPÇÃO A: APP PLATFORM"
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "Passos manuais no console.digitalocean.com:"
echo ""
echo "1. Criar novo App"
echo "2. Conectar GitHub repo (automatizawppBR)"
echo "3. Build command: npm run build"
echo "4. Start command: npm start"
echo "5. Configurar env vars (copiar .env.production)"
echo "6. Deploy"
echo ""
echo "Depois que deploy terminar, testar:"
echo "  curl https://www.automatizawpp.com/api/health"
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# 6. DEPLOY VIA DIGITAL OCEAN — OPÇÃO B: DROPLET + DOCKER
# ─────────────────────────────────────────────────────────────────────────────────
echo "6. DEPLOY VIA DIGITAL OCEAN — OPÇÃO B: DROPLET + DOCKER"
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "Passos (rodar via SSH no Droplet):"
echo ""
echo "# 1. Instalar Docker"
echo "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
echo ""
echo "# 2. Instalar Docker Compose"
echo "sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose"
echo "sudo chmod +x /usr/local/bin/docker-compose"
echo ""
echo "# 3. Clone repo"
echo "git clone https://github.com/[user]/automatizawppBR.git"
echo "cd automatizawppBR"
echo ""
echo "# 4. Atualizar .env.production com:
echo "   - DATABASE_URL com credenciais DO Managed DB (ou local)
echo "   - REDIS_URL com credenciais DO Redis (ou local)
echo "   - NEXTAUTH_SECRET (novo valor seguro)"
echo "   - Outros secrets"
echo ""
echo "# 5. Fazer build + start"
echo "docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "# 6. Verificar logs"
echo "docker-compose logs -f app"
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# 7. CONFIGURAR DNS
# ─────────────────────────────────────────────────────────────────────────────────
echo "7. CONFIGURAR DNS (após ter IP do Droplet/Load Balancer)"
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "No seu registrante (Namecheap, GoDaddy, etc):"
echo ""
echo "A record:      www.automatizawpp.com → [IP_DO_DROPLET]"
echo "CNAME (opcional): automatizawpp.com → www.automatizawpp.com"
echo ""
echo "Verificar propagação:"
echo "  dig www.automatizawpp.com"
echo "  nslookup www.automatizawpp.com"
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# 8. SETUP SSL/TLS COM LET'S ENCRYPT (se usando Droplet)
# ─────────────────────────────────────────────────────────────────────────────────
echo "8. SETUP SSL/TLS (se usando Droplet + Docker)"
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "Instalar Certbot no Droplet:"
echo "  sudo apt-get update"
echo "  sudo apt-get install certbot python3-certbot-nginx"
echo ""
echo "Gerar certificado:"
echo "  sudo certbot certonly --standalone -d www.automatizawpp.com -d automatizawpp.com"
echo ""
echo "Atualizar docker-compose.prod.yml para usar certificado em Nginx"
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# 9. TESTES EM PRODUÇÃO
# ─────────────────────────────────────────────────────────────────────────────────
echo "9. TESTES APÓS DEPLOY (aguardar DNS propagar)"
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "Health check:"
echo "  curl https://www.automatizawpp.com/api/health"
echo ""
echo "Robots:"
echo "  curl https://www.automatizawpp.com/robots.txt"
echo ""
echo "Sitemap:"
echo "  curl https://www.automatizawpp.com/sitemap.xml"
echo ""
echo "Homepage:"
echo "  curl https://www.automatizawpp.com/"
echo ""
echo "Login page:"
echo "  curl https://www.automatizawpp.com/login"
echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "FIM DOS COMANDOS RÁPIDOS"
echo "═══════════════════════════════════════════════════════════════════════════════"
