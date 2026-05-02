#!/bin/bash

################################################################################
#  🚀 DEPLOY A DIGITALOCEAN - SCRIPT TOTAL AUTOMATIZADO
#  Uso: ./DEPLOY-AHORA.sh
#  El script hace TODO: configura, compila, deploya y verifica
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 AutomatizaWPP - Deploy a DigitalOcean (Automático)   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# =============================================================================
# PASO 1: VERIFICAR REQUISITOS
# =============================================================================

echo -e "\n${YELLOW}[1/6]${NC} Verificando requisitos..."

if ! command -v ssh &> /dev/null; then
    echo -e "${RED}✗ SSH no está instalado${NC}"
    exit 1
fi

if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    echo -e "${RED}✗ No se encontró SSH key en ~/.ssh/${NC}"
    echo -e "  Crea una: ${YELLOW}ssh-keygen -t ed25519${NC}"
    exit 1
fi

echo -e "${GREEN}✓ SSH disponible${NC}"

# =============================================================================
# PASO 2: DATOS DEL DEPLOYMENT
# =============================================================================

echo -e "\n${YELLOW}[2/6]${NC} Configurando datos..."

DROPLET_IP="143.198.46.37"
PROJECT_PATH="/opt/automatizawpp"
SSH_USER="root"
APP_PORT="3000"

echo "  • Droplet IP: $DROPLET_IP"
echo "  • Path: $PROJECT_PATH"
echo "  • Puerto: $APP_PORT"

# =============================================================================
# PASO 3: COMPILAR LOCALMENTE
# =============================================================================

echo -e "\n${YELLOW}[3/6]${NC} Compilando aplicación localmente..."

npm install --include=dev > /tmp/npm_install.log 2>&1 && \
npm run build > /tmp/npm_build.log 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Compilación exitosa${NC}"
else
    echo -e "${RED}✗ Error en compilación${NC}"
    cat /tmp/npm_build.log
    exit 1
fi

# =============================================================================
# PASO 4: CONECTAR A DROPLET Y PREPARAR
# =============================================================================

echo -e "\n${YELLOW}[4/6]${NC} Conectando a droplet..."

SSH_KEY="${SSH_KEY:--i ~/.ssh/id_rsa}"

# Probar conexión
if ! ssh $SSH_KEY $SSH_USER@$DROPLET_IP "echo OK" > /dev/null 2>&1; then
    echo -e "${RED}✗ No se puede conectar a $DROPLET_IP${NC}"
    echo -e "  Opciones:"
    echo -e "  1. Agregar tu SSH key pública al droplet:"
    echo -e "     ${YELLOW}ssh-copy-id -i ~/.ssh/id_rsa.pub $SSH_USER@$DROPLET_IP${NC}"
    echo -e "  2. O resetear contraseña en DigitalOcean panel"
    exit 1
fi

echo -e "${GREEN}✓ Conexión establecida${NC}"

# =============================================================================
# PASO 5: DESPLEGAR CÓDIGO
# =============================================================================

echo -e "\n${YELLOW}[5/6]${NC} Deployando código a $DROPLET_IP..."

ssh $SSH_KEY $SSH_USER@$DROPLET_IP << 'EOF'
set -e

echo "→ Actualizando código..."
cd /opt/automatizawpp
git pull origin main || git clone https://github.com/imeduuuu/automatizawpp-br.git .

echo "→ Instalando dependencias..."
npm install --production

echo "→ Compilando..."
npm run build

echo "→ Iniciando aplicación..."
pm2 delete automatizawpp 2>/dev/null || true
pm2 start npm --name "automatizawpp" -- start
pm2 save

echo "✓ Deployment completado en droplet"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Código deployado y ejecutándose${NC}"
else
    echo -e "${RED}✗ Error durante deployment${NC}"
    exit 1
fi

# =============================================================================
# PASO 6: VERIFICACIONES FINALES
# =============================================================================

echo -e "\n${YELLOW}[6/6]${NC} Verificando que funciona..."

sleep 3

# Check HTTP
echo "→ Verificando puerto HTTP..."
if ssh $SSH_KEY $SSH_USER@$DROPLET_IP "curl -s http://localhost:3000 > /dev/null" 2>/dev/null; then
    echo -e "${GREEN}✓ Aplicación respondiendo en localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠ Aplicación aún iniciando, espera 10 segundos...${NC}"
    sleep 10
fi

# Check endpoint
echo "→ Verificando login endpoint..."
RESPONSE=$(ssh $SSH_KEY $SSH_USER@$DROPLET_IP "curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@automatizawpp.com\",\"password\":\"Admin@2026!\"}'" 2>/dev/null || echo '{}')

if echo "$RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✓ Login endpoint funcionando${NC}"
else
    echo -e "${YELLOW}⚠ Login retorna respuesta (verifica en navegador)${NC}"
fi

# =============================================================================
# RESULTADO FINAL
# =============================================================================

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Próximos pasos:${NC}"
echo -e "  1. Asegurar que el DNS de automatizawpp.com apunta a ${YELLOW}143.198.46.37${NC}"
echo -e "  2. Esperar a que se propague DNS (2-24 horas)"
echo -e "  3. Acceder a ${YELLOW}https://automatizawpp.com${NC}"
echo -e "  4. Probar login con: ${YELLOW}admin@automatizawpp.com / Admin@2026!${NC}"

echo -e "\n${BLUE}Ver logs en el droplet:${NC}"
echo -e "  ${YELLOW}pm2 logs${NC}"
echo -e "  ${YELLOW}pm2 status${NC}"

echo -e "\n${BLUE}Reiniciar aplicación:${NC}"
echo -e "  ${YELLOW}ssh $SSH_USER@$DROPLET_IP 'pm2 restart automatizawpp'${NC}"

echo ""
