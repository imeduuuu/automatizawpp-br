#!/bin/bash

# Script para configurar variáveis de ambiente do Vercel
# Uso: ./env-setup.sh [pull|list|help]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_LOCAL="$PROJECT_ROOT/.env.local"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

echo "======================================"
echo "Gerenciador de ENV - Vercel"
echo "======================================"
echo ""

# Verificar Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "[ERROR] Vercel CLI não instalado!"
    echo "Instale com: npm install -g vercel"
    exit 1
fi

# Verificar autenticação
if ! vercel whoami &> /dev/null 2>&1; then
    echo "[ERROR] Não autenticado no Vercel!"
    echo "Execute: vercel login"
    exit 1
fi

COMMAND="${1:-help}"

case "$COMMAND" in
    pull)
        echo "[*] Puxando variáveis do Vercel..."
        vercel env pull
        echo "[OK] Variáveis salvas em .env.local"
        echo ""
        echo "Próximo passo:"
        echo "  1. Verificar .env.local"
        echo "  2. Copiar variáveis sensíveis para .env se precisar testar localmente"
        echo "  3. NUNCA commitar .env.local para Git!"
        ;;

    list)
        echo "[*] Variáveis configuradas no Vercel:"
        echo ""
        vercel env ls
        ;;

    generate-secret)
        echo "[*] Gerando NEXTAUTH_SECRET..."
        SECRET=$(openssl rand -base64 32)
        echo ""
        echo "Cole isto no Vercel dashboard → Settings → Environment Variables:"
        echo ""
        echo "NEXTAUTH_SECRET = $SECRET"
        echo ""
        echo "Ou use este comando para adicionar diretamente:"
        echo "vercel env add NEXTAUTH_SECRET $SECRET"
        ;;

    *)
        cat << 'HELP'
Uso: ./env-setup.sh [COMANDO]

Comandos:
  pull              Puxar variáveis do Vercel para .env.local
  list              Listar variáveis configuradas no Vercel
  generate-secret   Gerar NEXTAUTH_SECRET aleatório
  help              Mostra esta mensagem

Exemplos:
  ./env-setup.sh pull
  ./env-setup.sh list
  ./env-setup.sh generate-secret

Nota:
  - Sempre puxar variáveis APÓS configurar no Vercel dashboard
  - NUNCA commitar .env.local para Git
  - Usar .env.example para documentar variáveis obrigatórias
HELP
        ;;
esac
