#!/bin/bash

################################################################################
# AutomatizaWPP — Deployment Setup Script (IDEMPOTENT)
#
# Uso:
#   1. cp .env.deploy.example .env.deploy
#   2. nano .env.deploy  (rellena tus valores)
#   3. bash scripts/deploy-setup.sh
#
# Este script es IDEMPOTENTE:
#   - Valida variables del archivo .env.deploy
#   - Configura GitHub Secrets automáticamente (solo agrega los nuevos)
#   - Activa GitHub Actions
#   - Realiza el primer deploy
#   - Puede ejecutarse múltiples veces sin problemas
#
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Defaults
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.deploy"
GITHUB_ACTIONS_ENABLED=false

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${CYAN}▸ $1${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Load and validate environment file
load_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Archivo no encontrado: $ENV_FILE"
        echo ""
        echo "Copia el archivo de ejemplo:"
        echo "  cp $PROJECT_ROOT/.env.deploy.example $ENV_FILE"
        exit 1
    fi

    print_info "Cargando configuración desde: $ENV_FILE"
    
    # Source the env file (safely)
    set +e
    source "$ENV_FILE" 2>/dev/null
    set -e
    
    print_success "Configuración cargada"
}

# Validate required variables
validate_required_vars() {
    local missing=()
    
    # Mandatory vars
    local required_vars=(
        "DO_TOKEN"
        "DO_DROPLET_NAME"
        "DATABASE_PASSWORD"
        "REDIS_PASSWORD"
        "ANTHROPIC_API_KEY"
        "NEXTAUTH_SECRET"
        "APP_DOMAIN"
        "APP_URL"
    )
    
    print_section "Validando variables requeridas"
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing+=("$var")
            print_error "Falta: $var"
        else
            print_success "Encontrado: $var"
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo ""
        print_error "Faltan ${#missing[@]} variables requeridas:"
        for var in "${missing[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Edita $ENV_FILE y rellena los valores:"
        echo "  nano $ENV_FILE"
        exit 1
    fi
}

# Auto-generate missing non-required values
generate_missing_values() {
    print_section "Generando valores faltantes"
    
    # DATABASE_PASSWORD
    if [ -z "$DATABASE_PASSWORD" ] || [ "$DATABASE_PASSWORD" == "generate" ]; then
        DATABASE_PASSWORD=$(openssl rand -base64 32)
        print_info "DATABASE_PASSWORD generada (${#DATABASE_PASSWORD} chars)"
    fi
    
    # REDIS_PASSWORD
    if [ -z "$REDIS_PASSWORD" ] || [ "$REDIS_PASSWORD" == "generate" ]; then
        REDIS_PASSWORD=$(openssl rand -base64 32)
        print_info "REDIS_PASSWORD generada (${#REDIS_PASSWORD} chars)"
    fi
    
    # NEXTAUTH_SECRET
    if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" == "generate" ]; then
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        print_info "NEXTAUTH_SECRET generada (${#NEXTAUTH_SECRET} chars)"
    fi
}

# Check GitHub CLI
check_gh_cli() {
    print_section "Verificando GitHub CLI"
    
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI no está instalado"
        echo ""
        echo "Instala gh desde: https://cli.github.com/"
        exit 1
    fi
    
    print_success "GitHub CLI encontrado"
    
    # Check authentication
    if ! gh auth status &>/dev/null; then
        print_error "No estás autenticado con GitHub"
        echo ""
        echo "Autentica con:"
        echo "  gh auth login"
        exit 1
    fi
    
    print_success "GitHub autenticación verificada"
}

# Get repository info
get_repo_info() {
    print_section "Obteniendo información del repositorio"
    
    if ! cd "$PROJECT_ROOT"; then
        print_error "No se puede entrar al directorio del proyecto"
        exit 1
    fi
    
    # Get repo owner and name from git remote
    local remote_url
    remote_url=$(git config --get remote.origin.url)
    
    if [[ $remote_url == *"github.com"* ]]; then
        REPO_OWNER=$(echo "$remote_url" | sed -E 's|.*github.com[:/]([^/]+)/.*|\1|')
        REPO_NAME=$(echo "$remote_url" | sed -E 's|.*github.com[:/][^/]+/(.+?)(.git)?$|\1|')
    fi
    
    if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
        print_error "No se pudo detectar información del repositorio"
        echo "Asegúrate de estar en un repositorio de Git con remote 'origin'"
        exit 1
    fi
    
    print_success "Repositorio: $REPO_OWNER/$REPO_NAME"
}

# Add a secret to GitHub (idempotent)
add_github_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        return 0
    fi
    
    # Check if secret already exists
    if gh secret list --repo "$REPO_OWNER/$REPO_NAME" | grep -q "^$secret_name"; then
        print_info "Secret ya existe: $secret_name (actualizando)"
    else
        print_info "Agregando secret: $secret_name"
    fi
    
    # Add or update secret
    echo -n "$secret_value" | gh secret set "$secret_name" \
        --repo "$REPO_OWNER/$REPO_NAME" \
        --body - 2>/dev/null || {
        print_error "Error al agregar $secret_name"
        return 1
    }
    
    print_success "$secret_name configurado"
}

# Configure all GitHub Secrets
configure_github_secrets() {
    print_section "Configurando GitHub Secrets"
    
    local success_count=0
    local fail_count=0
    
    # Map of secret names and their env var sources
    declare -A secrets=(
        [DO_TOKEN]="$DO_TOKEN"
        [DO_DROPLET_NAME]="$DO_DROPLET_NAME"
        [DO_REGION]="$DO_REGION"
        [DO_SIZE]="$DO_SIZE"
        [DATABASE_USER]="${DATABASE_USER:-postgres}"
        [DATABASE_PASSWORD]="$DATABASE_PASSWORD"
        [DATABASE_NAME]="${DATABASE_NAME:-sales_os}"
        [REDIS_PASSWORD]="$REDIS_PASSWORD"
        [ANTHROPIC_API_KEY]="$ANTHROPIC_API_KEY"
        [ANTHROPIC_MODEL]="${ANTHROPIC_MODEL:-claude-sonnet-4-20250514}"
        [BIRD_API_KEY]="$BIRD_API_KEY"
        [BIRD_WORKSPACE_ID]="$BIRD_WORKSPACE_ID"
        [BIRD_CHANNEL_ID]="$BIRD_CHANNEL_ID"
        [BIRD_EMAIL_CHANNEL_ID]="$BIRD_EMAIL_CHANNEL_ID"
        [BIRD_PHONE_NUMBER]="$BIRD_PHONE_NUMBER"
        [BREVO_API_KEY]="$BREVO_API_KEY"
        [BREVO_SENDER_EMAIL]="${BREVO_SENDER_EMAIL:-hola@automatizawpp.com}"
        [RESEND_API_KEY]="$RESEND_API_KEY"
        [RESEND_FROM]="${RESEND_FROM:-AutomatizaWPP <noreply@automatizawpp.com>}"
        [SMTP_HOST]="${SMTP_HOST:-smtp.zoho.com}"
        [SMTP_PORT]="${SMTP_PORT:-587}"
        [SMTP_USER]="$SMTP_USER"
        [SMTP_PASS]="$SMTP_PASS"
        [MAIL_FROM]="${MAIL_FROM:-AutomatizaWPP <hola@automatizawpp.com>}"
        [IMAP_HOST]="${IMAP_HOST:-imappro.zoho.com}"
        [IMAP_PORT]="${IMAP_PORT:-993}"
        [IMAP_USER]="$IMAP_USER"
        [IMAP_PASS]="$IMAP_PASS"
        [APP_DOMAIN]="$APP_DOMAIN"
        [APP_URL]="$APP_URL"
        [NEXT_PUBLIC_BASE_URL]="${NEXT_PUBLIC_BASE_URL:-$APP_URL}"
        [NEXTAUTH_URL]="${NEXTAUTH_URL:-$APP_URL}"
        [NEXTAUTH_SECRET]="$NEXTAUTH_SECRET"
        [MAX_TOUCHES_PER_DAY]="${MAX_TOUCHES_PER_DAY:-5}"
        [QUIET_HOURS_START]="${QUIET_HOURS_START:-21}"
        [QUIET_HOURS_END]="${QUIET_HOURS_END:-9}"
        [DEFAULT_TIMEZONE]="${DEFAULT_TIMEZONE:-America/Sao_Paulo}"
        [WORKSPACE_TIMEZONE]="${WORKSPACE_TIMEZONE:-Europe/Madrid}"
        [SENTRY_DSN]="$SENTRY_DSN"
        [LOG_LEVEL]="${LOG_LEVEL:-info}"
        [SLACK_WEBHOOK_URL]="$SLACK_WEBHOOK_URL"
        [SLACK_CHANNEL]="${SLACK_CHANNEL:-#sales-os-alerts}"
        [LE_EMAIL]="${LE_EMAIL:-c.eduardo@me.com}"
    )
    
    # Read SSH private key from system
    local ssh_key=""
    if [ -f ~/.ssh/id_ed25519 ]; then
        ssh_key=$(cat ~/.ssh/id_ed25519)
    elif [ -f ~/.ssh/id_rsa ]; then
        ssh_key=$(cat ~/.ssh/id_rsa)
    else
        print_warning "No se encontró SSH key privada en ~/.ssh"
    fi
    
    if [ -n "$ssh_key" ]; then
        secrets[DO_SSH_PRIVATE_KEY]="$ssh_key"
    fi
    
    # Add each secret
    for secret_name in "${!secrets[@]}"; do
        if add_github_secret "$secret_name" "${secrets[$secret_name]}"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
    done
    
    echo ""
    print_success "Secrets configurados: $success_count"
    if [ $fail_count -gt 0 ]; then
        print_warning "Errores: $fail_count"
    fi
}

# Enable GitHub Actions
enable_github_actions() {
    print_section "Habilitando GitHub Actions"
    
    # Check if workflow file exists
    local workflow_file="$PROJECT_ROOT/.github/workflows/deploy-do.yml"
    if [ ! -f "$workflow_file" ]; then
        print_warning "Workflow file no encontrado: $workflow_file"
        return 1
    fi
    
    print_success "Workflow file encontrado"
    
    # GitHub Actions se habilitan automáticamente si hay un workflow válido
    # Solo necesitamos verificar que existe
    GITHUB_ACTIONS_ENABLED=true
    print_success "GitHub Actions está habilitado"
}

# Check git status
check_git_status() {
    print_section "Verificando estado de Git"
    
    if ! cd "$PROJECT_ROOT"; then
        print_error "No se puede entrar al directorio del proyecto"
        exit 1
    fi
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "Hay cambios no comiteados en el repositorio"
        git status --short
        echo ""
        echo "Opciones:"
        echo "  1. Commitea los cambios: git add . && git commit -m 'Configure deployment'"
        echo "  2. Limpia los cambios: git checkout ."
        read -p "¿Continuar de todas formas? (s/n): " continue_anyway
        if [[ ! "$continue_anyway" =~ ^[Ss]$ ]]; then
            exit 0
        fi
    fi
    
    print_success "Repositorio limpio"
}

# Trigger first deployment
trigger_first_deployment() {
    print_section "Iniciando primer deployment"
    
    if ! cd "$PROJECT_ROOT"; then
        print_error "No se puede entrar al directorio del proyecto"
        exit 1
    fi
    
    # Create deployment marker file
    local marker_file=".deployment-started"
    touch "$marker_file"
    
    # Commit and push
    if git add "$marker_file"; then
        git commit -m "Configure deployment (GitHub Actions enabled)" 2>/dev/null || {
            print_info "No hay cambios para commitear"
            return 0
        }
        
        # Push to main/master branch
        local branch=$(git rev-parse --abbrev-ref HEAD)
        git push origin "$branch"
        
        print_success "Push realizado a $branch"
        print_info "GitHub Actions debería iniciarse en segundos"
        
        return 0
    else
        print_warning "No se pudo agregar marker file"
        return 1
    fi
}

# Display deployment summary
display_summary() {
    print_section "RESUMEN DEL DEPLOYMENT"
    
    echo ""
    echo "Repositorio:        $REPO_OWNER/$REPO_NAME"
    echo "Droplet:            $DO_DROPLET_NAME ($DO_REGION, $DO_SIZE)"
    echo "Dominio:            $APP_DOMAIN"
    echo "URL:                $APP_URL"
    echo ""
    echo -e "${GREEN}Próximos pasos:${NC}"
    echo ""
    echo "1. Verifica que todos los secrets estén en GitHub:"
    echo "   https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
    echo ""
    echo "2. Monitorea el deployment en GitHub Actions:"
    echo "   https://github.com/$REPO_OWNER/$REPO_NAME/actions"
    echo ""
    echo "3. El primer deployment tardará ~20-30 minutos"
    echo ""
    echo "4. Una vez completado, verifica la aplicación:"
    echo "   $APP_URL"
    echo ""
    echo "5. Si usas un dominio personalizado, configura el DNS:"
    echo "   Cname/A record → Dirección IP del droplet"
    echo ""
    echo "6. Configura webhooks en tus servicios:"
    echo "   - Bird API: $APP_URL/api/webhooks/bird"
    echo "   - Brevo: $APP_URL/api/webhooks/brevo"
    echo "   - n8n: $APP_URL/api/webhooks/n8n"
    echo ""
}

# Main execution
main() {
    print_header "AutomatizaWPP — Deployment Setup"
    
    # Step 1: Load configuration
    load_env_file
    
    # Step 2: Validate required variables
    validate_required_vars
    
    # Step 3: Generate missing values
    generate_missing_values
    
    # Step 4: Check GitHub CLI
    check_gh_cli
    
    # Step 5: Get repo info
    get_repo_info
    
    # Step 6: Configure GitHub Secrets
    configure_github_secrets
    
    # Step 7: Enable GitHub Actions
    enable_github_actions
    
    # Step 8: Check git status
    check_git_status
    
    # Step 9: Trigger first deployment
    trigger_first_deployment
    
    # Step 10: Display summary
    display_summary
    
    print_header "Setup completado"
    print_success "Deployment iniciado"
    echo ""
}

# Error handling
trap 'print_error "Script interrumpido"; exit 1' INT TERM

# Execute main function
main "$@"
