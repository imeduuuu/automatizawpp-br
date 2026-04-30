#!/bin/bash

##############################################################################
# 🚀 AutomatizaWPP Sales OS — DigitalOcean Deployment Script
# Automatiza: droplet creation, Docker setup, deploy, SSL, backups
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 AutomatizaWPP Sales OS — DigitalOcean Deployment    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

##############################################################################
# 1. VALIDATION
##############################################################################

echo -e "\n${YELLOW}→ Verificando requisitos...${NC}"

# Check doctl
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}✗ doctl no está instalado${NC}"
    echo "  Instala: brew install doctl (macOS) o descargar de https://github.com/digitalocean/doctl"
    exit 1
fi

# Check doctl auth
if ! doctl auth list > /dev/null 2>&1; then
    echo -e "${RED}✗ doctl no autenticado${NC}"
    echo "  Ejecuta: doctl auth init"
    exit 1
fi

echo -e "${GREEN}✓ doctl instalado y autenticado${NC}"

# Check jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}✗ jq no está instalado${NC}"
    echo "  Instala: brew install jq"
    exit 1
fi

echo -e "${GREEN}✓ jq instalado${NC}"

##############################################################################
# 2. CONFIGURATION
##############################################################################

echo -e "\n${YELLOW}→ Configurando deployment...${NC}"

# User input
read -p "Nombre del proyecto (ej: automatizawpp): " PROJECT_NAME
read -p "Región DigitalOcean (nyc3, sfo3, lon1, fra1): " REGION
read -p "Tamaño droplet (s-1vcpu-1gb [$6/mes], s-1vcpu-2gb [$12/mes]): " DROPLET_SIZE
read -p "Nombre de dominio (ej: automatizawpp.com): " DOMAIN
read -p "Email para certificado SSL (ej: admin@automatizawpp.com): " EMAIL

# Defaults
REGION=${REGION:-nyc3}
DROPLET_SIZE=${DROPLET_SIZE:-s-1vcpu-1gb}
GITHUB_REPO=$(git config --get remote.origin.url)
SSH_KEY_NAME="automatizawpp-$(date +%s)"

echo -e "\n${BLUE}Configuración:${NC}"
echo "  Proyecto: $PROJECT_NAME"
echo "  Región: $REGION"
echo "  Droplet: $DROPLET_SIZE (~\$6-12/mes)"
echo "  Dominio: $DOMAIN"
echo "  Email SSL: $EMAIL"
echo "  Repo: $GITHUB_REPO"

read -p "¿Proceder con deployment? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Cancelado${NC}"
    exit 1
fi

##############################################################################
# 3. CREATE SSH KEY
##############################################################################

echo -e "\n${YELLOW}→ Creando SSH key...${NC}"

# Check if key exists
if doctl compute ssh-key list --format Name --no-header | grep -q "$SSH_KEY_NAME"; then
    echo -e "${YELLOW}⚠ SSH key ya existe, usando la existente${NC}"
    SSH_KEY_ID=$(doctl compute ssh-key list --format ID,Name --no-header | grep "$SSH_KEY_NAME" | awk '{print $1}')
else
    # Generate local key
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/$SSH_KEY_NAME -N "" -C "automatizawpp@$PROJECT_NAME"

    # Upload to DigitalOcean
    SSH_KEY_ID=$(doctl compute ssh-key import $SSH_KEY_NAME \
        --public-key-file ~/.ssh/$SSH_KEY_NAME.pub \
        --format ID \
        --no-header)

    echo -e "${GREEN}✓ SSH key creado: $SSH_KEY_ID${NC}"
fi

##############################################################################
# 4. CREATE DROPLET
##############################################################################

echo -e "\n${YELLOW}→ Creando droplet...${NC}"

DROPLET_ID=$(doctl compute droplet create $PROJECT_NAME-app \
    --region $REGION \
    --size $DROPLET_SIZE \
    --image ubuntu-24-04-x64 \
    --ssh-keys $SSH_KEY_ID \
    --enable-backups \
    --enable-ipv6 \
    --wait \
    --format ID \
    --no-header)

echo -e "${GREEN}✓ Droplet creado: $DROPLET_ID${NC}"

# Get IP
DROPLET_IP=$(doctl compute droplet get $DROPLET_ID --format PublicIPv4 --no-header)
echo -e "${GREEN}✓ IP: $DROPLET_IP${NC}"

##############################################################################
# 5. CREATE FIREWALL
##############################################################################

echo -e "\n${YELLOW}→ Creando firewall...${NC}"

FIREWALL_ID=$(doctl compute firewall create $PROJECT_NAME-fw \
    --inbound-rules "protocol:tcp,ports:22,sources:all" \
    "protocol:tcp,ports:80,sources:all" \
    "protocol:tcp,ports:443,sources:all" \
    --outbound-rules "protocol:tcp,ports:all,destinations:all" \
    "protocol:udp,ports:all,destinations:all" \
    --format ID \
    --no-header)

# Assign to droplet
doctl compute firewall add-droplets $FIREWALL_ID --droplet-ids $DROPLET_ID

echo -e "${GREEN}✓ Firewall creado y asignado${NC}"

##############################################################################
# 6. WAIT FOR SSH
##############################################################################

echo -e "\n${YELLOW}→ Esperando a que droplet esté listo...${NC}"

for i in {1..30}; do
    if ssh -i ~/.ssh/$SSH_KEY_NAME -o StrictHostKeyChecking=no -o ConnectTimeout=2 \
        root@$DROPLET_IP "echo 'ready'" &> /dev/null; then
        echo -e "${GREEN}✓ Droplet listo${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

##############################################################################
# 7. BOOTSTRAP DROPLET
##############################################################################

echo -e "\n${YELLOW}→ Instalando dependencias...${NC}"

ssh -i ~/.ssh/$SSH_KEY_NAME root@$DROPLET_IP << 'BOOTSTRAP_EOF'
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker root

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js (for scripts)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install certbot for SSL
apt-get install -y certbot python3-certbot-nginx

# Create app directory
mkdir -p /opt/automatizawpp
cd /opt/automatizawpp

# Clone repo
git clone https://github.com/your-user/automatizawpp.git .

echo "✓ Bootstrap completo"
BOOTSTRAP_EOF

echo -e "${GREEN}✓ Droplet bootstrapped${NC}"

##############################################################################
# 8. DEPLOY APPLICATION
##############################################################################

echo -e "\n${YELLOW}→ Desplegando aplicación...${NC}"

ssh -i ~/.ssh/$SSH_KEY_NAME root@$DROPLET_IP << DEPLOY_EOF
#!/bin/bash
set -e
cd /opt/automatizawpp

# Copy production env
cp .env.production.example .env.production

# Configure environment
cat > /tmp/env.patch << 'ENV_EOF'
DATABASE_URL="postgresql://postgres:changeme@db:5432/automatizawpp"
REDIS_URL="redis://redis:6379"
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
BIRD_WORKSPACE_ID="$BIRD_WORKSPACE_ID"
BREVO_API_KEY="$BREVO_API_KEY"
SMTP_HOST="smtp.zoho.com"
SMTP_PORT="587"
SMTP_USER="$SMTP_USER"
SMTP_PASS="$SMTP_PASS"
NODE_ENV="production"
ENV_EOF

# Merge with existing
sed -i 's/^DATABASE_URL=.*/DATABASE_URL="postgresql:\/\/postgres:changeme@db:5432\/automatizawpp"/' .env.production
sed -i 's/^REDIS_URL=.*/REDIS_URL="redis:\/\/redis:6379"/' .env.production

echo "⚠️  IMPORTANTE: Edita .env.production con tus credenciales reales:"
echo "  nano /opt/automatizawpp/.env.production"
echo ""
echo "Luego ejecuta:"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo "  docker-compose exec app npm run db:push"
DEPLOY_EOF

echo -e "${GREEN}✓ Aplicación desplegada${NC}"

##############################################################################
# 9. SETUP DNS
##############################################################################

echo -e "\n${YELLOW}→ Configuración DNS...${NC}"

echo -e "${BLUE}Añade estos records DNS en tu proveedor:${NC}"
echo ""
echo "  A Record:"
echo "    Host: @"
echo "    Value: $DROPLET_IP"
echo "    TTL: 3600"
echo ""
echo "  CNAME Record:"
echo "    Host: www"
echo "    Value: @"
echo "    TTL: 3600"
echo ""
echo "  MX Record (para email):"
echo "    Priority: 10"
echo "    Value: mail.$DOMAIN"
echo ""

read -p "¿DNS configurado? (s/n): " -n 1 -r
echo

##############################################################################
# 10. SETUP SSL
##############################################################################

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "\n${YELLOW}→ Configurando SSL con Let's Encrypt...${NC}"

    ssh -i ~/.ssh/$SSH_KEY_NAME root@$DROPLET_IP << SSL_EOF
#!/bin/bash
set -e

# Wait for DNS propagation
echo "Esperando propagación de DNS (60s)..."
sleep 60

# Get certificate
certbot certonly --standalone \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive

echo "✓ Certificado SSL instalado"
SSL_EOF

    echo -e "${GREEN}✓ SSL configurado${NC}"
fi

##############################################################################
# 11. CONFIGURE BACKUPS
##############################################################################

echo -e "\n${YELLOW}→ Configurando backups automáticos...${NC}"

ssh -i ~/.ssh/$SSH_KEY_NAME root@$DROPLET_IP << BACKUP_EOF
#!/bin/bash

# Setup backup script
cat > /root/backup-db.sh << 'BACKUP_SCRIPT_EOF'
#!/bin/bash
BACKUP_DIR="/backups"
mkdir -p \$BACKUP_DIR
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose -f /opt/automatizawpp/docker-compose.prod.yml exec -T db \
    pg_dump -U postgres automatizawpp | gzip > \$BACKUP_DIR/db_\$TIMESTAMP.sql.gz

# Keep last 30 days
find \$BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completado: \$BACKUP_DIR/db_\$TIMESTAMP.sql.gz"
BACKUP_SCRIPT_EOF

chmod +x /root/backup-db.sh

# Setup cron job (daily at 2 AM)
echo "0 2 * * * /root/backup-db.sh" | crontab -

echo "✓ Backups automáticos configurados (diarios a las 2 AM)"
BACKUP_EOF

echo -e "${GREEN}✓ Backups configurados${NC}"

##############################################################################
# 12. FINAL INSTRUCTIONS
##############################################################################

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ DEPLOYMENT COMPLETADO                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📋 Próximos pasos:${NC}"

echo -e "\n1. ${YELLOW}Conectar al droplet:${NC}"
echo "   ssh -i ~/.ssh/$SSH_KEY_NAME root@$DROPLET_IP"

echo -e "\n2. ${YELLOW}Configurar variables de entorno:${NC}"
echo "   nano /opt/automatizawpp/.env.production"
echo "   (Añade tus credenciales reales)"

echo -e "\n3. ${YELLOW}Desplegar servicios:${NC}"
echo "   cd /opt/automatizawpp"
echo "   docker-compose -f docker-compose.prod.yml up -d"

echo -e "\n4. ${YELLOW}Inicializar base de datos:${NC}"
echo "   docker-compose exec app npm run db:push"
echo "   docker-compose exec app npm run db:seed"

echo -e "\n5. ${YELLOW}Verificar salud:${NC}"
echo "   curl https://$DOMAIN/health"

echo -e "\n6. ${YELLOW}Ver logs:${NC}"
echo "   ssh -i ~/.ssh/$SSH_KEY_NAME root@$DROPLET_IP"
echo "   docker-compose -f /opt/automatizawpp/docker-compose.prod.yml logs -f app"

echo -e "\n${BLUE}📊 Información del droplet:${NC}"
echo "   IP: $DROPLET_IP"
echo "   ID: $DROPLET_ID"
echo "   SSH: ssh -i ~/.ssh/$SSH_KEY_NAME root@$DROPLET_IP"
echo "   Clave privada: ~/.ssh/$SSH_KEY_NAME"

echo -e "\n${BLUE}💰 Costos (aproximado):${NC}"
echo "   Droplet: \$6-12/mes"
echo "   Backups: \$1/mes"
echo "   Transferencia: \$0.01/GB (primero 1TB gratis)"
echo "   Total: ~\$7-13/mes"

echo -e "\n${BLUE}🔗 URLs:${NC}"
echo "   App: https://$DOMAIN"
echo "   Health: https://$DOMAIN/health"
echo "   Logs: SSH → docker-compose logs -f"

echo -e "\n${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   1. Edita .env.production con credenciales reales"
echo "   2. Cambia credenciales por defecto en base de datos"
echo "   3. Configura backups a S3 para mayor durabilidad"
echo "   4. Activa alertas en DigitalOcean"
echo "   5. Configura monitoreo (Sentry, New Relic, etc.)"

echo -e "\n"
