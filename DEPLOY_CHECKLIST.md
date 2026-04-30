# Checklist de Deploy no Vercel

Use este checklist antes de fazer o primeiro deploy.

## Fase 1: Preparação Local

- [ ] Projeto está no GitHub (repositório remoto criado)
- [ ] Código está commitado: `git status` mostra "nothing to commit"
- [ ] `npm install` rodou com sucesso
- [ ] `npm run build` roda sem erros localmente

## Fase 2: Vercel CLI

- [ ] Vercel CLI instalado: `npm install -g vercel`
- [ ] Vercel CLI versão OK: `vercel --version` (deve ser v33.0.0 ou maior)
- [ ] Autenticado: `vercel whoami` (mostra seu email)

## Fase 3: Deploy Manual (teste)

- [ ] Rodou: `cd /Users/eduardosilva/Antigravity/automatizawppBR`
- [ ] Rodou: `vercel deploy` (preview, sem --prod)
- [ ] URL preview funcionando (abrir link na tela)
- [ ] Teste rápido: consegue acessar a página no navegador

## Fase 4: Preparar Produção

### Banco de Dados e Cache
- [ ] Ter um PostgreSQL em produção (ex: Vercel Postgres, Railway, etc)
- [ ] Ter um Redis em produção (ex: Redis Cloud, Railway, etc)
- [ ] Testes de conexão locais confirmados

### Variáveis de Ambiente

No dashboard Vercel (https://vercel.com/dashboard):

1. Selecione seu projeto
2. Vá para **Settings** → **Environment Variables**
3. Adicione EXATAMENTE estas variáveis (com valores de produção):

**OBRIGATÓRIAS (cópia do seu .env, adaptadas para produção):**

```
DATABASE_URL = postgresql://user:pass@host:5432/dbname
REDIS_URL = redis://:password@host:port
NEXTAUTH_URL = https://seu-dominio.com (ou https://seu-projeto.vercel.app)
NEXTAUTH_SECRET = (gere: openssl rand -base64 32)
APP_URL = https://seu-dominio.com
APP_BASE_URL = https://seu-dominio.com
NEXT_PUBLIC_BASE_URL = https://seu-dominio.com
```

**OPCIONAIS (se usa alguma destas APIs):**

```
OPENAI_API_KEY = sk-...
BIRD_API_KEY = ...
BREVO_API_KEY = ...
RESEND_API_KEY = ...
SMTP_HOST = smtp.zoho.com
SMTP_USER = seu-email@dominio.com
MAIL_FROM = Nome <seu-email@dominio.com>
```

- [ ] Cada variável foi adicionada com tipo `Production`
- [ ] `DATABASE_URL` aponta para banco de produção
- [ ] `REDIS_URL` aponta para Redis de produção
- [ ] `NEXTAUTH_SECRET` foi gerado (não é vazio)
- [ ] URLs (`NEXTAUTH_URL`, `APP_URL`, etc) estão corretas

## Fase 5: Deploy em Produção

- [ ] Rodou: `vercel deploy --prod`
- [ ] Build completou sem erros
- [ ] URL de produção exibida no terminal
- [ ] Testou a URL em produção no navegador

## Fase 6: Deploy Automático (GitHub)

No dashboard Vercel do seu projeto:

- [ ] **Git** está conectado ao repositório GitHub
- [ ] **Deployments** está em "Automatic"
- [ ] Branch padrão é `main` (ou `develop`, o que preferir)

**Agora é automático:**
- Cada `git push origin main` → deploy automático
- Sem fazer nada extra

## Fase 7: Pós-Deploy

- [ ] Acessou o domínio de produção com sucesso
- [ ] Testou login/autenticação
- [ ] Testou funcionalidades principais
- [ ] Verificou logs de erro no dashboard Vercel (zero erros esperados)

## Problema? Use isto:

```bash
# Ver logs de erro
vercel logs --tail

# Ver status do deploy atual
vercel status

# Reverter para deploy anterior
# → Dashboard Vercel → Deployments → clicar no anterior → "Promote to Production"

# Debugar localmente
vercel env pull  # puxa variáveis do Vercel para .env.local
npm run build    # roda build localmente com as mesmas variáveis
npm start        # roda servidor de produção localmente
```

---

**Pronto para começar?**

1. Complete a Fase 1-2
2. Teste com `vercel deploy` (Fase 3)
3. Configure produção (Fase 4)
4. Faça primeiro deploy com `vercel deploy --prod` (Fase 5)
5. Conecte GitHub para automático (Fase 6)
