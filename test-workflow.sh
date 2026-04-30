#!/bin/bash

# Teste automatizado do workflow GitHub → Deploy → Verify Meta Tag → Notify
# Usage: ./test-workflow.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}  GitHub Deploy Workflow - Teste Completo${NC}"
echo -e "${BLUE}===================================================${NC}\n"

# ==================== CONFIG ====================
read -p "n8n URL (ex: https://n8n.seu-site.com): " N8N_URL
read -p "n8n API Key: " N8N_API_KEY
read -p "Webhook path (ex: github-deploy): " WEBHOOK_PATH
read -p "Site URL (ex: https://seu-site.com.br): " SITE_URL
read -p "GitHub repo (ex: usuario/repo): " GITHUB_REPO

WEBHOOK_URL="${N8N_URL}/webhook/${WEBHOOK_PATH}"

echo -e "\n${YELLOW}Configurações:${NC}"
echo "  n8n URL: $N8N_URL"
echo "  Webhook: $WEBHOOK_URL"
echo "  Site: $SITE_URL"
echo "  Repo: $GITHUB_REPO"

# ==================== TESTE 1: WEBHOOK ACESSÍVEL ====================
echo -e "\n${BLUE}[Teste 1] Verificando se webhook é acessível...${NC}"

RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$WEBHOOK_URL")

if [ "$RESPONSE_CODE" == "200" ] || [ "$RESPONSE_CODE" == "404" ]; then
  echo -e "${GREEN}✓ Webhook acessível (Status: $RESPONSE_CODE)${NC}"
else
  echo -e "${RED}✗ Webhook não acessível (Status: $RESPONSE_CODE)${NC}"
  exit 1
fi

# ==================== TESTE 2: SITE ACESSÍVEL ====================
echo -e "\n${BLUE}[Teste 2] Verificando se site é acessível...${NC}"

SITE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")

if [ "$SITE_RESPONSE" == "200" ]; then
  echo -e "${GREEN}✓ Site acessível (Status: $SITE_RESPONSE)${NC}"
else
  echo -e "${YELLOW}⚠ Site retornou Status: $SITE_RESPONSE${NC}"
fi

# ==================== TESTE 3: META TAG EXISTE ====================
echo -e "\n${BLUE}[Teste 3] Verificando se meta tag existe no site...${NC}"

HTML=$(curl -s "$SITE_URL")

if echo "$HTML" | grep -q "google-site-verification"; then
  echo -e "${GREEN}✓ Meta tag google-site-verification encontrada${NC}"
  META_TAG=$(echo "$HTML" | grep -o '<meta[^>]*google-site-verification[^>]*>' | head -1)
  echo "  $META_TAG"
else
  echo -e "${RED}✗ Meta tag NÃO encontrada no site${NC}"
  echo "  Adicione em _document.tsx: <meta name=\"google-site-verification\" content=\"seu-codigo\" />"
  exit 1
fi

# ==================== TESTE 4: WEBHOOK SIMPLES ====================
echo -e "\n${BLUE}[Teste 4] Enviando webhook simples...${NC}"

WEBHOOK_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "ref": "refs/heads/main",
    "after": "abc1234567890def",
    "repository": {
      "full_name": "'$GITHUB_REPO'",
      "owner": {
        "avatar_url": "https://avatars.githubusercontent.com/u/123?v=4"
      }
    },
    "pusher": {
      "name": "Test User"
    }
  }')

if echo "$WEBHOOK_RESPONSE" | grep -qi "error"; then
  echo -e "${RED}✗ Webhook retornou erro:${NC}"
  echo "  $WEBHOOK_RESPONSE"
else
  echo -e "${GREEN}✓ Webhook enviado com sucesso${NC}"
  echo "  Response: $WEBHOOK_RESPONSE"
fi

# ==================== TESTE 5: LISTAR WORKFLOWS ====================
echo -e "\n${BLUE}[Teste 5] Verificando workflows no n8n...${NC}"

WORKFLOWS=$(curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_URL/api/v1/workflows" | grep -o '"name":"[^"]*"' | head -5)

if [ -z "$WORKFLOWS" ]; then
  echo -e "${YELLOW}⚠ Nenhum workflow encontrado (verifique API Key)${NC}"
else
  echo -e "${GREEN}✓ Workflows encontrados:${NC}"
  echo "$WORKFLOWS"
fi

# ==================== TESTE 6: VERIFICAR EXECUÇÕES ====================
echo -e "\n${BLUE}[Teste 6] Últimas execuções de workflow...${NC}"

EXECUTIONS=$(curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_URL/api/v1/executions?limit=5&status=all" 2>/dev/null | grep -o '"status":"[^"]*"' | head -3)

if [ -z "$EXECUTIONS" ]; then
  echo -e "${YELLOW}⚠ Nenhuma execução registrada${NC}"
else
  echo -e "${GREEN}✓ Execuções recentes:${NC}"
  echo "$EXECUTIONS"
fi

# ==================== TESTE 7: PERFORMANCE ====================
echo -e "\n${BLUE}[Teste 7] Medindo performance do site...${NC}"

START_TIME=$(date +%s%N)
curl -s "$SITE_URL" > /dev/null
END_TIME=$(date +%s%N)

TIME_MS=$(( (END_TIME - START_TIME) / 1000000 ))

if [ "$TIME_MS" -lt 1000 ]; then
  echo -e "${GREEN}✓ Site rápido: ${TIME_MS}ms${NC}"
elif [ "$TIME_MS" -lt 3000 ]; then
  echo -e "${YELLOW}⚠ Site moderado: ${TIME_MS}ms${NC}"
else
  echo -e "${RED}⚠ Site lento: ${TIME_MS}ms${NC}"
fi

# ==================== RESUMO ====================
echo -e "\n${BLUE}===================================================${NC}"
echo -e "${GREEN}Testes Completos!${NC}"
echo -e "${BLUE}===================================================${NC}\n"

echo -e "Próximos passos:"
echo -e "  1. ${YELLOW}Faça um push real no GitHub${NC}"
echo -e "     git add . && git commit -m 'Test' && git push origin main"
echo -e ""
echo -e "  2. ${YELLOW}Verifique as execuções${NC}"
echo -e "     $N8N_URL/workflow/[id]/executions"
echo -e ""
echo -e "  3. ${YELLOW}Verifique Slack e Email${NC}"
echo -e "     Procure por notificações de deploy"
echo -e ""

echo -e "${GREEN}✓ Setup completo e testado!${NC}\n"

