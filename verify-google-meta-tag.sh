#!/bin/bash

# Script para verificar se a meta tag "google-site-verification" foi adicionada com sucesso
# Uso: ./verify-google-meta-tag.sh <url-do-site> [código-esperado-opcional]
# Exemplo: ./verify-google-meta-tag.sh https://meusite.com.br
# Exemplo com validação: ./verify-google-meta-tag.sh https://meusite.com.br "abc123xyz456"

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validar argumentos
if [ $# -lt 1 ]; then
    echo -e "${RED}Erro: URL do site é obrigatória${NC}"
    echo "Uso: $0 <url-do-site> [código-esperado-opcional]"
    echo "Exemplo: $0 https://meusite.com.br"
    echo "Exemplo com validação: $0 https://meusite.com.br 'abc123xyz456'"
    exit 1
fi

SITE_URL="$1"
EXPECTED_CODE="$2"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verificador de Meta Tag Google${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Data/Hora: $(date '+%Y-%m-%d %H:%M:%S')"
echo "URL: $SITE_URL"
if [ -n "$EXPECTED_CODE" ]; then
    echo "Código esperado: $EXPECTED_CODE"
fi
echo ""

# Fazer requisição HTTP e capturar o HTML
echo -e "${YELLOW}1. Fazendo requisição para o site...${NC}"
HTTP_CODE=$(curl -s -o /tmp/site_response.html -w "%{http_code}" "$SITE_URL")

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}✗ Erro na requisição HTTP${NC}"
    echo "Código HTTP: $HTTP_CODE"
    exit 1
fi

echo -e "${GREEN}✓ Requisição bem-sucedida (HTTP $HTTP_CODE)${NC}"
echo ""

# Procurar pela meta tag
echo -e "${YELLOW}2. Procurando pela meta tag google-site-verification...${NC}"

METATAG=$(grep -i 'google-site-verification' /tmp/site_response.html || echo "")

if [ -z "$METATAG" ]; then
    echo -e "${RED}✗ Meta tag google-site-verification NÃO encontrada${NC}"
    echo ""
    echo -e "${YELLOW}Dicas:${NC}"
    echo "- Verifique se o arquivo foi publicado corretamente no deploy"
    echo "- Aguarde alguns minutos (cache pode estar ativo)"
    echo "- Confirme que a meta tag está em _document.tsx ou pages/_document.tsx"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Meta tag encontrada!${NC}"
echo ""

# Extrair o conteúdo completo da meta tag
echo -e "${YELLOW}3. Detalhes da meta tag encontrada:${NC}"
echo "$METATAG"
echo ""

# Se um código esperado foi fornecido, validar
if [ -n "$EXPECTED_CODE" ]; then
    echo -e "${YELLOW}4. Validando código...${NC}"

    if echo "$METATAG" | grep -q "$EXPECTED_CODE"; then
        echo -e "${GREEN}✓ Código corresponde ao esperado${NC}"
        echo -e "${GREEN}Código encontrado: $EXPECTED_CODE${NC}"
    else
        echo -e "${RED}✗ Código NÃO corresponde ao esperado${NC}"
        echo "Código esperado: $EXPECTED_CODE"

        # Extrair o código encontrado
        FOUND_CODE=$(echo "$METATAG" | grep -oP '(?<=content=")[^"]*' | head -1)
        if [ -n "$FOUND_CODE" ]; then
            echo "Código encontrado: $FOUND_CODE"
        fi
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Verificação concluída com sucesso!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
