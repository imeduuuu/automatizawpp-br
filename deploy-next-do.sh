#!/bin/bash

##############################################################################
# 🚀 AutomatizaWPP Sales OS — DigitalOcean Deploy (Simples)
# Automatiza: git pull, build, e restart do Next.js
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
DROPLET_IP="${1:-}"
DROPLET_USER="${2:-root}"
APP_DIR="${3:-/app/sales-os}"
BRANCH="${4:-main}"

##############################################################################
# 1. VALIDATION
##############################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 Deploy Next.js no DigitalOcean                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

if [ -z "$DROPLET_IP" ]; then
    echo -e "${RED}✗ IP do droplet não fornecido${NC}"
    echo "Uso: ./deploy-next-do.sh <IP> [user] [app_dir] [branch]"
    echo ""
    echo "Exemplos:"
    echo "  ./deploy-next-do.sh 143.198.46.37"
    echo "  ./deploy-next-do.sh 143.198.46.37 root /app/sales-os main"
    exit 1
fi

echo -e "${YELLOW}→ Validando conexão com droplet...${NC}"
if ! ping -c 1 "$DROPLET_IP" &> /dev/null; then
    echo -e "${RED}✗ Não consegui acessar o droplet em $DROPLET_IP${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Droplet está acessível${NC}"

##############################################################################
# 2. BACKUP
##############################################################################

echo -e "\n${YELLOW}→ Criando backup antes do deploy...${NC}"

BACKUP_DIR="/backup/$(date +%Y-%m-%d_%H-%M-%S)"

ssh -o ConnectTimeout=5 "$DROPLET_USER@$DROPLET_IP" << EOF
    # Criar diretório de backup
    mkdir -p /backup

    # Fazer backup da aplicação atual
    if [ -d "$APP_DIR" ]; then
        tar -czf "$BACKUP_DIR.tar.gz" "$APP_DIR" 2>/dev/null || true
        echo "Backup criado: $BACKUP_DIR.tar.gz"
    fi

    # Fazer backup do .env
    if [ -f "$APP_DIR/.env" ]; then
        cp "$APP_DIR/.env" "$BACKUP_DIR.env" 2>/dev/null || true
        echo "Arquivo .env backup criado"
    fi
EOF

echo -e "${GREEN}✓ Backup concluído${NC}"

##############################################################################
# 3. PULL & BUILD
##############################################################################

echo -e "\n${YELLOW}→ Atualizando código e fazendo build...${NC}"

ssh -o ConnectTimeout=5 "$DROPLET_USER@$DROPLET_IP" << EOF
    set -e

    echo "→ Entrando no diretório da aplicação..."
    cd "$APP_DIR" || exit 1

    echo "→ Fazendo git pull de $BRANCH..."
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH

    echo "→ Instalando dependências..."
    npm install --production

    echo "→ Fazendo build do Next.js..."
    npm run build

    echo "✓ Build concluído com sucesso!"
EOF

echo -e "${GREEN}✓ Código atualizado e build concluído${NC}"

##############################################################################
# 4. RESTART
##############################################################################

echo -e "\n${YELLOW}→ Reiniciando containers...${NC}"

ssh -o ConnectTimeout=5 "$DROPLET_USER@$DROPLET_IP" << EOF
    # Opção 1: Se usar Docker Compose
    if [ -f "$APP_DIR/docker-compose.yml" ]; then
        cd "$APP_DIR"
        docker-compose down
        docker-compose up -d
        echo "✓ Containers Docker reiniciados"

    # Opção 2: Se usar PM2
    elif command -v pm2 &> /dev/null; then
        pm2 restart sales-os || pm2 start "$APP_DIR/server.js" --name sales-os
        echo "✓ Aplicação PM2 reiniciada"

    # Opção 3: Se for systemd
    elif systemctl list-units --all | grep -q sales-os; then
        systemctl restart sales-os
        echo "✓ Serviço systemd reiniciado"

    else
        echo "⚠ Nenhum gerenciador de processo detectado"
        echo "  Reinicie manualmente ou configure PM2/Docker"
    fi
EOF

echo -e "${GREEN}✓ Containers reiniciados${NC}"

##############################################################################
# 5. HEALTH CHECK
##############################################################################

echo -e "\n${YELLOW}→ Fazendo health check...${NC}"

sleep 5

if curl -sf http://"$DROPLET_IP":3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Aplicação está respondendo em http://$DROPLET_IP:3000${NC}"
else
    echo -e "${YELLOW}⚠ Aplicação não respondeu ainda (pode estar iniciando)${NC}"
fi

##############################################################################
# 6. SUMMARY
##############################################################################

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Deploy Concluído com Sucesso!                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Detalhes:${NC}"
echo "  📍 Droplet: $DROPLET_USER@$DROPLET_IP"
echo "  📂 Diretório: $APP_DIR"
echo "  🔄 Branch: $BRANCH"
echo "  💾 Backup: $BACKUP_DIR"
echo "  🌐 URL: http://$DROPLET_IP:3000"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. Verifique a aplicação em: http://$DROPLET_IP:3000"
echo "  2. Verifique os logs: docker-compose logs -f"
echo "  3. Se houver problemas, rollback: docker-compose down && tar -xzf $BACKUP_DIR.tar.gz"
echo ""

exit 0
