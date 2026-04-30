#!/bin/bash

DOMAIN="${1:-automatizawpp.com}"
TIMEOUT="${2:-10}"

echo "🔍 Verificando meta tag do Google em https://$DOMAIN..."
echo ""

# Verifica se o site está acessível
if ! curl -s -m "$TIMEOUT" "https://$DOMAIN" &> /dev/null; then
    echo "❌ ERRO: Site não está acessível em https://$DOMAIN"
    exit 1
fi

# Procura pela meta tag
META_TAG=$(curl -s "https://$DOMAIN" | grep -o 'name="google-site-verification"[^>]*')

if [ -n "$META_TAG" ]; then
    echo "✅ META TAG ENCONTRADA!"
    echo ""
    echo "Conteúdo:"
    echo "$META_TAG"
    echo ""

    # Extrai o código de verificação
    CODE=$(echo "$META_TAG" | grep -o 'content="[^"]*"' | cut -d'"' -f2)
    echo "Código de verificação: $CODE"

    exit 0
else
    echo "❌ Meta tag NÃO encontrada ainda"
    echo ""
    echo "Possíveis razões:"
    echo "1. O deploy ainda não foi feito"
    echo "2. O site está servindo cache antigo"
    echo "3. A meta tag não foi adicionada corretamente"

    exit 1
fi
