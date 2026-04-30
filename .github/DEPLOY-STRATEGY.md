# Deploy Persistente com Fallback Automático

## Arquitetura de Solução

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Push → main                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────▼──────────┐
                   │  1. VALIDATE       │
                   │  - Secrets check   │
                   │  - Docker build    │
                   │  - Push to GHCR    │
                   └─────────┬──────────┘
                             │
                   ┌─────────▼──────────┐
                   │  2. PREPARE        │
                   │  - Primary: nyc3   │
                   │  - Firewall setup  │
                   └──────┬────────────┬┘
                          │            │
                ┌─────────▼──┐    ┌───▼─────────┐
                │ 3. PRIMARY │    │ 4. FALLBACK │
                │ deploy     │    │ standby     │
                │ nyc3       │    │ lon1        │
                │ timeout:35m│    │ IF primary  │
                └──┬─────────┘    │ fails       │
                   │              │             │
            ✅ healthy?          └─────────────┘
              YES ▼ NO                │
                │ └──────────────────►│
                │                     │ (only if primary failed)
        ┌───────▼─────┐         ┌────▼──────────┐
        │ PRIMARY OK  │         │ 3B. FALLBACK   │
        │ Single-stack│         │ deploy         │
        │             │         │ lon1           │
        └─────────────┘         │ timeout:35m    │
                                │                │
                        ✅ healthy?
                          │
                    ┌─────▼──────┐
                    │ FALLBACK OK│
                    │ Dual-stack │
                    └────────────┘
                             │
                   ┌─────────▼──────────┐
                   │  5. REPORT         │
                   │  - Status summary  │
                   │  - Slack notify    │
                   │  - GitHub release  │
                   └────────────────────┘
```

---

## Características Principais

### 1. Totalmente Automático
- Disparado por **push a main** (CI/CD puro)
- Sem intervenção manual necessária
- Sem esperar por aprovações

### 2. Redundância com Fallback
- **Primary**: DigitalOcean nyc3 (USA - East Coast)
- **Fallback**: DigitalOcean lon1 (UK - Low latency para EU)
- Só ativa fallback se primary falhar
- Économiza custos (fallback é sob demanda)

### 3. Health Checks Automáticos
- Primary testa saúde: `/api/health`
- Fallback testa saúde: `/api/health`
- 10 tentativas, 10 segundos entre tentativas (100 segundos timeout)
- Falha explícita se não responder

### 4. Gestão de Infraestrutura
- Cria droplets automaticamente se não existem
- Reutiliza droplets existentes
- Configuração de firewall automática
- Scaling automático (redimensiona se necessário)

### 5. Notificações
- Slack webhook (status, IPs, modo)
- GitHub Release para cada deploy
- Relatório estruturado em cada execução

---

## Comparação com Alternativas

### Vercel
**Prós:**
- Integração nativa GitHub
- CDN global
- Preview deployments
- Serverless automático

**Contras:**
- Caro para aplicações stateful
- Base de dados não incluída
- Vendor lock-in
- Limited control sobre infraestrutura

**Nosso caso:** Não é ideal (Redis, PostgreSQL, estado compartilhado)

### Firebase / Google Cloud
**Prós:**
- Autoscaling nativo
- Monitoring integrado
- Backup automático

**Contras:**
- Mais caro que DigitalOcean
- Complexidade de configuração
- Curva de aprendizado

**Nosso caso:** Overkill para o volume atual

### GitHub Pages
**Prós:**
- Gratuito para projetos estáticos
- Integração GitHub perfeita

**Contras:**
- Não suporta Node.js server
- Sem banco de dados
- Sem API dinâmica

**Nosso caso:** Incompatível (Next.js com API)

### DigitalOcean (Nossa Escolha)
**Prós:**
- Preço justo ($10-30/mês)
- Controle total
- Docker nativo (docker-compose)
- Múltiplas regiões disponíveis
- SSH acesso direto
- Backups simples
- API robusta

**Contras:**
- Gerenciamento manual é possível
- Não tão automático quanto Vercel

---

## Como Funciona (Detalhado)

### STAGE 1: Validação & Build
```
1. Checkout do código
2. Valida 7 secrets obrigatórios
3. Gera tag de imagem: YYYYMMDD_HHMMSS_SHA7
4. Build Docker image
5. Push para GitHub Container Registry (ghcr.io)
   → Disponível para todos os stages posteriores
```

### STAGE 2: Preparar Infraestrutura Primary
```
1. Autentica no DigitalOcean
2. Verifica se droplet "sales-os-prod" existe
   ✅ Se existe: Reutiliza (cost savings)
   ❌ Se não: Cria novo em nyc3
3. Configura firewall:
   - SSH (22)
   - HTTP (80)
   - HTTPS (443)
   - App (3000)
```

### STAGE 3: Deploy Primary
```
1. SSH para droplet primary
2. Instala Docker + Docker Compose
3. Clone/update código do repo
4. Copia .env.production com todos os secrets
5. `docker-compose -f docker-compose.prod.yml up -d`
6. Aguarda serviços: PostgreSQL, Redis, App
7. Executa migrações: `npm run db:generate && npm run db:push`
8. Health check: `curl /api/health`
   ✅ Success: Continua
   ❌ Failure: Ativa Stage 4 (fallback)
```

### STAGE 4: Deploy Fallback (Condicional)
```
CONDIÇÃO: Apenas se Primary falhou na health check

1. Cria novo droplet em lon1 (região diferente)
2. Setup idêntico ao Primary
3. Mesmo código, mesma configuração
4. Health check local
5. Se ambas falham: Relatório crítico e falha
6. Se fallback OK: Notifica para atualizar DNS
```

### STAGE 5: Relatório Final
```
Determina status:
  ✅ PRIMARY ACTIVE
     → Use primary IP, single-stack mode
  
  ⚠️ FALLBACK ACTIVE
     → Urgent: Update DNS to fallback IP
     → Primary needs investigation
  
  ❌ CRITICAL FAILURE
     → Both failed, manual intervention required
     → Check GitHub Actions logs

Envia:
  - Notificação Slack (se configurado)
  - GitHub Release tag com informações
  - Relatório stdout
```

---

## Configuração Necessária

### 1. Secrets GitHub (obrigatórios)
```
DO_TOKEN                    # Token API DigitalOcean
DO_DROPLET_NAME             # "sales-os-prod"
DO_SSH_PRIVATE_KEY          # Sua chave privada SSH
ANTHROPIC_API_KEY           # Claude API key
DATABASE_PASSWORD           # PostgreSQL password
REDIS_PASSWORD              # Redis password
NEXTAUTH_SECRET             # NextAuth secret
```

### 2. Secrets Opcionais
```
SLACK_WEBHOOK_URL           # Para notificações
BIRD_API_KEY                # Integrações Bird
BREVO_API_KEY               # Email marketing
SMTP_*                      # Configuração email
APP_URL                     # https://automatizawpp.com
APP_DOMAIN                  # automatizawpp.com
LE_EMAIL                    # Let's Encrypt email
```

### 3. DNS Setup
```
Após primeiro deploy bem-sucedido:

A record:
  automatizawpp.com → [PRIMARY_IP]

Após qualquer deploy com fallback ativo:
  automatizawpp.com → [FALLBACK_IP]
```

---

## Fluxo de Execução por Cenário

### Cenário 1: Primeiro Deploy
```
1. git push origin main
2. GitHub Actions triggered
3. Cria Primary droplet em nyc3
4. Deploy + health check ✅
5. Relatório: "✅ PRIMARY ACTIVE"
6. DNS: Point A record to Primary IP
7. Done - Single stack
```

### Cenário 2: Primary Falha (Intermitente)
```
1. git push origin main
2. GitHub Actions triggered
3. Primary deployment inicia
4. Health check falha ❌
5. Stage 4 ativada automaticamente
6. Fallback em lon1 criado e deployado
7. Fallback health check ✅
8. Relatório: "⚠️ FALLBACK ACTIVE"
9. DNS: Update A record to Fallback IP (urgente!)
10. Primary: Investigar logs, reintentar próximo push
```

### Cenário 3: Ambas Falham
```
1. git push origin main
2. GitHub Actions triggered
3. Primary fails ❌
4. Fallback fails ❌
5. Relatório: "❌ CRITICAL FAILURE"
6. GitHub Actions job status: FAILURE
7. Slack notificação com erro
8. Ação: SSH ao DigitalOcean, revisar logs manualmente
```

---

## Monitoramento & Troubleshooting

### Verificar Status
```bash
# GitHub Actions
GitHub → Actions → Deploy Persistent → Check latest run

# SSH ao Primary
ssh root@[PRIMARY_IP]
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml ps

# Logs da aplicação
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs -f app
```

### Problemas Comuns

#### "Primary deployment health check failed"
```
1. SSH ao droplet: ssh root@[IP]
2. Verificar Docker:
   docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml ps
3. Verificar logs:
   docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs app
4. Causas comuns:
   - Database migration timeout
   - Missing environment variable
   - Out of memory
   - Port 3000 não disponível
```

#### "Fallback created but DNS still points to primary"
```
1. Update DNS A record to fallback IP
2. Aguardar propagação DNS (5-30 min)
3. Testar: curl https://automatizawpp.com/api/health
4. Após estabilizar: Redeployo ao primary com fix
```

#### "All deployments failed"
```
1. Verificar secrets no GitHub
2. Verificar Docker credentials
3. Verificar DigitalOcean token (pode ter expirado)
4. Verificar SSH key permissões
5. Verificar espaço em disco no droplet
```

---

## Custos

### DigitalOcean (Estimado)
```
Primary:    $12/month  (s-2vcpu-4gb)
Fallback:   $0/month   (Criado apenas se falha)
Backups:    $2/month   (20% of droplet cost)
Floating IP:$3/month   (Para failover rápido)
────────────────────
Total:      $17/month  (Normal)
            $29/month  (Com fallback ativo)
```

### Alternativas
```
Vercel:     $20/month (hobby) - $150+/month (pro)
Firebase:   $300/month+ (com estado)
AWS:        $50+/month (EC2 + RDS)
```

---

## Checklist Pre-Deploy

- [ ] Todos os 7 secrets configurados
- [ ] SSH key adicionada ao DigitalOcean
- [ ] DigitalOcean token válido
- [ ] Dockerfile compila sem erros
- [ ] docker-compose.prod.yml validado
- [ ] .env.production.example atualizado
- [ ] Nenhum arquivo sensível no repo
- [ ] package.json tem scripts: build, start, db:generate, db:push

---

## Next Steps

1. **Commit este workflow:**
   ```bash
   git add .github/workflows/deploy-persistent.yml
   git commit -m "Add persistent dual-stack deployment with fallback"
   git push origin main
   ```

2. **Primeiro deploy será automático**
   - GitHub Actions dispara automaticamente
   - Monitore em GitHub → Actions

3. **Após sucesso:**
   - Copie Primary IP
   - Configure A record do DNS
   - Teste https://automatizawpp.com

4. **Monitoramento contínuo:**
   - Cada push = novo deploy automático
   - Se falha: Fallback ativado automaticamente
   - Zero downtime com redundância

---

## Conclusão

Esta solução oferece:
✅ Máxima automação (push → deploy)
✅ Sem intervenção manual
✅ Fallback automático se primary falha
✅ Notificações em tempo real
✅ Custo otimizado ($17-29/mês)
✅ Controle total (DigitalOcean + Docker)
✅ Escalável (upgrade simples em docker-compose)

É a **melhor estratégia para seu Next.js** com API, banco de dados, Redis e integrações.
