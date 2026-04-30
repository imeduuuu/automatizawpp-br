#!/bin/bash

# Script de Deploy Automático para Vercel
# Uso: ./deploy-vercel.sh [--prod]

set -e

PROJECT_NAME="automatizawppBR"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================"
echo "Deploy Vercel - $PROJECT_NAME"
echo "======================================"
echo ""

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "[!] Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
    echo "[OK] Vercel CLI instalado"
    echo ""
fi

# Verificar autenticação
echo "[*] Verificando autenticação Vercel..."
if ! vercel whoami &> /dev/null; then
    echo "[!] Não autenticado. Iniciando login..."
    vercel login
fi
echo "[OK] Autenticado como: $(vercel whoami)"
echo ""

# Navegar para o diretório do projeto
cd "$SCRIPT_DIR"
echo "[*] Diretório: $(pwd)"

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "[ERROR] package.json não encontrado!"
    exit 1
fi

# Deploy
echo "[*] Iniciando deploy..."
if [ "$1" == "--prod" ]; then
    echo "    Modo: PRODUÇÃO (--prod)"
    vercel deploy --prod
else
    echo "    Modo: PREVIEW (omita --prod para deployar direto em produção)"
    vercel deploy
fi

echo ""
echo "======================================"
echo "Deploy concluído!"
echo "======================================"
echo "Dica: Use './deploy-vercel.sh --prod' para deploy em produção"
