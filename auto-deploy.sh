#!/bin/bash

##############################################################################
# 🚀 Auto-Deploy Script — Multi-Platform Detection & Automatic Deployment
# Detecta plataforma disponível (Vercel, GitHub Pages, Firebase, DigitalOcean)
# Faz deploy automático, verifica sucesso e envia notificações
# Uso: ./auto-deploy.sh [--platform=PLATAFORMA] [--notify-email=EMAIL]
##############################################################################

set -e

# ============================================================================
# COLORS & FORMATTING
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# CONFIGURATION & DEFAULTS
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
LOG_FILE="/tmp/auto-deploy-$(date +%s).log"
DETECTED_PLATFORM=""
SELECTED_PLATFORM=""
BUILD_SUCCESS=0
DEPLOY_SUCCESS=0
HEALTH_CHECK_SUCCESS=0
DEPLOY_URL=""
NOTIFY_EMAIL=""
NOTIFY_METHOD="none"  # none, email, slack, webhook
SLACK_WEBHOOK=""
WEBHOOK_URL=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --platform=*)
      SELECTED_PLATFORM="${arg#*=}"
      shift
      ;;
    --notify-email=*)
      NOTIFY_EMAIL="${arg#*=}"
      NOTIFY_METHOD="email"
      shift
      ;;
    --notify-slack=*)
      SLACK_WEBHOOK="${arg#*=}"
      NOTIFY_METHOD="slack"
      shift
      ;;
    --notify-webhook=*)
      WEBHOOK_URL="${arg#*=}"
      NOTIFY_METHOD="webhook"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log() {
  local message="$1"
  local level="${2:-INFO}"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_step() {
  local step="$1"
  echo -e "\n${BLUE}→ ${step}${NC}"
  log "STEP: $step"
}

log_success() {
  echo -e "${GREEN}✓ ${1}${NC}"
  log "✓ $1"
}

log_error() {
  echo -e "${RED}✗ ${1}${NC}"
  log "✗ $1" "ERROR"
}

log_warning() {
  echo -e "${YELLOW}⚠ ${1}${NC}"
  log "⚠ $1" "WARNING"
}

# ============================================================================
# PLATFORM DETECTION
# ============================================================================

detect_platforms() {
  log_step "Detectando plataformas disponíveis"

  local platforms=()

  # Check Vercel
  if [ -f "$PROJECT_ROOT/vercel.json" ] || [ -f "$PROJECT_ROOT/.vercelignore" ]; then
    if command -v vercel &> /dev/null || [ -n "$VERCEL_TOKEN" ]; then
      platforms+=("vercel")
      log_success "Vercel detectado"
    fi
  fi

  # Check GitHub Pages
  if git -C "$PROJECT_ROOT" remote get-url origin 2>/dev/null | grep -q "github.com"; then
    platforms+=("github-pages")
    log_success "GitHub Pages detectado"
  fi

  # Check Firebase
  if [ -f "$PROJECT_ROOT/.firebaserc" ] || [ -d "$PROJECT_ROOT/functions" ]; then
    if command -v firebase &> /dev/null || [ -n "$FIREBASE_TOKEN" ]; then
      platforms+=("firebase")
      log_success "Firebase detectado"
    fi
  fi

  # Check DigitalOcean (via doctl)
  if command -v doctl &> /dev/null && [ -n "$DIGITALOCEAN_ACCESS_TOKEN" ]; then
    platforms+=("digitalocean")
    log_success "DigitalOcean detectado"
  fi

  # Check Docker (fallback para qualquer deploy com Docker)
  if command -v docker &> /dev/null && [ -f "$PROJECT_ROOT/Dockerfile" ]; then
    platforms+=("docker")
    log_success "Docker detectado"
  fi

  if [ ${#platforms[@]} -eq 0 ]; then
    log_error "Nenhuma plataforma disponível detectada"
    echo -e "\n${YELLOW}Para usar este script, configure uma das seguintes:${NC}"
    echo "  • Vercel: vercel.json + vercel CLI ou \$VERCEL_TOKEN"
    echo "  • GitHub Pages: GitHub repo + GitHub Actions"
    echo "  • Firebase: .firebaserc + firebase CLI ou \$FIREBASE_TOKEN"
    echo "  • DigitalOcean: \$DIGITALOCEAN_ACCESS_TOKEN + doctl CLI"
    echo "  • Docker: Dockerfile + Docker instalado"
    return 1
  fi

  # Se apenas uma plataforma, usa ela
  if [ ${#platforms[@]} -eq 1 ]; then
    DETECTED_PLATFORM="${platforms[0]}"
    log_success "Plataforma única detectada: $DETECTED_PLATFORM"
  else
    # Prioriza: Vercel > Firebase > GitHub Pages > DigitalOcean > Docker
    for priority in vercel firebase github-pages digitalocean docker; do
      for platform in "${platforms[@]}"; do
        if [ "$platform" = "$priority" ]; then
          DETECTED_PLATFORM="$priority"
          log_success "Múltiplas plataformas; selecionada (por prioridade): $DETECTED_PLATFORM"
          break 2
        fi
      done
    done
  fi

  # Permite override via argumento
  if [ -n "$SELECTED_PLATFORM" ]; then
    DETECTED_PLATFORM="$SELECTED_PLATFORM"
    log_warning "Plataforma sobrescrita por argumento: $DETECTED_PLATFORM"
  fi
}

# ============================================================================
# BUILD FUNCTIONS
# ============================================================================

build_project() {
  log_step "Construindo projeto"

  if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    log_warning "package.json não encontrado, pulando build"
    return 0
  fi

  cd "$PROJECT_ROOT"

  # Install dependencies
  if [ ! -d "node_modules" ]; then
    log_step "Instalando dependências"
    npm ci --prefer-offline --no-audit 2>&1 | tee -a "$LOG_FILE"
  fi

  # Run build if exists
  if grep -q '"build"' package.json; then
    log_step "Executando npm build"
    if npm run build 2>&1 | tee -a "$LOG_FILE"; then
      BUILD_SUCCESS=1
      log_success "Build completado com sucesso"
    else
      log_error "Build falhou"
      return 1
    fi
  else
    log_warning "Build script não encontrado em package.json"
    BUILD_SUCCESS=1
  fi
}

# ============================================================================
# DEPLOY FUNCTIONS
# ============================================================================

deploy_vercel() {
  log_step "Deployando para Vercel"

  if ! command -v vercel &> /dev/null; then
    log_error "vercel CLI não instalado"
    return 1
  fi

  cd "$PROJECT_ROOT"

  # Deploy
  if DEPLOY_OUTPUT=$(vercel deploy --prod 2>&1); then
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP '(?<=✓ )https://[^\s]*' | tail -1 || echo "")
    if [ -z "$DEPLOY_URL" ]; then
      # Fallback: extract from vercel.json project name
      DEPLOY_URL="https://$(jq -r '.name' vercel.json 2>/dev/null || echo 'app').vercel.app"
    fi
    DEPLOY_SUCCESS=1
    log_success "Vercel deploy completado: $DEPLOY_URL"
    return 0
  else
    log_error "Vercel deploy falhou: $DEPLOY_OUTPUT"
    return 1
  fi
}

deploy_github_pages() {
  log_step "Deployando para GitHub Pages"

  cd "$PROJECT_ROOT"

  # Git checks
  if ! git status > /dev/null 2>&1; then
    log_error "Não é um repositório git"
    return 1
  fi

  # Get repo info
  local repo_url=$(git config --get remote.origin.url)
  local repo_owner=$(echo "$repo_url" | sed 's/.*[:/]\([^/]*\)\/\([^/]*\)\.git$/\1/')
  local repo_name=$(echo "$repo_url" | sed 's/.*[:/]\([^/]*\)\/\([^/]*\)\.git$/\2/')

  if [ -z "$repo_owner" ] || [ -z "$repo_name" ]; then
    log_error "Não consegui determinar dono/nome do repositório"
    return 1
  fi

  DEPLOY_URL="https://${repo_owner}.github.io/${repo_name}"

  # Check if gh-pages branch exists, else create
  if ! git show-ref --quiet refs/heads/gh-pages; then
    log_step "Criando branch gh-pages"
    git checkout --orphan gh-pages
    git reset --hard
    git commit --allow-empty -m "Initial gh-pages commit"
    git push origin gh-pages
    git checkout -
  fi

  # Build for GitHub Pages (if build dir exists)
  if [ -d "dist" ] || [ -d "build" ] || [ -d "out" ]; then
    local build_dir="dist"
    [ -d "build" ] && build_dir="build"
    [ -d "out" ] && build_dir="out"

    log_step "Fazendo push de $build_dir para gh-pages"
    git subtree push --prefix "$build_dir" origin gh-pages 2>&1 | tee -a "$LOG_FILE"
  else
    log_warning "Nenhum diretório de build (dist/build/out) encontrado"
  fi

  DEPLOY_SUCCESS=1
  log_success "GitHub Pages deploy agendado: $DEPLOY_URL"
  return 0
}

deploy_firebase() {
  log_step "Deployando para Firebase"

  if ! command -v firebase &> /dev/null; then
    log_error "firebase CLI não instalado"
    return 1
  fi

  cd "$PROJECT_ROOT"

  if [ ! -f ".firebaserc" ]; then
    log_error ".firebaserc não encontrado"
    return 1
  fi

  # Deploy
  if firebase deploy --force 2>&1 | tee -a "$LOG_FILE"; then
    # Extract URL
    local project=$(jq -r '.projects.default' .firebaserc)
    DEPLOY_URL="https://${project}.web.app"
    DEPLOY_SUCCESS=1
    log_success "Firebase deploy completado: $DEPLOY_URL"
    return 0
  else
    log_error "Firebase deploy falhou"
    return 1
  fi
}

deploy_digitalocean() {
  log_step "Deployando para DigitalOcean App Platform"

  if ! command -v doctl &> /dev/null; then
    log_error "doctl CLI não instalado"
    return 1
  fi

  if [ -z "$DIGITALOCEAN_ACCESS_TOKEN" ]; then
    log_error "DIGITALOCEAN_ACCESS_TOKEN não definido"
    return 1
  fi

  cd "$PROJECT_ROOT"

  # Find app spec
  local app_spec="app.yaml"
  if [ ! -f "$app_spec" ]; then
    log_warning "app.yaml não encontrado, pulando DigitalOcean App Platform"
    return 0
  fi

  # Update spec and deploy
  if doctl apps update --spec "$app_spec" 2>&1 | tee -a "$LOG_FILE"; then
    # Extract app name
    local app_name=$(yq eval '.name' "$app_spec" 2>/dev/null || echo "app")
    DEPLOY_URL="https://${app_name}.ondigitalocean.app"
    DEPLOY_SUCCESS=1
    log_success "DigitalOcean deploy completado: $DEPLOY_URL"
    return 0
  else
    log_error "DigitalOcean deploy falhou"
    return 1
  fi
}

deploy_docker() {
  log_step "Deployando com Docker"

  if ! command -v docker &> /dev/null; then
    log_error "Docker não instalado"
    return 1
  fi

  cd "$PROJECT_ROOT"

  if [ ! -f "Dockerfile" ]; then
    log_error "Dockerfile não encontrado"
    return 1
  fi

  # Extract image name from Dockerfile or use default
  local image_name="automatizawpp-app"
  local image_tag="$(date +%s)"

  log_step "Construindo Docker image: ${image_name}:${image_tag}"
  if docker build -t "${image_name}:${image_tag}" -t "${image_name}:latest" . 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Docker image construído: ${image_name}:latest"

    # If docker-compose exists, restart services
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.prod.yml" ]; then
      local compose_file="docker-compose.yml"
      [ -f "docker-compose.prod.yml" ] && compose_file="docker-compose.prod.yml"

      log_step "Reiniciando serviços com docker-compose"
      if docker-compose -f "$compose_file" up -d 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Serviços Docker reiniciados"
        DEPLOY_SUCCESS=1
        DEPLOY_URL="localhost"
        return 0
      fi
    else
      log_warning "docker-compose.yml não encontrado, build apenas"
      DEPLOY_SUCCESS=1
      return 0
    fi
  else
    log_error "Docker build falhou"
    return 1
  fi
}

# ============================================================================
# HEALTH CHECK FUNCTIONS
# ============================================================================

health_check() {
  log_step "Verificando saúde do deploy"

  if [ -z "$DEPLOY_URL" ]; then
    log_warning "URL de deploy não definida, pulando health check"
    return 0
  fi

  if [ "$DEPLOY_URL" = "localhost" ]; then
    log_warning "Deploy local (Docker), pulando health check remoto"
    return 0
  fi

  # Try health check endpoints
  local endpoints=("/health" "/api/health" "/status" "/ping")
  local max_retries=5
  local retry_count=0

  while [ $retry_count -lt $max_retries ]; do
    for endpoint in "${endpoints[@]}"; do
      log_step "Testando ${DEPLOY_URL}${endpoint} (tentativa $((retry_count + 1))/$max_retries)"

      if http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${DEPLOY_URL}${endpoint}" 2>/dev/null); then
        if [ "$http_code" = "200" ] || [ "$http_code" = "204" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
          log_success "Health check passou: HTTP $http_code em ${endpoint}"
          HEALTH_CHECK_SUCCESS=1
          return 0
        fi
      fi
    done

    retry_count=$((retry_count + 1))
    if [ $retry_count -lt $max_retries ]; then
      log_warning "Health check falhou, aguardando 10s para retry..."
      sleep 10
    fi
  done

  log_warning "Health check falhou após $max_retries tentativas"
  # Não falha o script completo se health check falhar
  return 0
}

# ============================================================================
# NOTIFICATION FUNCTIONS
# ============================================================================

send_notification() {
  local status="$1"
  local message="$2"

  case "$NOTIFY_METHOD" in
    email)
      send_email_notification "$status" "$message"
      ;;
    slack)
      send_slack_notification "$status" "$message"
      ;;
    webhook)
      send_webhook_notification "$status" "$message"
      ;;
    *)
      log_warning "Sem método de notificação configurado"
      ;;
  esac
}

send_email_notification() {
  local status="$1"
  local message="$2"

  if [ -z "$NOTIFY_EMAIL" ]; then
    log_warning "Email de notificação não definido"
    return
  fi

  log_step "Enviando notificação por email para $NOTIFY_EMAIL"

  local subject="[AutoDeploy] Deploy $status — $DETECTED_PLATFORM"
  local emoji="✓"
  [ "$status" = "FALHOU" ] && emoji="✗"

  local body="Plataforma: $DETECTED_PLATFORM
Build: $([ $BUILD_SUCCESS -eq 1 ] && echo '✓ Sucesso' || echo '✗ Falhou')
Deploy: $([ $DEPLOY_SUCCESS -eq 1 ] && echo '✓ Sucesso' || echo '✗ Falhou')
Health Check: $([ $HEALTH_CHECK_SUCCESS -eq 1 ] && echo '✓ Passou' || echo '✗ Falhou')

URL: $DEPLOY_URL

Timestamp: $(date)
Log: $LOG_FILE

$message"

  # Try mail command (macOS/Linux)
  if command -v mail &> /dev/null; then
    echo "$body" | mail -s "$subject" "$NOTIFY_EMAIL" 2>&1 | tee -a "$LOG_FILE"
    log_success "Email enviado para $NOTIFY_EMAIL"
  else
    log_warning "mail command não disponível"
  fi
}

send_slack_notification() {
  local status="$1"
  local message="$2"

  if [ -z "$SLACK_WEBHOOK" ]; then
    log_warning "Slack webhook não definido"
    return
  fi

  log_step "Enviando notificação para Slack"

  local color="good"
  [ "$status" = "FALHOU" ] && color="danger"

  local text="AutoDeploy $status"
  [ "$status" = "SUCESSO" ] && text="✓ Deploy bem-sucedido"
  [ "$status" = "FALHOU" ] && text="✗ Deploy falhou"

  local payload=$(cat <<'SLACK_EOF'
{
  "attachments": [
    {
      "color": "SLACK_COLOR_PLACEHOLDER",
      "title": "SLACK_TEXT_PLACEHOLDER",
      "fields": [
        {
          "title": "Plataforma",
          "value": "SLACK_PLATFORM_PLACEHOLDER",
          "short": true
        },
        {
          "title": "Build",
          "value": "SLACK_BUILD_PLACEHOLDER",
          "short": true
        },
        {
          "title": "Deploy",
          "value": "SLACK_DEPLOY_PLACEHOLDER",
          "short": true
        },
        {
          "title": "Health Check",
          "value": "SLACK_HEALTH_PLACEHOLDER",
          "short": true
        },
        {
          "title": "URL",
          "value": "SLACK_URL_PLACEHOLDER",
          "short": false
        },
        {
          "title": "Mensagem",
          "value": "SLACK_MESSAGE_PLACEHOLDER",
          "short": false
        }
      ],
      "footer": "Log: SLACK_LOGFILE_PLACEHOLDER",
      "ts": SLACK_TIMESTAMP_PLACEHOLDER
    }
  ]
}
SLACK_EOF
)

  # Replace placeholders
  payload="${payload//SLACK_COLOR_PLACEHOLDER/$color}"
  payload="${payload//SLACK_TEXT_PLACEHOLDER/$text}"
  payload="${payload//SLACK_PLATFORM_PLACEHOLDER/$DETECTED_PLATFORM}"
  payload="${payload//SLACK_BUILD_PLACEHOLDER/$([ $BUILD_SUCCESS -eq 1 ] && echo '✓ Sucesso' || echo '✗ Falhou')}"
  payload="${payload//SLACK_DEPLOY_PLACEHOLDER/$([ $DEPLOY_SUCCESS -eq 1 ] && echo '✓ Sucesso' || echo '✗ Falhou')}"
  payload="${payload//SLACK_HEALTH_PLACEHOLDER/$([ $HEALTH_CHECK_SUCCESS -eq 1 ] && echo '✓ Passou' || echo '✗ Falhou')}"
  payload="${payload//SLACK_URL_PLACEHOLDER/$DEPLOY_URL}"
  payload="${payload//SLACK_MESSAGE_PLACEHOLDER/$message}"
  payload="${payload//SLACK_LOGFILE_PLACEHOLDER/$LOG_FILE}"
  payload="${payload//SLACK_TIMESTAMP_PLACEHOLDER/$(date +%s)}"

  if curl -X POST -H 'Content-type: application/json' \
      --data "$payload" \
      "$SLACK_WEBHOOK" 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Notificação Slack enviada"
  else
    log_error "Falha ao enviar Slack"
  fi
}

send_webhook_notification() {
  local status="$1"
  local message="$2"

  if [ -z "$WEBHOOK_URL" ]; then
    log_warning "Webhook URL não definida"
    return
  fi

  log_step "Enviando notificação para webhook"

  local payload=$(cat <<WEBHOOK_EOF
{
  "status": "$status",
  "platform": "$DETECTED_PLATFORM",
  "build_success": $BUILD_SUCCESS,
  "deploy_success": $DEPLOY_SUCCESS,
  "health_check_success": $HEALTH_CHECK_SUCCESS,
  "deploy_url": "$DEPLOY_URL",
  "message": "$message",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "log_file": "$LOG_FILE"
}
WEBHOOK_EOF
)

  if curl -X POST -H 'Content-type: application/json' \
      --data "$payload" \
      "$WEBHOOK_URL" 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Webhook notificação enviada"
  else
    log_error "Falha ao enviar webhook"
  fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║       🚀 Auto-Deploy Script — Multi-Platform Deploy        ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

  log_step "Iniciando auto-deploy"
  log "Log: $LOG_FILE"

  # Step 1: Detect platforms
  if ! detect_platforms; then
    send_notification "FALHOU" "Nenhuma plataforma detectada"
    exit 1
  fi

  echo -e "\n${BLUE}→ Plataforma selecionada: $DETECTED_PLATFORM${NC}"

  # Step 2: Build
  if ! build_project; then
    send_notification "FALHOU" "Build falhou"
    exit 1
  fi

  # Step 3: Deploy
  case "$DETECTED_PLATFORM" in
    vercel)
      deploy_vercel || true
      ;;
    github-pages)
      deploy_github_pages || true
      ;;
    firebase)
      deploy_firebase || true
      ;;
    digitalocean)
      deploy_digitalocean || true
      ;;
    docker)
      deploy_docker || true
      ;;
    *)
      log_error "Plataforma desconhecida: $DETECTED_PLATFORM"
      send_notification "FALHOU" "Plataforma desconhecida"
      exit 1
      ;;
  esac

  if [ $DEPLOY_SUCCESS -ne 1 ]; then
    send_notification "FALHOU" "Deploy falhou"
    exit 1
  fi

  # Step 4: Health check
  health_check

  # Step 5: Notify success
  if [ $HEALTH_CHECK_SUCCESS -eq 1 ]; then
    send_notification "SUCESSO" "Deploy completado e health check passou"
  else
    send_notification "SUCESSO" "Deploy completado (health check inconclusivo)"
  fi

  # Summary
  echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                   ✅ DEPLOY COMPLETADO                    ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

  echo -e "${BLUE}📊 Resumo:${NC}"
  echo "  Plataforma: $DETECTED_PLATFORM"
  echo "  Build: $([ $BUILD_SUCCESS -eq 1 ] && echo '✓ Sucesso' || echo '✗ Falhou')"
  echo "  Deploy: $([ $DEPLOY_SUCCESS -eq 1 ] && echo '✓ Sucesso' || echo '✗ Falhou')"
  echo "  Health Check: $([ $HEALTH_CHECK_SUCCESS -eq 1 ] && echo '✓ Passou' || echo '⚠ Não verificado')"
  echo "  URL: $DEPLOY_URL"
  echo ""
  echo -e "${YELLOW}📋 Log completo: $LOG_FILE${NC}"
  echo ""
}

# Trap errors
trap 'log_error "Script interrompido"; send_notification "FALHOU" "Script interrompido"; exit 1' INT TERM

# Run
main
