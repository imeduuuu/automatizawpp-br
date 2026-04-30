#!/bin/bash

##############################################################################
# AUTOMATIZAWPP DEPLOY SCRIPT FOR DIGITALOCEAN
# Purpose: Automated deployment with validation
# Usage: ./scripts/deploy-do.sh
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

##############################################################################
# 1. PULL CODE
##############################################################################
log_info "Step 1: Pulling latest code from main branch..."

if git pull origin main; then
    log_success "Code pulled successfully"
else
    log_error "Failed to pull code from origin/main"
    exit 1
fi

##############################################################################
# 2. BUILD
##############################################################################
log_info "Step 2: Running build process..."

if npm run build; then
    log_success "Build completed successfully"
else
    log_error "Build failed. Check logs above"
    exit 1
fi

##############################################################################
# 3. START DOCKER COMPOSE
##############################################################################
log_info "Step 3: Starting Docker Compose services..."

if [ ! -f "docker-compose.prod.yml" ]; then
    log_error "docker-compose.prod.yml not found in current directory"
    exit 1
fi

if docker-compose -f docker-compose.prod.yml up -d; then
    log_success "Docker Compose services started"
else
    log_error "Failed to start Docker Compose"
    exit 1
fi

# Wait for services to be ready
log_info "Waiting 10 seconds for services to stabilize..."
sleep 10

##############################################################################
# 4. VALIDATE ENDPOINTS
##############################################################################
log_info "Step 4: Validating critical endpoints..."

DOMAIN="${AUTOMATIZAWPP_DOMAIN:-https://automatizawpp.com}"
VALIDATION_FAILED=false

# Check robots.txt
log_info "  Checking robots.txt..."
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/robots.txt")
if [ "$ROBOTS_STATUS" = "200" ]; then
    log_success "    robots.txt is accessible (HTTP $ROBOTS_STATUS)"
else
    log_error "    robots.txt returned HTTP $ROBOTS_STATUS (expected 200)"
    VALIDATION_FAILED=true
fi

# Check sitemap.xml
log_info "  Checking sitemap.xml..."
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/sitemap.xml")
if [ "$SITEMAP_STATUS" = "200" ]; then
    log_success "    sitemap.xml is accessible (HTTP $SITEMAP_STATUS)"
else
    log_error "    sitemap.xml returned HTTP $SITEMAP_STATUS (expected 200)"
    VALIDATION_FAILED=true
fi

##############################################################################
# 5. FINAL REPORT
##############################################################################
echo ""
echo "============================================================================"

if [ "$VALIDATION_FAILED" = false ]; then
    log_success "DEPLOYMENT COMPLETED SUCCESSFULLY"
    echo ""
    log_info "Summary:"
    echo "  - Code pulled from origin/main"
    echo "  - Build completed without errors"
    echo "  - Docker Compose services running"
    echo "  - robots.txt accessible at $DOMAIN/robots.txt"
    echo "  - sitemap.xml accessible at $DOMAIN/sitemap.xml"
    echo ""
    log_info "Next steps:"
    echo "  1. Monitor Docker logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  2. Verify application health: curl -I $DOMAIN"
    echo "  3. Check Google Search Console for indexing progress"
    echo ""
    echo "============================================================================"
    exit 0
else
    log_error "DEPLOYMENT VALIDATION FAILED"
    echo ""
    log_warn "Some endpoints returned unexpected status codes."
    echo "  Check Docker logs for details: docker-compose -f docker-compose.prod.yml logs"
    echo "============================================================================"
    exit 1
fi
