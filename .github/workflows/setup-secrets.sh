#!/bin/bash

#################################################################################
# AutomatizaWPP GitHub Secrets Setup Helper
#
# Uso: ./setup-secrets.sh
#
# Este script ayuda a generar y configurar los secrets necesarios para
# deployment automático a DigitalOcean.
#
# NO EJECUTA gh auth (asume que ya hiciste `gh auth login`)
#################################################################################

set -e

REPO_OWNER=""
REPO_NAME=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

validate_gh_auth() {
    print_info "Verificando autenticación con GitHub..."
    if ! gh auth status &>/dev/null; then
        print_error "No estás autenticado con GitHub"
        echo "Ejecuta: gh auth login"
        exit 1
    fi
    print_success "Autenticación verificada"
}

get_repo_info() {
    print_info "Detectando información del repositorio..."

    # Intenta obtener info del repo
    if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
        local remote_url
        remote_url=$(git config --get remote.origin.url)

        if [[ $remote_url == *"github.com"* ]]; then
            REPO_OWNER=$(echo "$remote_url" | sed -E 's|.*github.com[:/]([^/]+)/.*|\1|')
            REPO_NAME=$(echo "$remote_url" | sed -E 's|.*github.com[:/][^/]+/(.+?)(.git)?$|\1|')
        fi
    fi

    if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
        print_error "No se pudo detectar el repositorio"
        echo "Proporciona manualmente:"
        read -p "GitHub username/org: " REPO_OWNER
        read -p "Repository name: " REPO_NAME
    fi

    echo ""
    echo "Repositorio: $REPO_OWNER/$REPO_NAME"
    echo ""
}

generate_secret() {
    openssl rand -base64 32 | tr -d '\n'
}

prompt_secret() {
    local secret_name=$1
    local secret_description=$2
    local generated_value=$3
    local is_optional=$4

    echo ""
    echo "📝 $secret_name"
    echo "   Descripción: $secret_description"

    if [ -n "$generated_value" ]; then
        echo -e "   ${YELLOW}(Generado)${NC}: $generated_value"
        read -p "   Usar este valor? (s/n): " use_generated
        if [[ "$use_generated" =~ ^[Ss]$ ]]; then
            SECRETS[$secret_name]="$generated_value"
            return
        fi
    fi

    if [ "$is_optional" == "optional" ]; then
        read -p "   Valor (o Enter para omitir): " value
    else
        while [ -z "$value" ]; do
            read -p "   Valor (requerido): " value
        done
    fi

    SECRETS[$secret_name]="$value"
}

add_secret_to_github() {
    local secret_name=$1
    local secret_value=$2

    if [ -z "$secret_value" ]; then
        return
    fi

    print_info "Agregando secret: $secret_name"

    echo -n "$secret_value" | gh secret set "$secret_name" \
        --repo "$REPO_OWNER/$REPO_NAME" \
        --body - 2>/dev/null || {
        print_error "Error al agregar $secret_name"
        return 1
    }

    print_success "Secret '$secret_name' agregado"
}

declare -A SECRETS

main() {
    print_header "AutomatizaWPP — GitHub Secrets Setup"

    validate_gh_auth
    get_repo_info

    print_header "PASO 1: DigitalOcean API Token"
    echo "1. Ve a https://cloud.digitalocean.com/account/api/tokens"
    echo "2. Click 'Generate New Token'"
    echo "3. Name: 'github-actions'"
    echo "4. Scopes: 'read' y 'write'"
    echo "5. Click 'Generate Token'"
    echo "6. Copia el token (aparece una sola vez)"
    echo ""
    prompt_secret "DO_TOKEN" "DigitalOcean API Token" "" ""

    print_header "PASO 2: DigitalOcean SSH Key"
    echo "Agrega tu SSH key pública a DigitalOcean:"
    echo "1. Ve a https://cloud.digitalocean.com/account/security/keys"
    echo "2. Click 'Add SSH Key'"
    echo "3. Pega tu llave pública (~/.ssh/id_rsa.pub o ~/.ssh/id_ed25519.pub)"
    echo ""
    read -p "¿Ya agregaste la SSH key? (s/n): " ssh_added
    if [[ ! "$ssh_added" =~ ^[Ss]$ ]]; then
        print_warning "Agrega la SSH key antes de continuar"
        exit 1
    fi

    print_header "PASO 3: SSH Private Key (para GitHub Actions)"
    echo "GitHub Actions necesita acceso SSH al droplet."
    echo "Usaremos tu llave privada existente o crearemos una nueva."
    echo ""
    read -p "¿Usar llave existente? (s/n) [s]: " use_existing
    use_existing=${use_existing:-s}

    local ssh_key
    if [[ "$use_existing" =~ ^[Ss]$ ]]; then
        # Detectar llave existente
        if [ -f ~/.ssh/id_ed25519 ]; then
            SSH_KEY=~/.ssh/id_ed25519
            print_info "Usando: $SSH_KEY"
        elif [ -f ~/.ssh/id_rsa ]; then
            SSH_KEY=~/.ssh/id_rsa
            print_info "Usando: $SSH_KEY"
        else
            print_error "No encontré llave SSH en ~/.ssh"
            exit 1
        fi
    else
        print_info "Creando nueva SSH key..."
        ssh_file=~/.ssh/do_github_actions
        ssh-keygen -t ed25519 -f "$ssh_file" -N "" -C "github-actions"
        SSH_KEY=$ssh_file
        print_success "SSH key creada: $SSH_KEY"
        print_warning "IMPORTANTE: Agrega la llave pública a DigitalOcean:"
        echo "   cat $SSH_KEY.pub | pbcopy"
        echo "   Luego: https://cloud.digitalocean.com/account/security/keys"
    fi

    local private_key_content
    private_key_content=$(cat "$SSH_KEY")
    SECRETS["DO_SSH_PRIVATE_KEY"]="$private_key_content"

    print_header "PASO 4: Configuración de Droplet"
    prompt_secret "DO_DROPLET_NAME" "Nombre del droplet a crear/usar" "sales-os-prod" ""
    prompt_secret "DO_REGION" "Región DigitalOcean (nyc3, lon1, etc.)" "nyc3" "optional"

    print_header "PASO 5: Base de Datos"
    local db_pass
    db_pass=$(generate_secret)
    prompt_secret "DATABASE_PASSWORD" "Contraseña PostgreSQL (min 16 chars)" "$db_pass" ""

    local redis_pass
    redis_pass=$(generate_secret)
    prompt_secret "REDIS_PASSWORD" "Contraseña Redis (min 16 chars)" "$redis_pass" ""

    print_header "PASO 6: Anthropic API"
    echo "Obtén tu API key en: https://console.anthropic.com/account/keys"
    echo ""
    prompt_secret "ANTHROPIC_API_KEY" "Llave de Anthropic Claude" "" ""
    prompt_secret "ANTHROPIC_MODEL" "Modelo de Claude" "claude-sonnet-4-20250514" "optional"

    print_header "PASO 7: Bird API (opcional)"
    echo "Si usas Bird para integraciones de canales, proporciona:"
    echo ""
    prompt_secret "BIRD_API_KEY" "Bird API Key" "" "optional"
    prompt_secret "BIRD_WORKSPACE_ID" "Bird Workspace ID" "" "optional"
    prompt_secret "BIRD_CHANNEL_ID" "Bird Channel ID" "" "optional"
    prompt_secret "BIRD_EMAIL_CHANNEL_ID" "Bird Email Channel ID" "" "optional"

    print_header "PASO 8: Brevo Email (opcional)"
    echo "Obtén key en: https://app.brevo.com/settings/account/api"
    echo ""
    prompt_secret "BREVO_API_KEY" "Brevo API Key" "" "optional"

    print_header "PASO 9: SMTP Email (opcional)"
    echo "Configuración de servidor SMTP (Zoho, Gmail, etc.)"
    echo ""
    prompt_secret "SMTP_HOST" "SMTP Host" "smtp.zoho.com" "optional"
    prompt_secret "SMTP_PORT" "SMTP Port" "587" "optional"
    prompt_secret "SMTP_USER" "SMTP User" "" "optional"
    prompt_secret "SMTP_PASS" "SMTP Password" "" "optional"
    prompt_secret "MAIL_FROM" "From address" "AutomatizaWPP <noreply@automatizawpp.com>" "optional"

    print_header "PASO 10: Autenticación"
    local nextauth_secret
    nextauth_secret=$(generate_secret)
    prompt_secret "NEXTAUTH_SECRET" "NextAuth Secret (min 32 chars)" "$nextauth_secret" ""

    print_header "PASO 11: Configuración de Aplicación"
    prompt_secret "APP_DOMAIN" "Dominio de la app" "automatizawpp.com" "optional"
    prompt_secret "LE_EMAIL" "Email para Let's Encrypt" "c.eduardo@me.com" "optional"
    prompt_secret "APP_URL" "URL de la aplicación" "https://automatizawpp.com" "optional"

    print_header "PASO 12: Notificaciones (opcional)"
    echo "Para notificaciones en Slack:"
    echo "1. Ve a https://api.slack.com/apps"
    echo "2. Create New App → From scratch"
    echo "3. Incoming Webhooks → Add New Webhook to Workspace"
    echo "4. Copia la URL del webhook"
    echo ""
    prompt_secret "SLACK_WEBHOOK_URL" "Slack Webhook URL" "" "optional"

    # Resumen
    print_header "RESUMEN DE SECRETS"

    echo "Secrets a agregar:"
    echo ""

    declare -a MANDATORY=(
        "DO_TOKEN"
        "DO_DROPLET_NAME"
        "DO_SSH_PRIVATE_KEY"
        "DATABASE_PASSWORD"
        "REDIS_PASSWORD"
        "ANTHROPIC_API_KEY"
        "NEXTAUTH_SECRET"
    )

    declare -a OPTIONAL=(
        "ANTHROPIC_MODEL"
        "DO_REGION"
        "BIRD_API_KEY"
        "BIRD_WORKSPACE_ID"
        "BIRD_CHANNEL_ID"
        "BIRD_EMAIL_CHANNEL_ID"
        "BREVO_API_KEY"
        "SMTP_HOST"
        "SMTP_PORT"
        "SMTP_USER"
        "SMTP_PASS"
        "MAIL_FROM"
        "APP_DOMAIN"
        "LE_EMAIL"
        "APP_URL"
        "SLACK_WEBHOOK_URL"
    )

    echo -e "${GREEN}OBLIGATORIOS (${#MANDATORY[@]}):${NC}"
    for secret in "${MANDATORY[@]}"; do
        if [ -n "${SECRETS[$secret]}" ]; then
            echo "  ✅ $secret"
        fi
    done

    echo ""
    echo -e "${YELLOW}OPCIONALES (${#OPTIONAL[@]}):${NC}"
    for secret in "${OPTIONAL[@]}"; do
        if [ -n "${SECRETS[$secret]}" ]; then
            echo "  ✅ $secret"
        else
            echo "  ⊘ $secret (no configurado)"
        fi
    done

    echo ""
    read -p "¿Agregar estos secrets a GitHub? (s/n): " confirm
    if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
        print_warning "Operación cancelada. Ejecuta el script nuevamente para agregar los secrets."
        exit 0
    fi

    # Agregar secrets a GitHub
    print_header "Agregando Secrets a GitHub"

    local success_count=0
    local fail_count=0

    for secret in "${!SECRETS[@]}"; do
        if add_secret_to_github "$secret" "${SECRETS[$secret]}"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
    done

    print_header "✅ SETUP COMPLETADO"

    echo "Secrets agregados: $success_count"
    if [ $fail_count -gt 0 ]; then
        echo "Errores: $fail_count"
    fi

    echo ""
    echo "Próximos pasos:"
    echo ""
    echo "1. Ve al repositorio en GitHub:"
    echo "   https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
    echo ""
    echo "2. Verifica que todos los secrets aparezcan en la lista"
    echo ""
    echo "3. Haz un push para iniciar el deployment automático:"
    echo "   git add ."
    echo "   git commit -m 'Configure deployment workflows'"
    echo "   git push origin main"
    echo ""
    echo "4. Ve a Actions para ver el progreso:"
    echo "   https://github.com/$REPO_OWNER/$REPO_NAME/actions"
    echo ""
    echo "5. Deployment tardará ~20-30 minutos en la primera ejecución"
    echo ""
    echo -e "${GREEN}¡Deployment automático configurado!${NC}"
}

# Ejecutar
main
