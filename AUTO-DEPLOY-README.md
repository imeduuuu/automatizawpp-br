# Auto-Deploy Script — Multi-Platform Deployment Automation

Script shell robusto que detecta automaticamente a plataforma de deploy disponível, executa o build, faz deploy e verifica o sucesso. Com tratamento de erros, fallbacks e notificações automáticas.

## Características

- **Detecção automática de plataforma**: Vercel, GitHub Pages, Firebase, DigitalOcean, Docker
- **Build automático**: Executa npm build se existir
- **Deploy por plataforma**: Integração nativa com cada serviço
- **Health check**: Verifica se a aplicação está respondendo após deploy
- **Notificações**: Email, Slack ou webhook customizado
- **Logging completo**: Todos os passos são registrados em arquivo
- **Tratamento de erros**: Fallbacks e retry automático
- **Priorização de plataforma**: Escolhe a melhor opção se múltiplas estão disponíveis

## Instalação

O script está em:
```bash
/Users/eduardosilva/Antigravity/automatizawppBR/auto-deploy.sh
```

Já é executável. Copie para qualquer projeto:

```bash
cp /Users/eduardosilva/Antigravity/automatizawppBR/auto-deploy.sh /seu/projeto/
```

## Uso Básico

### Execução simples (auto-detecta plataforma)

```bash
./auto-deploy.sh
```

### Com platform override

```bash
./auto-deploy.sh --platform=vercel
./auto-deploy.sh --platform=github-pages
./auto-deploy.sh --platform=firebase
./auto-deploy.sh --platform=digitalocean
./auto-deploy.sh --platform=docker
```

### Com notificações por email

```bash
./auto-deploy.sh --notify-email=seu.email@example.com
```

### Com notificações Slack

```bash
./auto-deploy.sh --notify-slack=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Com webhook customizado

```bash
./auto-deploy.sh --notify-webhook=https://seu-servidor.com/deploy-webhook
```

## Plataformas Suportadas

### 1. Vercel

**Pré-requisitos**:
- Arquivo `vercel.json` na raiz do projeto
- `vercel` CLI instalado (via `npm install -g vercel`)
- OU `$VERCEL_TOKEN` definido

**Como funciona**:
```bash
vercel deploy --prod
```

**Exemplo vercel.json**:
```json
{
  "name": "meu-app",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### 2. GitHub Pages

**Pré-requisitos**:
- Repositório git com remote `origin` apontando para GitHub
- Diretório de build: `dist/`, `build/` ou `out/`

**Como funciona**:
```bash
git subtree push --prefix dist origin gh-pages
```

**Exemplo script build**:
```json
{
  "scripts": {
    "build": "webpack --mode production"
  }
}
```

### 3. Firebase

**Pré-requisitos**:
- Arquivo `.firebaserc` na raiz
- `firebase` CLI instalado
- OU `$FIREBASE_TOKEN` definido

**Como funciona**:
```bash
firebase deploy --force
```

**Exemplo .firebaserc**:
```json
{
  "projects": {
    "default": "meu-projeto-firebase"
  }
}
```

### 4. DigitalOcean App Platform

**Pré-requisitos**:
- Arquivo `app.yaml` na raiz (especificação do app)
- `doctl` CLI instalado
- `$DIGITALOCEAN_ACCESS_TOKEN` definido

**Como funciona**:
```bash
doctl apps update --spec app.yaml
```

**Exemplo app.yaml**:
```yaml
name: meu-app
services:
  - name: api
    github:
      repo: seu-usuario/seu-repo
      branch: main
```

### 5. Docker

**Pré-requisitos**:
- Arquivo `Dockerfile` na raiz
- Docker instalado e rodando
- Opcionalmente: `docker-compose.yml` ou `docker-compose.prod.yml`

**Como funciona**:
```bash
docker build -t app:latest .
docker-compose -f docker-compose.prod.yml up -d
```

## Detecção de Plataforma (Ordem de Prioridade)

O script detecta automaticamente quais plataformas estão disponíveis e escolhe a melhor:

1. **Vercel** (mais rápido para Deploy)
2. **Firebase** (melhor para serverless)
3. **GitHub Pages** (ótimo para sites estáticos)
4. **DigitalOcean** (para mais controle)
5. **Docker** (fallback universal)

Se múltiplas estão disponíveis, escolhe a primeira da lista. Você pode forçar com `--platform=X`.

## Tratamento de Erros e Fallbacks

### Build falha
- Se `npm build` não existir, pula essa etapa
- Continua com deploy mesmo sem build prévio

### Deploy falha por plataforma indisponível
- Tenta próxima plataforma automaticamente
- Se nenhuma funciona, falha com mensagem clara

### Health check falha
- Tenta 5 vezes com aguardo de 10s entre tentativas
- Testa múltiplos endpoints: `/health`, `/api/health`, `/status`, `/ping`
- Não cancela o deploy se health check falhar (apenas registra aviso)

### Notificação falha
- Se email não funcionar, tenta continuar
- Sempre salva log completo em arquivo

## Logging

Todos os passos são registrados em:
```
/tmp/auto-deploy-<timestamp>.log
```

O path é exibido ao final da execução. Exemplo:
```bash
Log completo: /tmp/auto-deploy-1719734521.log
```

Abra o arquivo para ver todos os detalhes:
```bash
cat /tmp/auto-deploy-1719734521.log
```

## Variáveis de Ambiente Necessárias

Dependem da plataforma escolhida:

```bash
# Vercel
export VERCEL_TOKEN=token_aqui

# Firebase
export FIREBASE_TOKEN=token_aqui

# DigitalOcean
export DIGITALOCEAN_ACCESS_TOKEN=token_aqui

# GitHub (automático se usar git)
# Só precisa de acesso ao repo via git clone/push
```

## Exemplos de Uso Completo

### Projeto Next.js no Vercel (com notificação)

```bash
export VERCEL_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
./auto-deploy.sh --notify-email=seu.email@example.com
```

### Projeto estático no GitHub Pages

```bash
./auto-deploy.sh --platform=github-pages
```

### Projeto Firebase com Slack

```bash
export FIREBASE_TOKEN=...
./auto-deploy.sh --notify-slack=https://hooks.slack.com/services/...
```

### Projeto Docker com webhook

```bash
docker run -d docker:dind
./auto-deploy.sh --platform=docker --notify-webhook=https://seu-servidor.com/webhook
```

## Integração com CI/CD

### GitHub Actions

Adicione ao `.github/workflows/deploy.yml`:

```yaml
name: Auto-Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Deploy
        run: ./auto-deploy.sh --notify-slack=${{ secrets.SLACK_WEBHOOK }}
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### GitLab CI

Adicione ao `.gitlab-ci.yml`:

```yaml
deploy:
  stage: deploy
  script:
    - chmod +x auto-deploy.sh
    - ./auto-deploy.sh --notify-slack=$SLACK_WEBHOOK
  only:
    - main
  variables:
    VERCEL_TOKEN: $VERCEL_TOKEN
```

## Webhook Payload

Se usar `--notify-webhook`, o payload enviado é:

```json
{
  "status": "SUCESSO",
  "platform": "vercel",
  "build_success": 1,
  "deploy_success": 1,
  "health_check_success": 1,
  "deploy_url": "https://app.vercel.app",
  "message": "Deploy completado e health check passou",
  "timestamp": "2024-06-30T12:34:56Z",
  "log_file": "/tmp/auto-deploy-1719734521.log"
}
```

## Estrutura de Saída

```
╔════════════════════════════════════════════════════════════╗
║       🚀 Auto-Deploy Script — Multi-Platform Deploy        ║
╚════════════════════════════════════════════════════════════╝

→ Detectando plataformas disponíveis
✓ Vercel detectado

→ Plataforma selecionada: vercel

→ Construindo projeto
→ Instalando dependências
→ Executando npm build
✓ Build completado com sucesso

→ Deployando para Vercel
✓ Vercel deploy completado: https://app.vercel.app

→ Verificando saúde do deploy
→ Testando https://app.vercel.app/api/health (tentativa 1/5)
✓ Health check passou: HTTP 200 em /api/health

✓ Enviando notificação por email para seu.email@example.com

╔════════════════════════════════════════════════════════════╗
║                   ✅ DEPLOY COMPLETADO                    ║
╚════════════════════════════════════════════════════════════╝

📊 Resumo:
  Plataforma: vercel
  Build: ✓ Sucesso
  Deploy: ✓ Sucesso
  Health Check: ✓ Passou
  URL: https://app.vercel.app

📋 Log completo: /tmp/auto-deploy-1719734521.log
```

## Troubleshooting

### "Nenhuma plataforma disponível detectada"

Verifique:
1. `vercel.json` existe?
2. `firebase` CLI instalado? (`which firebase`)
3. `.firebaserc` existe?
4. `DIGITALOCEAN_ACCESS_TOKEN` definido? (`echo $DIGITALOCEAN_ACCESS_TOKEN`)
5. `Dockerfile` existe?
6. Repo git configurado? (`git remote -v`)

### "Build falhou"

```bash
# Verifique o build localmente
npm run build

# Veja o log completo
cat /tmp/auto-deploy-*.log | grep ERROR
```

### "Deploy falhou"

Depende da plataforma:

```bash
# Vercel
vercel deploy --prod --debug

# Firebase
firebase deploy -D

# Docker
docker build -t app:test .
docker-compose -f docker-compose.prod.yml logs
```

### "Health check falhou"

Se a app está up mas health check falha:
1. Verifique os endpoints: `/health`, `/api/health`, `/status`, `/ping`
2. Ajuste o script para seu endpoint customizado
3. Ou implemente um health check endpoint:

```typescript
// pages/api/health.ts (Next.js exemplo)
export default function handler(req, res) {
  res.status(200).json({ status: 'ok' });
}
```

### Notificação não chegou

```bash
# Email
# Verifique se 'mail' comando está disponível
which mail

# Slack/Webhook
# Teste o webhook manualmente
curl -X POST -H 'Content-type: application/json' \
  --data '{"status":"test"}' \
  https://seu-webhook.url
```

## Performance

- **Build**: ~30s-2min (depende do projeto)
- **Vercel Deploy**: ~10-30s
- **GitHub Pages**: ~20-60s
- **Firebase**: ~1-3min
- **Docker**: ~2-5min
- **Health Check**: ~5-50s (com retries)

**Tempo total típico**: 1-5 minutos

## Segurança

- Nunca commite tokens em `.env` — use variáveis de ambiente
- Tokens são passados via env, nunca em logs
- Se compartilhar logs, remova linhas com tokens
- Use `--notify-webhook` apenas com URLs HTTPS

## Customização

Para adicionar uma nova plataforma, adicione uma função `deploy_novaplatforma()`:

```bash
deploy_novaplatforma() {
  log_step "Deployando para NovaPlataforma"
  
  if ! command -v nova-cli &> /dev/null; then
    log_error "nova-cli não instalado"
    return 1
  fi
  
  cd "$PROJECT_ROOT"
  
  if nova-cli deploy 2>&1 | tee -a "$LOG_FILE"; then
    DEPLOY_URL="https://seu-deploy.com"
    DEPLOY_SUCCESS=1
    log_success "Deploy completado: $DEPLOY_URL"
    return 0
  else
    log_error "Deploy falhou"
    return 1
  fi
}
```

E adicione a detecção em `detect_platforms()`:

```bash
if [ -f "$PROJECT_ROOT/.nova-config" ]; then
  platforms+=("novaplatforma")
fi
```

Depois na função `main()`:

```bash
case "$DETECTED_PLATFORM" in
  ...
  novaplatforma)
    deploy_novaplatforma || true
    ;;
esac
```

## Licença

Open source — use livremente!

## Support

Para issues ou dúvidas:
1. Verifique o log: `cat /tmp/auto-deploy-*.log`
2. Teste a plataforma manualmente
3. Verifique as credenciais/tokens

---

**Versão**: 1.0.0  
**Última atualização**: 2024-06-30  
**Autor**: Auto-Deploy Script Generator
