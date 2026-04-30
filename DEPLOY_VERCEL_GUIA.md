# Guia Completo: Deploy do automatizawppBR no Vercel

Seu projeto Next.js (sales-os / automatizawppBR) agora pode ser deployado no Vercel em 3 passos simples.

---

## 1. Instalar Vercel CLI

Cole no terminal:

```bash
npm install -g vercel
```

**Verificar instalação:**
```bash
vercel --version
```

---

## 2. Autenticar no Vercel (primeira vez apenas)

Cole no terminal:

```bash
vercel login
```

Vai abrir o navegador para autenticar. Siga as instruções na tela (clique em "Continue" depois em "Confirm"). Pronto, você está logado.

**Verificar autenticação:**
```bash
vercel whoami
```

---

## 3. Deploy Manual com Um Comando

Navegue até a pasta do projeto:

```bash
cd /Users/eduardosilva/Antigravity/automatizawppBR
```

Faça o deploy:

```bash
vercel deploy --prod
```

**O que vai acontecer:**
- Vercel vai linkar seu projeto (criar um `.vercel/project.json`)
- Build automático (Next.js build)
- Deploy para produção
- **URL do seu site** será exibida no final

**Se for a primeira vez:**
- Pode pedir confirmação de alguns dados (projeto, framework, root directory)
- Responda "Y" para tudo ou deixe o padrão

---

## 4. Deploy Automático em Cada Push (GitHub)

### 4.1 Conectar o repositório ao Vercel

Acesse: https://vercel.com/dashboard

- Clique em **"Add New..."** → **"Project"**
- Selecione seu repositório GitHub (automatizawppBR)
- Vercel vai detectar que é Next.js automaticamente

### 4.2 Configurar Variáveis de Ambiente

No dashboard Vercel do seu projeto:

1. Vá para **"Settings"** → **"Environment Variables"**
2. Copie as variáveis do seu `.env` (local)
3. **Cole cada uma** no Vercel:

**Variáveis obrigatórias para produção:**

```
DATABASE_URL = (sua URL PostgreSQL em produção)
REDIS_URL = (sua URL Redis em produção)
NEXTAUTH_SECRET = (gere uma senha forte, ex: openssl rand -base64 32)
NEXTAUTH_URL = (seu domínio em produção, ex: https://seu-dominio.com)
APP_URL = (seu domínio em produção, ex: https://seu-dominio.com)
NEXT_PUBLIC_BASE_URL = (seu domínio em produção, ex: https://seu-dominio.com)
```

**Variáveis opcionais (se usa):**

```
OPENAI_API_KEY
OPENAI_MODEL
BIRD_API_KEY
BIRD_WORKSPACE_ID
BIRD_CHANNEL_ID
BIRD_PHONE_NUMBER
BIRD_EMAIL_CHANNEL_ID
BIRD_EMAIL_FROM
EMAIL_PROVIDER
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
MAIL_FROM
RESEND_API_KEY
RESEND_FROM
BREVO_API_KEY
BREVO_SENDER_EMAIL
IMAP_HOST
IMAP_PORT
IMAP_USER
IMAP_PASS
MAX_TOUCHES_PER_DAY
QUIET_HOURS_START
QUIET_HOURS_END
DEFAULT_TIMEZONE
```

**Dica:** Marque cada variável como `Production` se quiser que seja usada apenas no deploy para produção.

### 4.3 Pronto! Deploy Automático Ativado

Agora, **sempre que você fizer push para GitHub**:

1. Vercel detecta o push automaticamente
2. Roda `npm run build` (seu script em package.json)
3. Faz o deploy
4. Envia um link para a URL live

**Ver histórico de deploys:**
- Dashboard Vercel → Deployments

---

## 5. Comandos Úteis do Dia a Dia

```bash
# Ver status do deploy atual
vercel status

# Ver logs do último deploy
vercel logs --follow

# Deploy sem ir para produção (preview URL)
vercel deploy

# Limpar cache e fazer rebuild
vercel deploy --skip-build=false --force

# Ver variáveis de ambiente do Vercel
vercel env ls

# Pull as variáveis do Vercel para local (.env.local)
vercel env pull
```

---

## 6. Troubleshooting Rápido

### Build falha ("prisma generate" error)

Seu projeto tem:
```json
{
  "build": "prisma generate && next build"
}
```

Se der erro, adicione as variáveis de ambiente **antes do build**:

1. No dashboard Vercel, go to **Settings** → **Build & Deployment**
2. Em **"Build Command"**, deixe como está: `npm run build`
3. Certifique-se que `DATABASE_URL` está definida para produção

### Deploy bem-sucedido mas site mostra erro 500

**Causas mais comuns:**

1. **DATABASE_URL inválida** → verificar conexão
2. **NEXTAUTH_SECRET não definido** → gere com: `openssl rand -base64 32`
3. **NEXTAUTH_URL não corresponde ao domínio** → atualizar para o domínio correto

### Quero reverter para um deploy anterior

No dashboard Vercel:
- **Deployments** → clique no deploy anterior → **"Promote to Production"**

---

## 7. Checklist Rápido Antes do Primeiro Deploy

- [ ] Projeto commitado no GitHub
- [ ] Vercel CLI instalado (`vercel --version`)
- [ ] Autenticado no Vercel (`vercel whoami`)
- [ ] Repositório GitHub conectado no Vercel dashboard
- [ ] Variáveis de ambiente adicionadas no Vercel
- [ ] DATABASE_URL e REDIS_URL apontam para produção
- [ ] NEXTAUTH_SECRET definido (gere com `openssl rand -base64 32`)
- [ ] Domínio custom configurado (opcional, Vercel dá URL padrão automaticamente)

---

## 8. URL do Seu Site

**Após o primeiro deploy automático:**
- URL será: `https://SEU-PROJETO.vercel.app` (padrão)
- Ou custom: se você adicionar domínio próprio no Vercel

**Ver URL do projeto:**
```bash
vercel list
```

---

## Resumo: Os 3 Passos Mais Importantes

1. **Uma única vez:**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Conectar repositório:** Ir ao https://vercel.com/dashboard, adicionar repositório GitHub, configurar variáveis de ambiente

3. **Pronto!** A partir daqui, **cada push no GitHub = deploy automático**. Sem fazer nada.

---

**Dúvidas?** Rodar no terminal: `vercel help` ou visitar https://vercel.com/docs
