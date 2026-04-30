#!/bin/bash

################################################################################
# AutomatizaWPP — Update Secrets Script (IDEMPOTENT)
#
# Uso:
#   bash scripts/deploy-update-secrets.sh
#
# Este script permite actualizar secrets específicos sin reejecutar todo el setup.
# Es idempotente — puede ejecutarse múltiples veces.
#
# Casos de uso:
#   - Actualizar una credencial que cambió (ej: API key renovada)
#   - Agregar un nuevo secret que antes no existía
#   - Sincronizar .env.deploy con GitHub Secrets
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

# Load environment file
load_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Archivo no encontrado: $ENV_FILE"
        echo ""
        echo "Copia el archivo de ejemplo:"
        echo "  cp $PROJECT_ROOT/.env.deploy.example $ENV_FILE"
        return 1
    fi
    
    source "$ENV_FILE" 2>/dev/null
    print_success "Configuración cargada"
}

# Check GitHub CLI
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI no está instalado"
        return 1
    fi
    
    if ! gh auth status &>/dev/null; then
        print_error "No estás autenticado con GitHub"
        return 1
    fi
}

# Get repository info
get_repo_info() {
    if ! cd "$PROJECT_ROOT"; then
        return 1
    fi
    
    local remote_url
    remote_url=$(git config --get remote.origin.url)
    
    if [[ $remote_url == *"github.com"* ]]; then
        REPO_OWNER=$(echo "$remote_url" | sed -E 's|.*github.com[:/]([^/]+)/.*|\1|')
        REPO_NAME=$(echo "$remote_url" | sed -E 's|.*github.com[:/][^/]+/(.+?)(.git)?$|\1|')
    fi
    
    if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
        print_error "No se pudo detectar información del repositorio"
        return 1
    fi
}

# List available secrets to update
list_available_secrets() {
    local secrets=(
        "DO_TOKEN:DigitalOcean API Token"
        "DO_DROPLET_NAME:Nombre del droplet"
        "DATABASE_PASSWORD:Contraseña PostgreSQL"
        "REDIS_PASSWORD:Contraseña Redis"
        "ANTHROPIC_API_KEY:API Key de Anthropic"
        "NEXTAUTH_SECRET:NextAuth Secret"
        "BREVO_API_KEY:API Key de Brevo"
        "BIRD_API_KEY:API Key de Bird"
        "SMTP_PASS:Contraseña SMTP"
        "SLACK_WEBHOOK_URL:URL del webhook de Slack"
        "SENTRY_DSN:Sentry DSN para error tracking"
        "APP_DOMAIN:Dominio de la aplicación"
        "APP_URL:URL completa de la aplicación"
    )
    
    echo "Secrets disponibles:"
    echo ""
    
    local i=1
    for secret_info in "${secrets[@]}"; do
        local secret_name="${secret_info%:*}"
        local secret_desc="${secret_info#*:}"
        echo "  $i) $secret_name — $secret_desc"
        ((i++))
    done
    
    echo ""
}

# Interactive secret update
update_single_secret() {
    print_section "Actualizar un Secret"
    
    local secret_name
    local secret_value
    
    read -p "Nombre del secret a actualizar: " secret_name
    
    if [ -z "$secret_name" ]; then
        print_error "Nombre de secret vacío"
        return 1
    fi
    
    # Get value from env file
    local current_value="${!secret_name}"
    
    if [ -z "$current_value" ]; then
        print_warning "Secret no encontrado en $ENV_FILE"
        print_info "Proporciona un nuevo valor:"
        read -s secret_value
    else
        echo "Valor actual (parcial): ${current_value:0:10}......"
        read -s -p "Nuevo valor (Enter para mantener): " secret_value
        
        if [ -z "$secret_value" ]; then
            secret_value="$current_value"
        fi
    fi
    
    echo ""
    
    # Update GitHub secret
    if [ -z "$secret_value" ]; then
        print_error "Valor vacío, cancelando"
        return 1
    fi
    
    print_info "Actualizando GitHub secret: $secret_name"
    
    echo -n "$secret_value" | gh secret set "$secret_name" \
        --repo "$REPO_OWNER/$REPO_NAME" \
        --body - 2>/dev/null || {
        print_error "Error al actualizar $secret_name"
        return 1
    }
    
    print_success "Secret '$secret_name' actualizado"
}

# Sync all secrets from .env.deploy to GitHub
sync_all_secrets() {
    print_section "Sincronizar todos los Secrets"
    
    local all_secrets=(
        DO_TOKEN
        DO_DROPLET_NAME
        DO_REGION
        DO_SIZE
        DATABASE_USER
        DATABASE_PASSWORD
        DATABASE_NAME
        REDIS_PASSWORD
        ANTHROPIC_API_KEY
        ANTHROPIC_MODEL
        BIRD_API_KEY
        BIRD_WORKSPACE_ID
        BIRD_CHANNEL_ID
        BIRD_EMAIL_CHANNEL_ID
        BIRD_PHONE_NUMBER
        BREVO_API_KEY
        BREVO_SENDER_EMAIL
        RESEND_API_KEY
        RESEND_FROM
        SMTP_HOST
        SMTP_PORT
        SMTP_USER
        SMTP_PASS
        MAIL_FROM
        IMAP_HOST
        IMAP_PORT
        IMAP_USER
        IMAP_PASS
        APP_DOMAIN
        APP_URL
        NEXT_PUBLIC_BASE_URL
        NEXTAUTH_URL
        NEXTAUTH_SECRET
        MAX_TOUCHES_PER_DAY
        QUIET_HOURS_START
        QUIET_HOURS_END
        DEFAULT_TIMEZONE
        WORKSPACE_TIMEZONE
        SENTRY_DSN
        LOG_LEVEL
        SLACK_WEBHOOK_URL
        SLACK_CHANNEL
        LE_EMAIL
    )
    
    local updated=0
    local skipped=0
    
    for secret_name in "${all_secrets[@]}"; do
        local value="${!secret_name}"
        
        if [ -z "$value" ]; then
            ((skipped++))
            continue
        fi
        
        print_info "Sincronizando: $secret_name"
        
        echo -n "$value" | gh secret set "$secret_name" \
            --repo "$REPO_OWNER/$REPO_NAME" \
            --body - 2>/dev/null || {
            print_warning "No se pudo actualizar $secret_name"
            continue
        }
        
        ((updated++))
    done
    
    echo ""
    print_success "Secrets sincronizados: $updated"
    print_info "Secrets omitidos (vacíos): $skipped"
}

# Delete a secret from GitHub
delete_secret() {
    print_section "Eliminar un Secret"
    
    read -p "Nombre del secret a eliminar: " secret_name
    
    if [ -z "$secret_name" ]; then
        print_error "Nombre de secret vacío"
        return 1
    fi
    
    read -p "¿Confirmas que deseas eliminar '$secret_name'? (s/n): " confirm
    if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
        print_info "Cancelado"
        return 0
    fi
    
    gh secret delete "$secret_name" \
        --repo "$REPO_OWNER/$REPO_NAME" 2>/dev/null || {
        print_error "Error al eliminar $secret_name"
        return 1
    }
    
    print_success "Secret '$secret_name' eliminado"
}

# List GitHub secrets
list_github_secrets() {
    print_section "Secrets en GitHub"
    
    echo "Secrets configurados en GitHub:"
    echo ""
    
    gh secret list --repo "$REPO_OWNER/$REPO_NAME" 2>/dev/null | head -20 || {
        print_error "No se pudo listar los secrets"
        return 1
    }
}

# Main menu
show_menu() {
    echo ""
    echo "¿Qué deseas hacer?"
    echo ""
    echo "  1) Actualizar un secret específico"
    echo "  2) Sincronizar todos los secrets de .env.deploy"
    echo "  3) Ver secrets configurados en GitHub"
    echo "  4) Eliminar un secret"
    echo "  5) Ver secrets disponibles"
    echo "  6) Salir"
    echo ""
    read -p "Selecciona una opción (1-6): " choice
    
    case $choice in
        1) update_single_secret ;;
        2) sync_all_secrets ;;
        3) list_github_secrets ;;
        4) delete_secret ;;
        5) list_available_secrets ;;
        6) exit 0 ;;
        *) print_error "Opción inválida" ;;
    esac
}

# Main execution
main() {
    print_header "AutomatizaWPP — Update Secrets"
    
    # Step 1: Load configuration
    if ! load_env_file; then
        exit 1
    fi
    
    # Step 2: Check GitHub CLI
    if ! check_gh_cli; then
        exit 1
    fi
    
    # Step 3: Get repo info
    if ! get_repo_info; then
        exit 1
    fi
    
    print_success "Repositorio: $REPO_OWNER/$REPO_NAME"
    
    # Interactive menu loop
    while true; do
        show_menu || true
    done
}

# Error handling
trap 'print_error "Script interrumpido"; exit 1' INT TERM

# Execute main function
main "$@"
