#!/bin/bash
# recover-servidor.sh — AutomatizaWPP
# Script de recuperação/setup idempotente do servidor.
# Pode ser rodado múltiplas vezes sem problema.
#
# ⚠️  REPOSITÓRIO PRIVADO — use uma das opções abaixo:
#
# Opção 1 — com GitHub CLI autenticado no servidor:
#   gh auth login
#   gh api repos/imeduuuu/automatizawpp-br/contents/recover-servidor.sh \
#     --jq '.content' | base64 -d | bash
#
# Opção 2 — com Personal Access Token (substituir GH_TOKEN):
#   curl -fsSL \
#     -H "Authorization: token GH_TOKEN" \
#     https://raw.githubusercontent.com/imeduuuu/automatizawpp-br/main/recover-servidor.sh | bash
#
# Opção 3 — copiar o script manualmente para o servidor e rodar:
#   scp recover-servidor.sh root@143.198.46.37:/tmp/
#   ssh root@143.198.46.37 "bash /tmp/recover-servidor.sh"

set -euo pipefail

# ──────────────────────────────────────────
# Configurações
# ──────────────────────────────────────────
APP_DIR="/app"
REPO="https://github.com/imeduuuu/automatizawpp-br.git"
APP_NAME="automatizawpp"
NODE_VERSION="20"
LOG_FILE="/var/log/recover-automatizawpp.log"

# Cores para output
VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
RESET='\033[0m'

ok()   { echo -e "${VERDE}✔ $*${RESET}"; }
info() { echo -e "${AMARELO}→ $*${RESET}"; }
erro() { echo -e "${VERMELHO}✘ $*${RESET}" >&2; }

echo ""
echo "══════════════════════════════════════════════"
echo "  AutomatizaWPP — Recuperação do Servidor"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════════"
echo ""

# ──────────────────────────────────────────
# 1. Garantir que é root
# ──────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  erro "Este script deve ser executado como root."
  exit 1
fi

# ──────────────────────────────────────────
# 2. Node.js 20
# ──────────────────────────────────────────
if command -v node &>/dev/null && node -e "process.exit(process.version.startsWith('v${NODE_VERSION}') ? 0 : 1)" 2>/dev/null; then
  ok "Node.js $(node -v) já instalado"
else
  info "Instalando Node.js ${NODE_VERSION}..."
  apt-get update -qq
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >/dev/null 2>&1
  apt-get install -y nodejs >/dev/null 2>&1
  ok "Node.js $(node -v) instalado"
fi

# ──────────────────────────────────────────
# 3. PM2
# ──────────────────────────────────────────
if command -v pm2 &>/dev/null; then
  ok "PM2 $(pm2 -v) já instalado"
else
  info "Instalando PM2..."
  npm install -g pm2 >/dev/null 2>&1
  ok "PM2 $(pm2 -v) instalado"
fi

# ──────────────────────────────────────────
# 4. Git
# ──────────────────────────────────────────
if ! command -v git &>/dev/null; then
  info "Instalando git..."
  apt-get install -y git >/dev/null 2>&1
fi

# ──────────────────────────────────────────
# 5. Clonar ou atualizar repositório
# ──────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  info "Atualizando código em $APP_DIR..."
  cd "$APP_DIR"
  git fetch origin main --quiet
  git reset --hard origin/main --quiet
  ok "Código atualizado para HEAD de main"
else
  info "Clonando repositório em $APP_DIR..."
  # Se o diretório existe mas não é git, faz backup
  if [ -d "$APP_DIR" ]; then
    mv "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    info "Backup do diretório anterior criado"
  fi
  git clone "$REPO" "$APP_DIR" --quiet
  cd "$APP_DIR"
  ok "Repositório clonado"
fi

cd "$APP_DIR"

# ──────────────────────────────────────────
# 6. Verificar .env
# ──────────────────────────────────────────
if [ -f "$APP_DIR/.env" ]; then
  ok ".env encontrado em $APP_DIR/.env"
else
  erro ".env NÃO encontrado em $APP_DIR/.env"
  echo ""
  echo "  Ação necessária:"
  echo "    1. Copie o arquivo .env para o servidor:"
  echo "       scp .env root@143.198.46.37:$APP_DIR/.env"
  echo "    2. Execute este script novamente."
  echo ""
  exit 1
fi

# ──────────────────────────────────────────
# 7. Instalar dependências
# ──────────────────────────────────────────
info "Instalando dependências (npm ci)..."
npm ci --prefer-offline 2>&1 | tail -3
ok "Dependências instaladas"

# ──────────────────────────────────────────
# 8. Prisma: generate + migrate
# ──────────────────────────────────────────
info "Gerando Prisma Client..."
npx prisma generate 2>&1 | grep -E "(Generated|Error)" || true
ok "Prisma Client gerado"

info "Executando migrations..."
npx prisma migrate deploy 2>&1 | grep -E "(Applied|No pending|Error)" || true
ok "Migrations aplicadas"

# ──────────────────────────────────────────
# 9. Build da aplicação
# ──────────────────────────────────────────
info "Fazendo build (Next.js)..."
npm run build 2>&1 | tail -5
ok "Build concluído"

# ──────────────────────────────────────────
# 10. Reiniciar PM2
# ──────────────────────────────────────────
info "Reiniciando processo PM2..."
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start npm --name "$APP_NAME" -- start
pm2 save --force
ok "PM2 reiniciado como '$APP_NAME'"

# ──────────────────────────────────────────
# 11. PM2 startup (systemd)
# ──────────────────────────────────────────
info "Configurando PM2 startup (systemd)..."
# Captura e executa o comando gerado pelo pm2 startup
STARTUP_CMD=$(pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo env" | head -1 || true)
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD" >/dev/null 2>&1 || true
  ok "PM2 startup configurado via systemd"
else
  # Tenta habilitar diretamente se o unit file já existe
  systemctl enable pm2-root 2>/dev/null && ok "Serviço pm2-root já habilitado no systemd" || \
    info "Startup já configurado ou sem alterações necessárias"
fi
pm2 save --force >/dev/null 2>&1

# ──────────────────────────────────────────
# 12. Cron: auto-deploy a cada 10 minutos
# ──────────────────────────────────────────
info "Configurando cron de auto-deploy (*/10 min)..."

CRON_JOB="*/10 * * * * cd $APP_DIR && git pull origin main --quiet && npm ci --quiet 2>/dev/null && npm run build --quiet 2>/dev/null && pm2 restart $APP_NAME 2>/dev/null"
CRON_COMMENT="# AutomatizaWPP auto-deploy"

# Remove entrada antiga se existir e adiciona nova (idempotente)
(crontab -l 2>/dev/null | grep -v "AutomatizaWPP auto-deploy" | grep -v "cd $APP_DIR && git pull"; \
  echo "$CRON_COMMENT"; \
  echo "$CRON_JOB") | crontab -

ok "Cron configurado: auto-deploy a cada 10 minutos"

# ──────────────────────────────────────────
# 13. Verificação final
# ──────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo "  Status Final"
echo "══════════════════════════════════════════════"

# Aguarda 3s para o processo subir
sleep 3

if pm2 list | grep -q "$APP_NAME.*online"; then
  ok "Processo '$APP_NAME' está ONLINE"
else
  erro "Processo '$APP_NAME' não está online — verifique: pm2 logs $APP_NAME"
fi

echo ""
echo "  Node.js : $(node -v)"
echo "  NPM     : $(npm -v)"
echo "  PM2     : $(pm2 -v)"
echo "  App dir : $APP_DIR"
echo ""
pm2 list
echo ""
echo "  Logs    : pm2 logs $APP_NAME"
echo "  URL     : http://localhost:3000"
echo ""
ok "Recuperação concluída em $(date '+%H:%M:%S')"
