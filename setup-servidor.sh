#!/bin/bash
# Setup inicial do servidor AutomatizaWPP
# Roda UMA VEZ no servidor para clonar o repo e iniciar o app
set -e

APP_DIR="/app"
REPO="https://github.com/imeduuuu/automatizawpp-br.git"
SSH_KEY_PUB="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPSMYbBB0V+S0RJJc8QT6TfkTIEaFR8Ofee/PV5AHkUs github-actions-deploy"

echo "=== AutomatizaWPP — Setup do Servidor ==="

# 1. Adicionar chave SSH para GitHub Actions
echo "→ Adicionando chave SSH..."
mkdir -p ~/.ssh
echo "$SSH_KEY_PUB" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 2. Instalar Node.js 20 se não existir
if ! command -v node &> /dev/null; then
  echo "→ Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# 3. Instalar PM2 se não existir
if ! command -v pm2 &> /dev/null; then
  echo "→ Instalando PM2..."
  npm install -g pm2
fi

# 4. Clonar ou atualizar repo
if [ -d "$APP_DIR/.git" ]; then
  echo "→ Atualizando código..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "→ Clonando repositório..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# 5. Verificar .env
if [ ! -f "$APP_DIR/.env" ]; then
  echo "⚠️  Copie o arquivo .env para $APP_DIR/.env antes de continuar!"
  echo "   cp .env.production .env  (e edite com as credenciais reais)"
  exit 1
fi

# 6. Instalar dependências e build
echo "→ Instalando dependências..."
npm ci

echo "→ Gerando Prisma client..."
npx prisma generate

echo "→ Executando migrations..."
npx prisma migrate deploy

echo "→ Build da aplicação..."
npm run build

# 7. Iniciar com PM2
echo "→ Iniciando com PM2..."
pm2 delete automatizawpp 2>/dev/null || true
pm2 start npm --name automatizawpp -- start
pm2 save
pm2 startup

echo ""
echo "✅ AutomatizaWPP rodando!"
echo "   URL local: http://localhost:3000"
echo "   Logs: pm2 logs automatizawpp"
