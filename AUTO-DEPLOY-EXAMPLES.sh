#!/bin/bash

##############################################################################
# Auto-Deploy Script — Exemplos de Uso Prático
# Execute qualquer exemplo com: bash AUTO-DEPLOY-EXAMPLES.sh
##############################################################################

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Auto-Deploy Script — Exemplos de Uso Prático          ║"
echo "╚════════════════════════════════════════════════════════════╝"

echo ""
echo "Exemplos disponíveis:"
echo ""
echo "1. Deploy Vercel com notificação email"
echo "2. Deploy GitHub Pages"
echo "3. Deploy Firebase com Slack"
echo "4. Deploy DigitalOcean"
echo "5. Deploy Docker local"
echo "6. Deploy com CI/CD (GitHub Actions)"
echo "7. Setup completo (cria todos os configs)"
echo ""
read -p "Escolha um exemplo (1-7): " choice

case $choice in
  1)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║ Exemplo 1: Deploy Vercel com Notificação Email           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Este exemplo mostra como fazer deploy no Vercel e receber"
    echo "notificação por email ao final."
    echo ""
    echo "SETUP:"
    echo "======="
    echo "1. Obter token Vercel:"
    echo "   vercel login"
    echo "   vercel tokens create"
    echo ""
    echo "2. Exportar token:"
    echo "   export VERCEL_TOKEN=seu_token_aqui"
    echo ""
    echo "3. Executar deploy:"
    echo "   ./auto-deploy.sh --notify-email=seu.email@example.com"
    echo ""
    echo "AUTOMÁTICO EM CI/CD:"
    echo "===================="
    echo "Adicione ao .github/workflows/deploy.yml:"
    echo ""
    cat << 'YAML'
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm install -g vercel
      - run: ./auto-deploy.sh --notify-email=${{ secrets.DEPLOY_EMAIL }}
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
YAML
    ;;

  2)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║ Exemplo 2: Deploy GitHub Pages                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Para sites estáticos construídos com Webpack, Vite, etc."
    echo ""
    echo "SETUP:"
    echo "======="
    echo "1. Verifique estrutura do projeto:"
    echo "   ls -la"
    echo "   - Deve ter: package.json, Dockerfile ou vercel.json"
    echo "   - Deve ter build dir: dist/, build/ ou out/"
    echo ""
    echo "2. Configure package.json (build script):"
    cat << 'JSON'
{
  "scripts": {
    "build": "webpack --mode production",
    "build:vite": "vite build",
    "build:next": "next build"
  }
}
JSON
    echo ""
    echo "3. Executar deploy:"
    echo "   ./auto-deploy.sh --platform=github-pages"
    echo ""
    echo "RESULTADO:"
    echo "==========="
    echo "Site disponível em:"
    echo "   https://seu-usuario.github.io/seu-repositorio"
    echo ""
    ;;

  3)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║ Exemplo 3: Deploy Firebase com Slack                     ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "SETUP:"
    echo "======="
    echo "1. Criar projeto Firebase:"
    echo "   firebase login"
    echo "   firebase init"
    echo ""
    echo "2. Gerar token:"
    echo "   firebase login:ci"
    echo ""
    echo "3. Criar webhook Slack:"
    echo "   https://api.slack.com/messaging/webhooks"
    echo "   Copie a URL do webhook"
    echo ""
    echo "4. Executar deploy:"
    echo "   export FIREBASE_TOKEN=seu_token"
    echo "   ./auto-deploy.sh --notify-slack=https://hooks.slack.com/services/..."
    echo ""
    echo "ESTRUTURA FIREBASERC:"
    echo "====================="
    cat << 'JSON'
{
  "projects": {
    "default": "seu-projeto-firebase"
  },
  "targets": {
    "seu-projeto-firebase": {
      "hosting:app": ["seu-projeto-firebase"]
    }
  }
}
JSON
    ;;

  4)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║ Exemplo 4: Deploy DigitalOcean App Platform              ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "SETUP:"
    echo "======="
    echo "1. Instalar doctl:"
    echo "   brew install doctl  # macOS"
    echo "   apt install doctl   # Linux"
    echo ""
    echo "2. Criar API token no painel DigitalOcean:"
    echo "   https://cloud.digitalocean.com/account/api/tokens"
    echo ""
    echo "3. Exportar token:"
    echo "   export DIGITALOCEAN_ACCESS_TOKEN=seu_token"
    echo ""
    echo "4. Criar app.yaml na raiz do projeto:"
    cat << 'YAML'
name: meu-app
services:
  - name: api
    github:
      repo: seu-usuario/seu-repo
      branch: main
    build_command: npm run build
    run_command: npm start
    http_port: 3000
    source_dir: ./
YAML
    echo ""
    echo "5. Executar deploy:"
    echo "   ./auto-deploy.sh --platform=digitalocean"
    echo ""
    ;;

  5)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║ Exemplo 5: Deploy Docker Local                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "SETUP:"
    echo "======="
    echo "1. Instalar Docker:"
    echo "   https://www.docker.com/products/docker-desktop"
    echo ""
    echo "2. Criar Dockerfile:"
    cat << 'DOCKERFILE'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
DOCKERFILE
    echo ""
    echo "3. Criar docker-compose.prod.yml:"
    cat << 'YAML'
version: '3.9'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    restart: always
YAML
    echo ""
    echo "4. Executar deploy:"
    echo "   docker-compose up -d"
    echo "   # ou"
    echo "   ./auto-deploy.sh --platform=docker"
    echo ""
    echo "5. Verificar:"
    echo "   curl http://localhost:3000"
    echo ""
    ;;

  6)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║ Exemplo 6: Setup CI/CD (GitHub Actions)                  ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "SETUP:"
    echo "======="
    echo "1. Criar arquivo .github/workflows/deploy.yml"
    echo ""
    mkdir -p .github/workflows
    cat > .github/workflows/deploy.yml << 'WORKFLOW'
name: Auto-Deploy
on:
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install global deps
        run: |
          npm install -g vercel firebase-tools

      - name: Run auto-deploy
        run: chmod +x auto-deploy.sh && ./auto-deploy.sh
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          DIGITALOCEAN_ACCESS_TOKEN: ${{ secrets.DO_TOKEN }}
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}

      - name: Upload logs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: deploy-logs
          path: /tmp/auto-deploy-*.log
WORKFLOW

    echo "2. Adicionar secrets no GitHub:"
    echo "   Settings → Secrets and variables → Actions"
    echo ""
    echo "   Secrets necessários:"
    echo "   - VERCEL_TOKEN"
    echo "   - FIREBASE_TOKEN"
    echo "   - DO_TOKEN (DigitalOcean)"
    echo "   - SLACK_WEBHOOK"
    echo ""
    echo "3. Fazer push para main:"
    echo "   git add .github/workflows/deploy.yml auto-deploy.sh"
    echo "   git commit -m 'Setup auto-deploy CI/CD'"
    echo "   git push"
    echo ""
    echo "4. Verificar execução:"
    echo "   GitHub → Actions → Auto-Deploy"
    echo ""
    ;;

  7)
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║ Exemplo 7: Setup Completo (Todos os Configs)             ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Este exemplo cria uma estrutura completa pronta para deploy."
    echo ""
    
    read -p "Confirmar criação de files? (s/n): " confirm
    if [[ ! $confirm =~ ^[Ss]$ ]]; then
      echo "Cancelado."
      exit 0
    fi

    echo ""
    echo "Criando estrutura..."
    
    # Vercel
    if [ ! -f "vercel.json" ]; then
      cat > vercel.json << 'JSON'
{
  "name": "automatizawpp",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NODE_ENV": "production"
  }
}
JSON
      echo "✓ vercel.json criado"
    fi

    # Dockerfile
    if [ ! -f "Dockerfile" ]; then
      cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build || true
EXPOSE 3000
CMD ["npm", "start"]
DOCKERFILE
      echo "✓ Dockerfile criado"
    fi

    # docker-compose
    if [ ! -f "docker-compose.prod.yml" ]; then
      cat > docker-compose.prod.yml << 'YAML'
version: '3.9'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
YAML
      echo "✓ docker-compose.prod.yml criado"
    fi

    # .env.example
    if [ ! -f ".env.example" ]; then
      cat > .env.example << 'ENV'
# App
NODE_ENV=production
PORT=3000

# APIs
ANTHROPIC_API_KEY=
BIRD_WORKSPACE_ID=
BREVO_API_KEY=

# SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Database
DATABASE_URL=
REDIS_URL=
ENV
      echo "✓ .env.example criado"
    fi

    # GitHub Actions
    mkdir -p .github/workflows
    if [ ! -f ".github/workflows/deploy.yml" ]; then
      cat > .github/workflows/deploy.yml << 'WORKFLOW'
name: Auto-Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18', cache: npm }
      - run: npm install -g vercel
      - run: chmod +x auto-deploy.sh && ./auto-deploy.sh
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          DIGITALOCEAN_ACCESS_TOKEN: ${{ secrets.DO_TOKEN }}
WORKFLOW
      echo "✓ .github/workflows/deploy.yml criado"
    fi

    # README deploy instructions
    if [ ! -f "DEPLOY.md" ]; then
      cat > DEPLOY.md << 'MARKDOWN'
# Deploy Instructions

## Quick Start

```bash
./auto-deploy.sh
```

Script auto-detecta plataforma e faz deploy.

## Platforms Supported

- Vercel (default)
- GitHub Pages
- Firebase
- DigitalOcean
- Docker

## Environment Setup

Copy `.env.example` to `.env.production`:

```bash
cp .env.example .env.production
```

Configure your API keys and deploy.

## Manual Deploy

### Vercel
```bash
export VERCEL_TOKEN=...
./auto-deploy.sh --platform=vercel
```

### Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Full log
```bash
tail -f /tmp/auto-deploy-*.log
```
MARKDOWN
      echo "✓ DEPLOY.md criado"
    fi

    # Gitignore
    if [ ! -f ".gitignore" ]; then
      cat > .gitignore << 'GITIGNORE'
node_modules/
.env
.env.production
.env.local
dist/
build/
.next/
out/
*.log
/tmp/
.DS_Store
GITIGNORE
      echo "✓ .gitignore criado"
    fi

    echo ""
    echo "✓ Setup completo!"
    echo ""
    echo "Próximos passos:"
    echo "1. Configure as variáveis em .env.production"
    echo "2. Teste localmente: npm run build && npm start"
    echo "3. Execute deploy: ./auto-deploy.sh"
    echo "4. Configure CI/CD no GitHub com seus secrets"
    echo ""
    ;;

  *)
    echo "Opção inválida"
    exit 1
    ;;
esac

echo ""
echo "Para mais informações, veja AUTO-DEPLOY-README.md"
echo ""
