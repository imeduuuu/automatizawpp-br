# Google Search Console Setup Guide

Este guia passo a passo adiciona seu domínio AutomatizaWPP ao Google Search Console (GSC) para indexação e monitoramento.

## Pré-requisitos

- Acesso ao Google Account (Gmail, etc)
- Domínio `https://automatizawpp.com` já apontando para o servidor
- SSL/HTTPS funcionando
- `robots.txt` e `sitemap.xml` acessíveis

---

## Passo 1: Acessar Google Search Console

Visite: **https://search.google.com/search-console**

Você será solicitado a fazer login com sua conta Google. Use a conta corporativa ou pessoal que gerencia o domínio.

---

## Passo 2: Adicionar Nova Propriedade

Na página principal do GSC, procure o botão/link **"Add property"** ou **"+"** no canto superior esquerdo.

Você verá 2 opções:
- **Domain** — para gerenciar todo o domínio
- **URL prefix** — para gerenciar um subdiretório específico

**Escolha:** Domain (mais abrangente)

---

## Passo 3: Digitar o Domínio

Na caixa de texto, digite:
```
automatizawpp.com
```

Não inclua `https://` ou `www` — apenas o domínio nu.

Clique em **"Continue"**.

---

## Passo 4: Escolher Método de Verificação

Google oferece vários métodos. O mais rápido é **Meta Tag**:

- Google gera uma meta tag HTML
- Você coloca a tag no `<head>` da página
- GSC valida que encontrou a tag

Clique na aba **"Meta Tag"** se não estiver selecionada.

---

## Passo 5: Copiar a Meta Tag

Google exibe uma meta tag como:
```html
<meta name="google-site-verification" content="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
```

**Copie o valor inteiro** (incluindo `name` e `content`).

---

## Passo 6: Adicionar Meta Tag ao Projeto

Abra o arquivo principal do seu projeto Next.js:

**Arquivo:** `src/app/layout.tsx` (ou similar, onde fica o `<head>`)

**Localize:** A seção `<head>` onde metadados são definidos.

**Adicione:**
```tsx
<meta name="google-site-verification" content="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
```

**Substitua** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` pelo valor que você copiou.

**Exemplo completo:**
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AutomatizaWPP",
  description: "Automação inteligente para WhatsApp Business",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="google-site-verification" content="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        {/* outros metadados */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Passo 7: Deploy Novamente

Agora que a meta tag está no código, você precisa fazer deploy:

```bash
./scripts/deploy-do.sh
```

Ou manualmente:
```bash
npm run build
docker-compose -f docker-compose.prod.yml up -d
```

**Aguarde 2-3 minutos** até o novo código estar ao vivo.

---

## Passo 8: Validar no Google Search Console

Volte à aba do Google Search Console (a que estava aberta no Passo 5).

Clique no botão **"Verify"** (ou "Validar").

Google tentará encontrar a meta tag na página. Se bem-sucedido:

- Verá mensagem: ✓ Propriedade verificada
- GSC estará ativo para seu domínio

Se falhar:
- Verifique se a meta tag foi inserida corretamente
- Confirme que o deploy foi concluído
- Aguarde mais 1-2 minutos e tente novamente

---

## Passo 9: Adicionar Sitemap

Após verificação bem-sucedida, você estará no painel do GSC para seu domínio.

**Navegue para:** Left menu → **Sitemaps** (ou "Sitemaps" em português)

Na seção **"Add new sitemap"**, digite:
```
https://automatizawpp.com/sitemap.xml
```

Clique em **"Submit"** ou **"Enviar"**.

Google confirmará:
```
Sitemap successfully submitted.
```

---

## Passo 10: Monitorar Progresso

Após submeter o sitemap, Google levará **3 a 5 dias** para processar e indexar as URLs.

**Localizações para monitorar:**

1. **Pages** (Páginas) — mostra quantas URLs foram descobertas e indexadas
2. **Coverage** (Cobertura) — erros de indexação, se houver
3. **Sitemaps** — status de processamento do sitemap

**Sinais de sucesso:**
- Coverage exibe "Valid" com número de URLs
- Pages aumenta gradualmente (3-5 dias)
- Nenhum erro crítico em "Errors"

---

## Troubleshooting

### Meta tag não é encontrada
- Certifique-se que `npm run build` foi executado
- Verifique que o servidor está servindo a nova versão
- No browser, vá a `https://automatizawpp.com` e veja o source (Ctrl+U) — a meta tag deve estar lá

### Sitemap não processa
- Verifique: `curl https://automatizawpp.com/sitemap.xml` deve retornar XML válido
- Confirme que robots.txt permite acesso: `curl https://automatizawpp.com/robots.txt`
- Aguarde até 24 horas antes de investigar erros

### Domínio não verifica
- Verifique cache: tente incógnito/private browsing
- Confirme que SSL/HTTPS está ativo
- Se usar cloudflare, desative proxy temporariamente

---

## Próximas Etapas

Após verificação e submit do sitemap:

1. **Search Analytics** — começará a mostrar cliques e impressões em ~2 semanas
2. **Coverage Reports** — monitorar erros de crawl
3. **Mobile Usability** — verificar se há problemas mobile
4. **Core Web Vitals** — otimizar velocidade, se necessário

---

## Referências

- [Google Search Console Help](https://support.google.com/webmasters)
- [Sitemap Protocol](https://www.sitemaps.org/)
- [robots.txt Standard](https://www.robotstxt.org/)
