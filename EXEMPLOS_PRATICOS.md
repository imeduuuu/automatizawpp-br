# Exemplos Práticos - Verificação de Meta Tag Google

## 1. Teste Rápido em Linha de Comando

```bash
# Forma ultra-rápida (só curl + grep)
curl -s https://seu-site.com.br | grep -i google-site-verification

# Com extração do código
curl -s https://seu-site.com.br | grep -oP '(?<=content=")[^"]*'

# Com contagem (saber quantas existem)
curl -s https://seu-site.com.br | grep -ic google-site-verification
```

---

## 2. Usar o Script Shell Simples

```bash
# Verificação básica
./verify-google-meta-tag-simple.sh https://seu-site.com.br

# Com validação de código
./verify-google-meta-tag-simple.sh https://seu-site.com.br "abc123xyz456"
```

**Output esperado:**
```
Verificando: https://seu-site.com.br

=== Verificação simples (curl + grep) ===
<meta name="google-site-verification" content="abc123xyz456..." />
✓ Meta tag encontrada!
```

---

## 3. Usar o Script Shell Completo

```bash
# Script com muitos detalhes
./verify-google-meta-tag.sh https://seu-site.com.br seu-codigo-aqui
```

**Output esperado:**
```
========================================
Verificador de Meta Tag Google
========================================
Data/Hora: 30/04/2026 10:30:45
URL: https://seu-site.com.br
Código esperado: seu-codigo-aqui

1. Fazendo requisição para o site...
✓ Requisição bem-sucedida (HTTP 200)

2. Procurando pela meta tag google-site-verification...
✓ Meta tag encontrada!

3. Detalhes da meta tag encontrada:
<meta name="google-site-verification" content="abc123xyz456..." />

4. Validando código...
✓ Código corresponde ao esperado
Código encontrado: seu-codigo-aqui

========================================
✓ Verificação concluída com sucesso!
========================================
```

---

## 4. Usar o Script Node.js

```bash
# Verificação com Node
node verify-google-meta-tag.js https://seu-site.com.br

# Com validação
node verify-google-meta-tag.js https://seu-site.com.br "abc123"
```

---

## 5. Usar o Script TypeScript

```bash
# Requer ts-node instalado
npx ts-node verify-google-meta-tag.ts https://seu-site.com.br

# Com validação
npx ts-node verify-google-meta-tag.ts https://seu-site.com.br "seu-codigo"
```

---

## 6. Integração em Arquivo de Deploy

**deploy.sh:**
```bash
#!/bin/bash

set -e

echo "Iniciando deploy..."

# Build
npm run build
npm run export

# Upload
rsync -avz ./out/ user@servidor:/var/www/site/

# Verificar
echo "Verificando Google Meta Tag..."
./verify-google-meta-tag.sh https://seu-site-producao.com.br "seu-codigo" || {
    echo "✗ ERRO: Meta tag não encontrada!"
    exit 1
}

echo "✓ Deploy concluído com sucesso!"
```

**Usar:**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 7. Integração em package.json

```json
{
  "name": "seu-projeto",
  "scripts": {
    "build": "next build",
    "export": "next export",
    "deploy": "npm run build && npm run export && ./scripts/deploy.sh",
    "verify:google": "node verify-google-meta-tag.js https://seu-site.com.br seu-codigo",
    "verify:google:prod": "node verify-google-meta-tag.js https://seu-site-prod.com.br seu-codigo",
    "check-google": "curl -s https://seu-site.com.br | grep -i google-site-verification"
  }
}
```

**Usar:**
```bash
npm run verify:google
npm run verify:google:prod
npm run check-google
```

---

## 8. Integração em GitHub Actions

**File: `.github/workflows/verify-google.yml`**

```yaml
name: Verify Google Meta Tag

on:
  push:
    branches: [main]
  schedule:
    # Rodar diariamente às 9h
    - cron: '0 9 * * *'

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Verify Google Meta Tag
        run: node verify-google-meta-tag.js https://seu-site.com.br ${{ secrets.GOOGLE_VERIFICATION_CODE }}
```

---

## 9. Monitoramento Contínuo

**monitor-google-tag.sh:**
```bash
#!/bin/bash

URL="https://seu-site.com.br"
INTERVAL=3600  # 1 hora
EXPECTED_CODE="seu-codigo"

while true; do
    echo "=== Verificação em $(date) ==="
    
    if ./verify-google-meta-tag.sh "$URL" "$EXPECTED_CODE" > /tmp/google-check.log 2>&1; then
        echo "✓ Meta tag OK"
    else
        echo "✗ ERRO - Enviando alerta..."
        # Enviar email ou notificação
        cat /tmp/google-check.log | mail -s "ALERTA: Meta tag Google não encontrada" seu@email.com
    fi
    
    sleep $INTERVAL
done
```

**Usar em background:**
```bash
nohup ./monitor-google-tag.sh > /var/log/google-monitor.log 2>&1 &
```

---

## 10. Integração com n8n

**Webhook Flow:**
1. HTTP Request Node → Fetch https://seu-site.com.br
2. Code Node → Extract meta tag
3. IF Node → Check if found
4. Send Email Node (success/failure)

---

## 11. Múltiplos Sites

**verify-all-sites.sh:**
```bash
#!/bin/bash

SITES=(
    "https://site1.com.br|codigo1"
    "https://site2.com.br|codigo2"
    "https://site3.com.br|codigo3"
)

for SITE in "${SITES[@]}"; do
    URL=$(echo $SITE | cut -d'|' -f1)
    CODE=$(echo $SITE | cut -d'|' -f2)
    
    echo "Verificando $URL..."
    ./verify-google-meta-tag.sh "$URL" "$CODE"
    echo ""
done
```

---

## 12. Teste Antes de Deploy

**pre-deploy-check.sh:**
```bash
#!/bin/bash

echo "=== Pré-Deploy Checks ==="

# 1. Verificar se _document.tsx tem a meta tag
echo "1. Verificando arquivo local..."
if grep -q "google-site-verification" src/pages/_document.tsx 2>/dev/null; then
    echo "✓ Meta tag encontrada em _document.tsx"
else
    echo "✗ ERRO: Meta tag não está em _document.tsx"
    exit 1
fi

# 2. Fazer build e verificar
echo "2. Fazendo build..."
npm run build || exit 1

# 3. Verificar na build
echo "3. Verificando na build..."
if grep -q "google-site-verification" out/index.html 2>/dev/null; then
    echo "✓ Meta tag presente na build"
else
    echo "✗ ERRO: Meta tag não está na build"
    exit 1
fi

echo ""
echo "✓ Todos os pré-checks passaram!"
echo "Seguro para fazer deploy"
```

---

## 13. Cronjob para Monitoramento Diário

```bash
# Adicionar ao crontab (crontab -e)

# Verificar a cada 6 horas
0 */6 * * * /home/usuario/verify-google-meta-tag.sh https://seu-site.com.br seu-codigo >> /var/log/google-verify.log 2>&1

# Verificar diariamente à meia-noite
0 0 * * * node /home/usuario/verify-google-meta-tag.js https://seu-site.com.br >> /var/log/google-verify.log 2>&1
```

---

## 14. Integração com Docker

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY verify-google-meta-tag.js .
COPY . .

RUN npm install

CMD ["node", "verify-google-meta-tag.js", "https://seu-site.com.br"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  google-verify:
    build: .
    environment:
      - URL=https://seu-site.com.br
      - CODE=seu-codigo
    schedule: "0 9 * * *"
```

---

## 15. Slack Notification

**verify-with-slack.sh:**
```bash
#!/bin/bash

URL="$1"
SLACK_WEBHOOK="${{ secrets.SLACK_WEBHOOK }}"

if ./verify-google-meta-tag.sh "$URL" > /tmp/check.log 2>&1; then
    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d '{"text":"✓ Google Meta Tag OK para '"$URL"'"}'
else
    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d '{"text":"✗ ERRO: Google Meta Tag não encontrada em '"$URL"'","attachments":[{"text":"'$(cat /tmp/check.log)'"}]}'
fi
```

---

## Resumo de Comandos

```bash
# Mais rápido
curl -s https://seu-site.com.br | grep -i google-site-verification

# Simples
./verify-google-meta-tag-simple.sh https://seu-site.com.br

# Completo
./verify-google-meta-tag.sh https://seu-site.com.br seu-codigo

# Node
node verify-google-meta-tag.js https://seu-site.com.br

# TypeScript
npx ts-node verify-google-meta-tag.ts https://seu-site.com.br

# Monitorar
watch -n 10 'curl -s https://seu-site.com.br | grep -i google'
```

---

**Última atualização:** 30/04/2026
