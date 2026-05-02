# Google SEO — Posicionar AutomatizaWPP em Resultados de Busca

**Data:** 2026-04-30  
**Objetivo:** Indexar páginas + posicionar en top 3 para keywords principais  
**Keywords Focus:** automacao whatsapp, automacao vendas, automacao atendimento

---

## 1. Verificar Arquivos SEO

### ✅ robots.ts (Next.js Route)
```typescript
src/app/robots.ts
→ Gerado automáticamente em /robots.txt
→ Permite crawling de páginas públicas
→ Disallow: /admin, /login, /settings
```

### ✅ sitemap.ts (Next.js Route)
```typescript
src/app/sitemap.ts
→ Gerado automáticamente em /sitemap.xml
→ 7 URLs principais incluídas
→ Prioridades: 1.0, 0.9, 0.8, 0.7
```

### ✅ Verificar acessibilidade
```bash
# Deve retornar 200 OK agora (em vez de 404)
curl -I https://automatizawpp.com/robots.txt
curl -I https://automatizawpp.com/sitemap.xml
```

---

## 2. Google Search Console Setup

### Passo 1: Acessar GSC
```
1. Go to https://search.google.com/search-console
2. Login com Google Account (usar email que gerencia automatizawpp.com)
3. Click "Add Property"
4. Escolher URL prefix: https://automatizawpp.com
5. Click "Continue"
```

### Passo 2: Verificação de Propriedade

**Opção A: HTML Meta Tag** (Mais rápido)
```
1. Google vai mostrar um meta tag
2. Copiar: <meta name="google-site-verification" content="...">
3. Adicionar em src/app/layout.tsx:

export const metadata = {
  verification: {
    google: 'YOUR_VERIFICATION_CODE_HERE',
  },
};

4. Fazer deploy
5. Voltar em GSC e clicar "Verify"
```

**Opção B: DNS Record** (Mais permanente)
```
1. Copiar TXT record do GSC
2. Adicionar em seu DNS provider (DigitalOcean)
3. Esperar propagação (5-15 min)
4. Clicar "Verify" em GSC
```

### Passo 3: Submeter Sitemap

```
1. No GSC, ir a "Sitemaps" (menu esquerdo)
2. Em "Add a new sitemap", digitar:
   https://automatizawpp.com/sitemap.xml
3. Clicar "Submit"
4. GSC vai começar a rastrear as URLs
```

---

## 3. Monitorar Indexação

### URLs Indexadas

```
1. Em GSC, ir a "Pages"
2. Ver quantas URLs foram descobertas vs indexadas
3. Meta ideal:
   - 7 URLs descobertas
   - 7 URLs indexadas
   - 0 erros de rastreamento
```

### Coverage Report

```
1. Ir a "Coverage" (menu esquerdo)
2. Status esperado:
   ✅ Error: 0
   ✅ Valid with warnings: 0 (ou poucos)
   ✅ Valid: 7+
   ⚠️ Excluded: (normal, páginas de admin/login)
```

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Not indexed, blocked by robots.txt" | robots.ts bloqueia | Remover URL de Disallow |
| "Discovered - currently not indexed" | Página muito nova | Aguardar 1-2 semanas |
| "Soft 404" | Página retorna conteúdo genérico | Melhorar conteúdo/meta tags |
| "Crawled - currently not indexed" | Conteúdo duplicado | Verificar canonicals |

---

## 4. Performance & Indexability

### Verificar Page Experience

```
1. Em GSC, ir a "Core Web Vitals"
2. Métricas esperadas:
   - LCP (Largest Contentful Paint): < 2.5s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1
3. Se ruim: Otimizar imagens, CSS, JS
```

### Verificar Mobile Usability

```
1. Em GSC, ir a "Mobile Usability"
2. Esperado: 0 errors
3. Se houver: Corrigir viewport, click targets, font size
```

---

## 5. Keywords & Positioning

### Submeter Keywords no GSC

```
1. Ir a "Performance" (menu esquerdo)
2. Filtrar por país: Brazil
3. Ver keywords que já estão rankando
4. Adicionar meta descriptions otimizadas em cada página
```

### Keywords Alvo

```
Primário (Volume alto):
- automacao whatsapp (600+ buscas/mês)
- automacao vendas (400+ buscas/mês)
- automacao atendimento (300+ buscas/mês)

Secundário (Long-tail):
- chatbot whatsapp gratis
- automacao de vendas online
- sistema de atendimento automatizado
- assistente virtual whatsapp
```

### Otimizar Meta Tags

```typescript
// src/app/automacao-whatsapp/page.tsx
export const metadata = {
  title: 'Automação WhatsApp | AutomatizaWPP',
  description: 'Automatize suas vendas e atendimento no WhatsApp com IA. Responda 24/7, qualifique leads e feche vendas automaticamente.',
  openGraph: {
    title: 'Automação WhatsApp - AutomatizaWPP',
    description: 'Sistema de automação inteligente para WhatsApp Business. Respostas automáticas, qualificação de leads, integração com CRM.',
    image: 'https://automatizawpp.com/og-automacao-whatsapp.jpg',
  },
};
```

---

## 6. Link Building & Authority

### Estratégia de Links

```
1. Criar posts de blog com links internos para páginas principais
2. Link interconexão:
   / → /automacao-whatsapp → /casos-sucesso → /blog
   
3. Externo (opcional):
   - Comentários em blogs de produtividade
   - Menção em diretórios de ferramentas (ProductHunt, etc)
   - Guest posts em blogs BR
```

### Internal Linking

```html
<!-- Em pages principais -->
<a href="/automacao-whatsapp">Leia como automatizar WhatsApp</a>
<a href="/casos-sucesso">Veja casos de sucesso</a>
<a href="/blog">Dicas de vendas online</a>
```

---

## 7. Monitoramento Contínuo

### Checklist Semanal

```
[ ] GSC: Verificar Coverage report (Errors = 0)
[ ] GSC: Ver Keywords rankando (Top 100 search positions)
[ ] GSC: Revisar Core Web Vitals
[ ] Google: "site:automatizawpp.com" → Quantas pages indexadas?
[ ] Bing: Submeter sitemap também (https://www.bing.com/webmasters)
```

### KPIs para Rastrear

| Métrica | Semana 1 | Semana 4 | Semana 8 |
|---------|----------|----------|----------|
| URLs Indexadas | 7 | 10+ | 15+ |
| Impressões Google | 0 | 50+ | 200+ |
| Clicks de busca | 0 | 5+ | 30+ |
| Posição média | — | 15-25 | 5-10 |
| Pages Top 3 | 0 | 1 | 3 |

---

## 8. Script para Verificar Indexação

```bash
#!/bin/bash
# Script para monitorar indexação no Google

DOMAIN="automatizawpp.com"
KEYWORDS=("automacao whatsapp" "automacao vendas" "automacao atendimento")

echo "=== Verificando indexação em Google ==="
echo "Domínio: $DOMAIN"
echo ""

for keyword in "${KEYWORDS[@]}"; do
  INDEXED=$(curl -s "https://www.google.com/search?q=site:$DOMAIN+$keyword" | grep -o 'about [0-9]* results' | head -1)
  echo "Keyword: '$keyword'"
  echo "Resultado: $INDEXED"
  echo ""
done

echo "=== Verificando robots.txt e sitemap ==="
echo "robots.txt:"
curl -s -I "https://$DOMAIN/robots.txt" | head -1

echo "sitemap.xml:"
curl -s -I "https://$DOMAIN/sitemap.xml" | head -1
```

---

## 9. Timeline Esperado

```
Dia 1-2: Submeter a GSC
   → Google começa rastreamento
   → Crawls robots.txt e sitemap.xml
   
Dia 3-5: Primeiras URLs indexadas
   → Aparecem em "Indexed" no Coverage
   → Podem não ter rankings ainda
   
Semana 2-3: Primeiros positions (50-100)
   → 1-2 keywords aparecem nas buscas
   → Posição média: 20-50
   
Semana 4-6: Otimização & Tuning
   → Melhorar conteúdo baseado em CTR
   → Aumentar backlinks internos
   → Posição média: 10-20
   
Semana 8+: Top 10
   → 1-2 keywords em top 10
   → 3-5 keywords em top 20
   → Posição média: 5-15
```

---

## 10. Próximos Passos

- [ ] Fazer build do projeto com robots.ts e sitemap.ts
- [ ] Deploy em DigitalOcean
- [ ] Verificar que /robots.txt e /sitemap.xml retornam 200
- [ ] Adicionar meta tag de verificação do Google
- [ ] Submeter sitemap no Google Search Console
- [ ] Monitorar Coverage report diariamente
- [ ] Otimizar meta descriptions baseado em keywords
- [ ] Criar links internos entre páginas
- [ ] Aguardar 2-4 semanas para indexação
- [ ] Usar GSC Performance tab para otimizar positions

---

**Status:** 🟢 Pronto para posicionar

Documentação: `/docs/SALES-OS-ARCHITECTURE.md` + `/docs/GOOGLE-SEO-SETUP.md`
