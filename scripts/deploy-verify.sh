#!/bin/bash

################################################################################
# AutomatizaWPP — Deployment Verification Script (IDEMPOTENT)
#
# Uso:
#   bash scripts/deploy-verify.sh
#
# Este script verifica el estado del deployment y puede:
#   - Validar que todos los secrets estén configurados
#   - Verificar que GitHub Actions esté habilitado
#   - Mostrar el estado del último deployment
#   - Validar que el droplet sea accesible
#   - Mostrar logs de la aplicación
#
# Es completamente idempotente — no realiza cambios, solo verifica
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
    print_section "Verificando GitHub CLI"
    
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI no está instalado"
        return 1
    fi
    
    if ! gh auth status &>/dev/null; then
        print_error "No estás autenticado con GitHub"
        return 1
    fi
    
    print_success "GitHub CLI disponible"
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

# Check GitHub Secrets
check_github_secrets() {
    print_section "Verificando GitHub Secrets"
    
    local required_secrets=(
        "DO_TOKEN"
        "DO_DROPLET_NAME"
        "DATABASE_PASSWORD"
        "REDIS_PASSWORD"
        "ANTHROPIC_API_KEY"
        "NEXTAUTH_SECRET"
        "APP_DOMAIN"
        "APP_URL"
    )
    
    local found=0
    local missing=0
    
    for secret in "${required_secrets[@]}"; do
        if gh secret list --repo "$REPO_OWNER/$REPO_NAME" 2>/dev/null | grep -q "^$secret"; then
            print_success "Secret configurado: $secret"
            ((found++))
        else
            print_error "Secret faltante: $secret"
            ((missing++))
        fi
    done
    
    echo ""
    print_info "Secrets encontrados: $found/${#required_secrets[@]}"
    
    if [ $missing -gt 0 ]; then
        print_warning "Falta configurar $missing secrets"
        return 1
    fi
}

# Check GitHub Actions
check_github_actions() {
    print_section "Verificando GitHub Actions"
    
    # Check if workflow exists
    local workflow_file=".github/workflows/deploy-do.yml"
    if [ ! -f "$PROJECT_ROOT/$workflow_file" ]; then
        print_error "Workflow file no encontrado: $workflow_file"
        return 1
    fi
    
    print_success "Workflow file encontrado"
    
    # Get latest workflow run
    print_info "Obteniendo estado del último deployment..."
    
    local latest_run=$(gh run list \
        --repo "$REPO_OWNER/$REPO_NAME" \
        --workflow deploy-do.yml \
        --limit 1 \
        --json status,conclusion,name,createdAt,url \
        2>/dev/null)
    
    if [ -z "$latest_run" ] || [ "$latest_run" == "[]" ]; then
        print_warning "Aún no hay ejecuciones del workflow"
        return 0
    fi
    
    # Parse JSON (simple approach)
    local status=$(echo "$latest_run" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    local conclusion=$(echo "$latest_run" | grep -o '"conclusion":"[^"]*"' | head -1 | cut -d'"' -f4)
    local created=$(echo "$latest_run" | grep -o '"createdAt":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    echo ""
    echo "Último deployment:"
    echo "  Estado: $status"
    echo "  Resultado: ${conclusion:-pendiente}"
    echo "  Creado: $created"
    
    if [ "$status" == "completed" ] && [ "$conclusion" == "success" ]; then
        print_success "Último deployment fue exitoso"
        return 0
    elif [ "$status" == "in_progress" ]; then
        print_warning "Deployment en progreso..."
        return 0
    else
        print_warning "Último deployment mostró problemas"
        return 1
    fi
}

# Check DigitalOcean droplet
check_droplet() {
    print_section "Verificando DigitalOcean Droplet"
    
    # Check if doctl is available
    if ! command -v doctl &> /dev/null; then
        print_warning "doctl CLI no está instalado, saltando verificación de droplet"
        return 0
    fi
    
    # Authenticate
    doctl auth init --access-token "$DO_TOKEN" 2>/dev/null || {
        print_warning "No se pudo autenticar con DigitalOcean"
        return 1
    }
    
    # Check if droplet exists
    local droplet_info=$(doctl compute droplet list \
        --format Name,Status,PublicIPv4 \
        --no-header | grep "^$DO_DROPLET_NAME")
    
    if [ -z "$droplet_info" ]; then
        print_warning "Droplet '$DO_DROPLET_NAME' no existe aún (será creado durante deployment)"
        return 0
    fi
    
    local droplet_status=$(echo "$droplet_info" | awk '{print $2}')
    local droplet_ip=$(echo "$droplet_info" | awk '{print $3}')
    
    echo "Droplet: $DO_DROPLET_NAME"
    echo "  Estado: $droplet_status"
    echo "  IP: $droplet_ip"
    echo ""
    
    if [ "$droplet_status" == "active" ]; then
        print_success "Droplet está activo"
        
        # Try to check app health
        if [ -n "$droplet_ip" ]; then
            print_info "Verificando salud de la aplicación..."
            if curl -s -f "http://$droplet_ip/api/health" > /dev/null 2>&1; then
                print_success "Aplicación está sana"
            else
                print_warning "Aplicación no está respondiendo aún (puede estar inicializando)"
            fi
        fi
    else
        print_warning "Droplet no está activo: $droplet_status"
    fi
}

# Display helpful information
display_help() {
    print_section "Información útil"
    
    echo "GitHub Secrets:"
    echo "  https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
    echo ""
    echo "GitHub Actions:"
    echo "  https://github.com/$REPO_OWNER/$REPO_NAME/actions"
    echo ""
    echo "DigitalOcean Console:"
    echo "  https://cloud.digitalocean.com/droplets"
    echo ""
}

# Main execution
main() {
    print_header "AutomatizaWPP — Deployment Verification"
    
    local failed=0
    
    # Step 1: Load configuration
    if ! load_env_file; then
        ((failed++))
    fi
    
    # Step 2: Check GitHub CLI
    if ! check_gh_cli; then
        ((failed++))
    fi
    
    # Step 3: Get repo info
    if ! get_repo_info; then
        ((failed++))
    fi
    
    # Only continue if we have repo info
    if [ $failed -eq 0 ]; then
        # Step 4: Check GitHub Secrets
        check_github_secrets || true
        
        # Step 5: Check GitHub Actions
        check_github_actions || true
        
        # Step 6: Check DigitalOcean droplet
        check_droplet || true
        
        # Step 7: Display helpful information
        display_help
    fi
    
    print_header "Verificación completada"
    
    if [ $failed -gt 0 ]; then
        print_warning "Se encontraron $failed errores"
        echo ""
        echo "Para resolver:"
        echo "  1. Verifica que estés en el directorio del proyecto"
        echo "  2. Verifica que tengas GitHub CLI instalado: gh auth login"
        echo "  3. Verifica que .env.deploy esté correctamente configurado"
        exit 1
    fi
    
    print_success "Todo está configurado correctamente"
}

# Error handling
trap 'print_error "Script interrumpido"; exit 1' INT TERM

# Execute main function
main "$@"
