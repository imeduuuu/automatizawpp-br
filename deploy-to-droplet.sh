#!/bin/bash

##############################################################################
# 🚀 Deploy to Existing DigitalOcean Droplet
# Usage: ./deploy-to-droplet.sh [droplet_ip]
##############################################################################

set -e

if [ -z "$1" ]; then
    echo "Uso: ./deploy-to-droplet.sh <droplet_ip>"
    echo "Ejemplo: ./deploy-to-droplet.sh 192.168.1.100"
    exit 1
fi

DROPLET_IP=$1
SSH_KEY=${2:-~/.ssh/id_rsa}

echo "🚀 Desplegando a $DROPLET_IP..."

# Step 1: Update system
echo "→ Actualizando sistema..."
ssh -i $SSH_KEY root@$DROPLET_IP << 'EOF'
apt-get update && apt-get upgrade -y
EOF

# Step 2: Install Docker
echo "→ Instalando Docker..."
ssh -i $SSH_KEY root@$DROPLET_IP << 'EOF'
curl -fsSL https://get.docker.com | sh
usermod -aG docker root
EOF

# Step 3: Clone repository
echo "→ Clonando repositorio..."
ssh -i $SSH_KEY root@$DROPLET_IP << 'EOF'
mkdir -p /opt/automatizawpp
cd /opt/automatizawpp
git clone https://github.com/YOUR_USER/automatizawppBR.git . 2>/dev/null || git pull
EOF

# Step 4: Setup environment
echo "→ Configurando ambiente..."
ssh -i $SSH_KEY root@$DROPLET_IP << 'EOF'
cd /opt/automatizawpp
cp .env.production.example .env.production

# Print instructions
cat << 'NOTICE'

⚠️  IMPORTANTE: Edita el archivo .env.production con tus credenciales reales:

ssh -i ~/.ssh/id_rsa root@DROPLET_IP
nano /opt/automatizawpp/.env.production

Variables críticas a configurar:
  - DATABASE_URL (PostgreSQL connection string)
  - ANTHROPIC_API_KEY
  - BIRD_WORKSPACE_ID
  - BREVO_API_KEY
  - SMTP credentials

NOTICE

EOF

# Step 5: Pull and build Docker images
echo "→ Descargando imágenes Docker..."
ssh -i $SSH_KEY root@$DROPLET_IP << 'EOF'
cd /opt/automatizawpp
docker-compose -f docker-compose.prod.yml pull
EOF

# Step 6: Start services
echo "→ Iniciando servicios..."
ssh -i $SSH_KEY root@$DROPLET_IP << 'EOF'
cd /opt/automatizawpp
docker-compose -f docker-compose.prod.yml up -d
EOF

# Step 7: Initialize database
echo "→ Inicializando base de datos..."
ssh -i $SSH_KEY root@$DROPLET_IP << 'EOF'
cd /opt/automatizawpp
sleep 10  # Wait for services to be ready
docker-compose exec -T app npm run db:push
docker-compose exec -T app npm run db:seed
EOF

# Step 8: Health check
echo "→ Verificando salud..."
ssh -i $SSH_KEY root@$DROPLET_IP << 'EOF'
sleep 5
curl -s http://localhost/health | jq . || echo "⚠️  Health endpoint not yet available"
EOF

echo ""
echo "✅ Deployment completado!"
echo ""
echo "Próximos pasos:"
echo "1. SSH al droplet: ssh -i $SSH_KEY root@$DROPLET_IP"
echo "2. Ver estado: docker-compose -f /opt/automatizawpp/docker-compose.prod.yml ps"
echo "3. Ver logs: docker-compose -f /opt/automatizawpp/docker-compose.prod.yml logs -f"
echo "4. Configurar dominio y SSL"
echo ""
