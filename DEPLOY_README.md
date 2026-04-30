# Deploy Vercel - Guia Completo

Você tem 4 documentos prontos para fazer deploy do seu projeto automatizawppBR (Next.js) no Vercel.

## Comece aqui: 3 Passos (5 minutos)

```bash
# 1. Instalar Vercel CLI (primeira vez)
npm install -g vercel
vercel login

# 2. Deploy de teste (opcional)
cd /Users/eduardosilva/Antigravity/automatizawppBR
vercel deploy

# 3. Deploy em PRODUÇÃO
vercel deploy --prod
```

Pronto! Seu site estará live em uma URL tipo `https://seu-projeto.vercel.app`

---

## 4 Documentos Nesta Pasta

### 1. **VERCEL_QUICK_START.txt** ← Comece aqui
   - Resumo em 1 página dos 4 passos principais
   - Comandos mais usados
   - Links para troubleshooting rápido
   - Abra no editor de texto

### 2. **DEPLOY_VERCEL_GUIA.md** ← Guia Completo
   - 8 seções detalhadas:
     1. Instalar Vercel CLI
     2. Autenticação
     3. Deploy manual
     4. Deploy automático (GitHub)
     5. Comandos úteis do dia a dia
     6. Troubleshooting
     7. Checklist pré-deploy
     8. URLs do seu site

### 3. **DEPLOY_CHECKLIST.md** ← Validação em 7 Fases
   - Checklist prático para não esquecer nada
   - Fase 1: Preparação local
   - Fase 2: Vercel CLI
   - Fase 3: Deploy de teste
   - Fase 4: Produção (variáveis de ambiente)
   - Fase 5: Deploy em produção
   - Fase 6: Deploy automático (GitHub)
   - Fase 7: Pós-deploy

### 4. **deploy-vercel.sh** ← Script Automatizado
   - Script bash executável
   - Uso: `./deploy-vercel.sh` (preview) ou `./deploy-vercel.sh --prod`
   - Verifica CLI, autenticação, e faz deploy
   - Útil para CI/CD futura

---

## Fluxo Recomendado

### Para o Primeiro Deploy:

1. Abra **VERCEL_QUICK_START.txt** (2 min leitura)
2. Siga os 4 passos
3. Use **DEPLOY_CHECKLIST.md** para validar cada fase
4. Se der erro, consulte **DEPLOY_VERCEL_GUIA.md** seção "Troubleshooting"

### Para Deploy Automático (GitHub):

1. Abra **DEPLOY_VERCEL_GUIA.md** seção 4 ("Deploy Automático em Cada Push")
2. Siga as instruções
3. Adicione as variáveis de ambiente no Vercel dashboard
4. Pronto! Cada push automático vai gerar um deploy

### Dia a Dia:

- Usar `vercel deploy --prod` via CLI ou
- Fazer `git push origin main` e deixar o GitHub Actions (do Vercel) fazer tudo

---

## Variáveis de Ambiente (Crítico!)

Antes de fazer `vercel deploy --prod`, você PRECISA configurar no Vercel dashboard:

**Obrigatórias:**
- `DATABASE_URL` → PostgreSQL de produção
- `REDIS_URL` → Redis de produção
- `NEXTAUTH_SECRET` → gere com `openssl rand -base64 32`
- `NEXTAUTH_URL` → seu domínio (ex: `https://seu-projeto.vercel.app`)
- `APP_URL` → mesmo que NEXTAUTH_URL
- `NEXT_PUBLIC_BASE_URL` → mesmo que NEXTAUTH_URL

**Opcionais (se usa):**
- `OPENAI_API_KEY`, `BIRD_API_KEY`, `BREVO_API_KEY`, `RESEND_API_KEY`, `SMTP_*`, etc.

Ver **DEPLOY_VERCEL_GUIA.md** para lista completa.

---

## Troubleshooting Rápido

### "Build failed"
```bash
vercel logs --tail   # ver erro exato
```

### "Site mostra erro 500"
- Verificar `DATABASE_URL` está acessível
- Verificar `NEXTAUTH_SECRET` foi definido
- Verificar `NEXTAUTH_URL` = seu domínio

### "Quero voltar para um deploy anterior"
- Ir a https://vercel.com/dashboard
- Deployments → clicar no anterior → "Promote to Production"

### "Erro na autenticação local"
```bash
vercel logout
vercel login
```

---

## Próximas Etapas

1. **Deploy manual** (hoje):
   - `vercel deploy --prod` uma vez
   - Testar o site

2. **Deploy automático** (depois):
   - Conectar repositório GitHub no Vercel dashboard
   - Cada `git push` = deploy automático

3. **Domínio custom** (opcional):
   - Vercel dashboard → Settings → Domains
   - Adicionar seu domínio próprio (ex: automatizawpp.com)

4. **Monitoramento** (recomendado):
   - Vercel dashboard → Analytics
   - Ver performance, erros, etc em tempo real

---

## Referências

- Documentação oficial: https://vercel.com/docs
- Next.js + Vercel: https://vercel.com/docs/deployments/managed-nextjs
- CLI Reference: https://vercel.com/docs/cli

---

**Pronto?** Abra **VERCEL_QUICK_START.txt** agora!
