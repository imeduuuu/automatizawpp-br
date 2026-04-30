#!/bin/bash

# Script SIMPLES para verificar meta tag google-site-verification com curl + grep
# Uso: ./verify-google-meta-tag-simple.sh <url>
# Exemplo: ./verify-google-meta-tag-simple.sh https://meusite.com.br

if [ -z "$1" ]; then
    echo "Uso: $0 <url>"
    echo "Exemplo: $0 https://meusite.com.br"
    exit 1
fi

URL="$1"
echo "Verificando: $URL"
echo ""

# Método 1: curl + grep (mais direto)
echo "=== Verificação simples (curl + grep) ==="
curl -s "$URL" | grep -i "google-site-verification" && echo "✓ Meta tag encontrada!" || echo "✗ Meta tag não encontrada"
echo ""

# Método 2: curl + grep com detalhes
echo "=== Detalhes completos ==="
curl -s "$URL" | grep -i "google-site-verification" | head -1
echo ""

# Método 3: Validar com código específico (se fornecido como segundo argumento)
if [ -n "$2" ]; then
    echo "=== Validando código: $2 ==="
    if curl -s "$URL" | grep -q "google-site-verification.*$2"; then
        echo "✓ Código encontrado!"
    else
        echo "✗ Código não encontrado"
    fi
fi
