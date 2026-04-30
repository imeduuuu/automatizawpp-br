# Verificação Programática de Meta Tag Google Site Verification

## Visão Geral

Este conjunto de scripts verifica programaticamente se a meta tag `google-site-verification` foi adicionada com sucesso a um site Next.js após deploy.

## Scripts Disponíveis

### 1. Script Shell Simples (Recomendado para uso rápido)

**Arquivo:** `verify-google-meta-tag-simple.sh`

**Vantagens:**
- Muito simples (apenas curl + grep)
- Sem dependências
- Ideal para scripts CI/CD
- Executa em qualquer sistema com bash

**Uso:**
```bash
# Verificar se a meta tag existe
./verify-google-meta-tag-simple.sh https://meusite.com.br

# Verificar e validar código específico
./verify-google-meta-tag-simple.sh https://meusite.com.br "abc123xyz456"
```

**Saída:**
```
Verificando: https://meusite.com.br

=== Verificação simples (curl + grep) ===
<meta name="google-site-verification" content="abc123xyz456abc123xyz456" />
✓ Meta tag encontrada!

=== Detalhes completos ===
<meta name="google-site-verification" content="abc123xyz456abc123xyz456" />
```

---

### 2. Script Shell Completo (Recomendado para detalhamento)

**Arquivo:** `verify-google-meta-tag.sh`

**Vantagens:**
- Validação completa com cores e formatação
- Dicas úteis em caso de erro
- Validação de código esperado
- Mensagens de status detalhadas

**Uso:**
```bash
# Verificar se a meta tag existe
./verify-google-meta-tag.sh https://meusite.com.br

# Verificar e validar código específico
./verify-google-meta-tag.sh https://meusite.com.br "abc123xyz456"
```

**Saída:**
```
========================================
Verificador de Meta Tag Google
========================================
Data/Hora: 30/04/2026 10:30:45
URL: https://meusite.com.br
Código esperado: abc123xyz456

1. Fazendo requisição para o site...
✓ Requisição bem-sucedida (HTTP 200)

2. Procurando pela meta tag google-site-verification...
✓ Meta tag encontrada!

3. Detalhes da meta tag encontrada:
<meta name="google-site-verification" content="abc123xyz456abc123xyz456" />

4. Validando código...
✓ Código corresponde ao esperado
Código encontrado: abc123xyz456

========================================
✓ Verificação concluída com sucesso!
========================================
```

---

### 3. Script Node.js (Para integração em projetos)

**Arquivo:** `verify-google-meta-tag.js`

**Vantagens:**
- Pode ser importado como módulo
- Ideal para CI/CD em pipeline Node.js
- Saída estruturada e cores
- Tratamento robusto de erros

**Uso:**
```bash
# Verificar se a meta tag existe
node verify-google-meta-tag.js https://meusite.com.br

# Verificar e validar código específico
node verify-google-meta-tag.js https://meusite.com.br "abc123xyz456"
```

---

### 4. Script TypeScript (Para projetos TypeScript)

**Arquivo:** `verify-google-meta-tag.ts`

**Vantagens:**
- Type-safe
- Retorna objeto VerificationResult
- Ideal para integração com código TypeScript
- Pode ser usado em tests

**Uso:**
```bash
# Executar com ts-node
npx ts-node verify-google-meta-tag.ts https://meusite.com.br

# Verificar e validar código específico
npx ts-node verify-google-meta-tag.ts https://meusite.com.br "abc123xyz456"
```

---

## Casos de Uso

### 1. Verificação Manual Pós-Deploy

```bash
# Após fazer deploy para produção
./verify-google-meta-tag.sh https://www.meusite.com.br "seu-codigo-google"
```

### 2. Integração em GitHub Actions

```yaml
name: Verify Google Meta Tag After Deploy

on:
  deployment_status:
    if: github.event.deployment_status.state == 'success'

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Verify Google Meta Tag
        run: |
          ./verify-google-meta-tag.sh ${{ secrets.DEPLOY_URL }} ${{ secrets.GOOGLE_VERIFICATION_CODE }}
```

### 3. Integração em GitHub Actions (Node.js)

```yaml
name: Verify Google Meta Tag

on: [push]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Verify Google Meta Tag
        run: node verify-google-meta-tag.js https://meusite.com.br "seu-codigo"
```

### 4. Integração em Script de Deploy (DigitalOcean/VPS)

```bash
#!/bin/bash

# Deploy script
npm run build
npm run export
# ... upload files ...

# Verificar se a meta tag foi adicionada
./verify-google-meta-tag.sh https://meusite.com.br "abc123xyz456" || {
    echo "Erro: Meta tag não encontrada!"
    exit 1
}

echo "Deploy e verificação bem-sucedidos!"
```

### 5. Monitoramento Contínuo

```bash
#!/bin/bash

# Verificar a cada hora
while true; do
    echo "Verificando Google Meta Tag - $(date)"
    ./verify-google-meta-tag.sh https://meusite.com.br "seu-codigo"
    echo ""
    sleep 3600  # aguardar 1 hora
done
```

---

## Configuração no Next.js

Para que os scripts funcionem corretamente, a meta tag deve estar no seu `_document.tsx`:

```tsx
import Document, { Head, Html, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="pt-BR">
        <Head>
          <meta
            name="google-site-verification"
            content="seu-codigo-aqui"
          />
          {/* outras meta tags */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
```

Ou em Next.js 13+ com App Router (`app/layout.tsx`):

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  verification: {
    google: 'seu-codigo-aqui',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

---

## Troubleshooting

### Meta tag não aparece imediatamente após deploy

**Causa:** Cache do servidor ou CDN

**Solução:**
1. Aguarde 5-10 minutos
2. Limpe cache do navegador (Ctrl+Shift+Delete)
3. Use incógnito para evitar cache local
4. Verifique com curl para garantir que não é cache do navegador:
   ```bash
   curl -s https://meusite.com.br | grep -i google-site-verification
   ```

### Status HTTP diferente de 200

**Causa:** Site offline ou redirect

**Solução:**
1. Verifique se o site está online: `curl -I https://meusite.com.br`
2. Procure por redirects: `curl -L https://meusite.com.br`
3. Valide o certificado SSL: `openssl s_client -connect meusite.com.br:443`

### Código não coincide

**Causa:** Código errado ou meta tag desatualizada

**Solução:**
1. Confirme o código correto no Google Search Console
2. Verifique o arquivo `_document.tsx` localmente
3. Faça rebuild: `npm run build`
4. Redeploy do projeto

### Certificado SSL inválido em localhost

**Para testes locais:** Use `-k` flag com curl:
```bash
curl -k -s https://localhost:3000 | grep -i google-site-verification
```

---

## Comando Curl Puro (sem script)

Para verificação ultra-simples:

```bash
# Apenas verificar se existe
curl -s https://meusite.com.br | grep -i google-site-verification

# Com contagem
curl -s https://meusite.com.br | grep -i google-site-verification | wc -l

# Extrair apenas o código
curl -s https://meusite.com.br | grep -oP '(?<=content=")[^"]*' | head -1
```

---

## Integração com n8n

Você pode usar estes scripts em workflows n8n:

```
[Execute Command Node]
Command: ./verify-google-meta-tag.sh
Arguments: https://meusite.com.br seu-codigo

[Conditional Node]
IF: Output contains "✓ Verificação concluída"
THEN: Success
ELSE: Failure + Alert
```

---

## Performance e Limits

| Script | Tempo | Dependências | Ideal Para |
|--------|-------|--------------|-----------|
| simple.sh | <1s | curl, grep, bash | Quick checks |
| verify.sh | <2s | curl, grep, bash | Manual verification |
| verify.js | <2s | node | CI/CD pipelines |
| verify.ts | <3s | node, ts-node | TypeScript projects |

---

## Troubleshooting Avançado

### Ver resposta HTTP completa

```bash
curl -v https://meusite.com.br 2>&1 | grep -i google
```

### Ver HTML comprimido

```bash
curl -s -H "Accept-Encoding: gzip" https://meusite.com.br | gunzip | grep -i google
```

### Verificar com User-Agent específico

```bash
curl -s -A "Mozilla/5.0" https://meusite.com.br | grep -i google
```

---

**Última atualização:** 30/04/2026
**Versão:** 1.0
