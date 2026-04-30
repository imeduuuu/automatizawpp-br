# Auto-Deploy Script — Setup Complete

Script shell robusto para deploy automático com detecção de plataforma, verificação de saúde e notificações.

## Arquivos Criados

```
/Users/eduardosilva/Antigravity/automatizawppBR/
├── auto-deploy.sh                      (20 KB) — Script principal
├── AUTO-DEPLOY-README.md               (11 KB) — Documentação completa
├── AUTO-DEPLOY-EXAMPLES.sh             (14 KB) — Exemplos interativos
├── AUTO-DEPLOY-QUICK-REFERENCE.txt     (6 KB)  — Referência rápida
├── test-auto-deploy.sh                 (2 KB)  — Suite de testes
└── DEPLOY-SETUP-SUMMARY.md             (este arquivo)
```

## Quick Start

### 1. Uso Básico (auto-detecta plataforma)

```bash
./auto-deploy.sh
```

### 2. Com Notificação por Email

```bash
./auto-deploy.sh --notify-email=seu.email@example.com
```

### 3. Plataforma Específica

```bash
./auto-deploy.sh --platform=vercel
./auto-deploy.sh --platform=firebase
./auto-deploy.sh --platform=github-pages
./auto-deploy.sh --platform=docker
```

## Plataformas Suportadas

| Plataforma | Descrição | Melhor Para |
|-----------|-----------|-----------|
| **Vercel** | Serverless, jamstack | Next.js, SPA, sites estáticos |
| **Firebase** | Serverless backend | Funções, realtime, auth |
| **GitHub Pages** | Git-based hosting | Sites estáticos, docs |
| **DigitalOcean** | VPS + App Platform | Full-stack, controle total |
| **Docker** | Container local/VPS | Qualquer app containerizada |

## Detecção Automática

O script detecta (por ordem de prioridade):

1. **Vercel** — `vercel.json` + CLI/token
2. **Firebase** — `.firebaserc` + CLI/token
3. **GitHub Pages** — Git repo com origin GitHub
4. **DigitalOcean** — `app.yaml` + doctl
5. **Docker** — `Dockerfile` + Docker installed

## Funcionalidades

### Build Automático
- Detecta `npm build` em package.json
- Instala dependências se necessário
- Continua mesmo sem build

### Deploy por Plataforma
- Integração nativa com cada serviço
- Suporte a múltiplas plataformas
- Fallbacks automáticos

### Health Check
- Testa endpoints: `/health`, `/api/health`, `/status`, `/ping`
- Retry automático (5 tentativas)
- Não falha se health check falhar (apenas aviso)

### Notificações
- **Email** — via comando `mail`
- **Slack** — via webhook
- **Webhook** — customizável (JSON)

### Logging
- Todos os passos registrados em `/tmp/auto-deploy-*.log`
- Timestamps completos
- Diferenciação de níveis (INFO, ERROR, WARNING)

### Tratamento de Erros
- Validação de arquivos/tokens necessários
- Fallbacks inteligentes
- Mensagens de erro claras
- Trap para interrupções (Ctrl+C)

## Exemplo: Deploy Vercel com Email

```bash
# 1. Obter token
vercel login
vercel tokens create

# 2. Exportar variável
export VERCEL_TOKEN=seu_token_aqui

# 3. Deploy com notificação
./auto-deploy.sh --notify-email=seu.email@example.com
```

Saída esperada:
```
✓ Plataforma detectada: vercel
✓ Build completado com sucesso
✓ Vercel deploy completado: https://app.vercel.app
✓ Health check passou
✓ Email enviado para seu.email@example.com

✅ DEPLOY COMPLETADO
```

## Exemplo: GitHub Pages

```bash
# 1. Build do projeto localmente
npm run build

# 2. Deploy para GitHub Pages
./auto-deploy.sh --platform=github-pages
```

Resultado:
```
✓ GitHub Pages deploy agendado
Site disponível em: https://seu-usuario.github.io/seu-repo
```

## Notificações

### Email

```bash
./auto-deploy.sh --notify-email=seu@example.com
```

Requer comando `mail` disponível (macOS/Linux).

### Slack

```bash
./auto-deploy.sh --notify-slack=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Cria webhook em: https://api.slack.com/messaging/webhooks

### Webhook Customizado

```bash
./auto-deploy.sh --notify-webhook=https://seu-servidor.com/deploy-webhook
```

Payload enviado:
```json
{
  "status": "SUCESSO",
  "platform": "vercel",
  "build_success": 1,
  "deploy_success": 1,
  "health_check_success": 1,
  "deploy_url": "https://app.vercel.app",
  "message": "Deploy completado e health check passou",
  "timestamp": "2024-06-30T12:34:56Z"
}
```

## Logs

Local:
```bash
cat /tmp/auto-deploy-*.log
```

Exemplo de log:
```
2024-06-30 12:34:56 [INFO] STEP: Detectando plataformas disponíveis
2024-06-30 12:34:56 [INFO] ✓ Vercel detectado
2024-06-30 12:34:57 [INFO] STEP: Construindo projeto
2024-06-30 12:35:12 [INFO] ✓ Build completado com sucesso
...
```

## CI/CD Integration

### GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Auto-Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm install -g vercel
      - run: chmod +x auto-deploy.sh && ./auto-deploy.sh
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

Adicionar secrets:
1. GitHub → Settings → Secrets and variables → Actions
2. Adicionar: `VERCEL_TOKEN`, `FIREBASE_TOKEN`, etc.

## Testes

Validar script:

```bash
bash test-auto-deploy.sh
```

Resultado esperado:
```
✓ All tests passed! (14/14)
```

## Exemplos Interativos

Ver opções de configuração:

```bash
bash AUTO-DEPLOY-EXAMPLES.sh
```

Inclui:
1. Vercel + email
2. GitHub Pages
3. Firebase + Slack
4. DigitalOcean
5. Docker
6. GitHub Actions CI/CD
7. Setup completo

## Documentação

### Quick Reference
```bash
cat AUTO-DEPLOY-QUICK-REFERENCE.txt
```

### Documentação Completa
```bash
cat AUTO-DEPLOY-README.md
```

Tópicos cobertos:
- Instalação detalhada
- Plataformas (configuração completa)
- Health checks
- Webhook payload
- Customizações
- Troubleshooting avançado

## Estrutura do Script

```bash
auto-deploy.sh
├── Configuração & defaults
├── Utility functions (log, colors)
├── Platform detection
├── Build functions (npm build)
├── Deploy functions (vercel, firebase, etc)
├── Health check function
├── Notification functions (email, slack, webhook)
└── Main execution flow
```

## Performance

| Etapa | Tempo |
|-------|-------|
| Build | 30s - 2min |
| Deploy Vercel | 10-30s |
| Deploy Firebase | 1-3min |
| Deploy Docker | 2-5min |
| Health Check | 5-50s |
| **Total típico** | **1-5 minutos** |

## Segurança

✓ Tokens em variáveis de ambiente (nunca em .env)  
✓ Tokens não aparecem em logs  
✓ Use secrets em CI/CD (GitHub Actions)  
✓ Webhooks com HTTPS  
✓ Limite acesso aos logs  

## Troubleshooting

### "Nenhuma plataforma detectada"
Verifique:
- `vercel.json`, `.firebaserc`, `Dockerfile` existem?
- CLIs instaladas? (`vercel`, `firebase`, `docker`)
- Tokens em variáveis de ambiente?

### "Build falhou"
```bash
npm run build --verbose  # debug localmente
cat /tmp/auto-deploy-*.log  # ver log completo
```

### "Deploy falhou"
```bash
vercel deploy --prod --debug  # debug plataforma manualmente
cat /tmp/auto-deploy-*.log    # log completo
```

### "Health check falhou"
- Implementar endpoint `/health`, `/api/health`, `/status` ou `/ping`
- Ou ignorar se não necessário (deploy continua)

## Next Steps

1. **Ler documentação completa**
   ```bash
   cat AUTO-DEPLOY-README.md
   ```

2. **Ver exemplos interativos**
   ```bash
   bash AUTO-DEPLOY-EXAMPLES.sh
   ```

3. **Testar script**
   ```bash
   bash test-auto-deploy.sh
   ```

4. **Deploy de verdade**
   ```bash
   ./auto-deploy.sh --notify-email=seu@email.com
   ```

## Customização

Para adicionar uma nova plataforma:

1. Criar função `deploy_novaplatforma()` em auto-deploy.sh
2. Adicionar detecção em `detect_platforms()`
3. Adicionar case em main()

Exemplo:
```bash
deploy_novaplatforma() {
  log_step "Deployando para NovaPlataforma"
  # ... lógica aqui
}
```

## Support

Para dúvidas ou issues:

1. Verifique o log: `cat /tmp/auto-deploy-*.log`
2. Teste plataforma manualmente
3. Verifique credenciais/tokens
4. Consulte AUTO-DEPLOY-README.md

---

**Versão**: 1.0  
**Data**: 2024-06-30  
**Status**: Ready to use ✓

Bom deploy!
