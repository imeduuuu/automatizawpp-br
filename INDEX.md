# Índice de Arquivos - Verificação de Meta Tag Google

## Comece Por AQUI

**Se você tem 30 segundos:** Leia `QUICK_START.md`

**Se você tem 5 minutos:** Leia `README_GOOGLE_VERIFICATION.md`

**Se você quer detalhes:** Leia `RESUMO_TECNICO.txt`

---

## Arquivos de Documentação

| Arquivo | Tamanho | O que é | Tempo de leitura |
|---------|---------|--------|------------------|
| QUICK_START.md | 3.8KB | Como usar em 3 formas rápidas | 5 min |
| README_GOOGLE_VERIFICATION.md | 6.2KB | Visão geral completa | 8 min |
| GOOGLE_META_VERIFICATION.md | 8.2KB | Documentação técnica detalhada | 15 min |
| EXEMPLOS_PRATICOS.md | 7.7KB | 15 exemplos práticos de uso | 10 min |
| RESUMO_TECNICO.txt | 8.5KB | Resumo executivo e técnico | 10 min |
| INDEX.md | Este arquivo | Índice de todos os arquivos | 3 min |

---

## Scripts Executáveis

### 1. verify-google-meta-tag-simple.sh (1.0KB)

**Mais rápido e simples.**

```bash
./verify-google-meta-tag-simple.sh https://seu-site.com.br
./verify-google-meta-tag-simple.sh https://seu-site.com.br "seu-codigo"
```

Ideal para: CI/CD, scripts automation, verificação rápida

**Tempo:** <2 segundos

---

### 2. verify-google-meta-tag.sh (3.1KB)

**Mais detalhado com validação.**

```bash
./verify-google-meta-tag.sh https://seu-site.com.br
./verify-google-meta-tag.sh https://seu-site.com.br "seu-codigo"
```

Ideal para: Verificação manual, debugging, dicas de erro

**Tempo:** 2-3 segundos

---

### 3. verify-google-meta-tag.js (5.0KB)

**Versão Node.js.**

```bash
node verify-google-meta-tag.js https://seu-site.com.br
node verify-google-meta-tag.js https://seu-site.com.br "seu-codigo"
```

Ideal para: Integração em projetos Node.js, CI/CD com Node

**Tempo:** 2-3 segundos

---

### 4. verify-google-meta-tag.ts (6.6KB)

**Versão TypeScript.**

```bash
npx ts-node verify-google-meta-tag.ts https://seu-site.com.br
npx ts-node verify-google-meta-tag.ts https://seu-site.com.br "seu-codigo"
```

Ideal para: Projetos TypeScript, type-safe verification

**Tempo:** 3-4 segundos

---

## Integrações

### GitHub Actions

**Arquivo:** `.github-workflows-verify-google-meta.yml` (2.9KB)

Template pronto para usar em GitHub Actions.

Suporta:
- Trigger após deployment automático
- Trigger manual (workflow_dispatch)
- Trigger em schedule (cronjob)
- Notificações em comentários

Como usar:
1. Copie o arquivo para `.github/workflows/verify-google-meta.yml`
2. Configure os secrets no GitHub
3. Fazer push para main

---

### n8n Workflow

**Arquivo:** `example-n8n-workflow.json` (3.8KB)

Template pronto para importar em n8n.

Fluxo:
1. Fetch HTML do site
2. Procurar meta tag
3. IF encontrada
   - Sim: Enviar email de sucesso
   - Não: Enviar email de erro

Como usar:
1. Abra n8n
2. Create > Workflow > Import from File
3. Selecione `example-n8n-workflow.json`
4. Configure email e URLs
5. Ative o workflow

---

## Guia Rápido por Caso de Uso

### Quero verificar rapidamente

```bash
curl -s https://seu-site.com.br | grep -i google-site-verification
```

### Quero usar um script

```bash
./verify-google-meta-tag-simple.sh https://seu-site.com.br
```

### Quero validar um código específico

```bash
./verify-google-meta-tag.sh https://seu-site.com.br "abc123xyz456"
```

### Quero integrar em CI/CD (GitHub)

1. Copie `.github-workflows-verify-google-meta.yml` para `.github/workflows/`
2. Configure secrets
3. Configure a URL e código

### Quero integrar em deploy script

```bash
#!/bin/bash
npm run build && npm run export
rsync -avz ./out/ user@server:/var/www/site/
./verify-google-meta-tag.sh https://seu-site.com.br "seu-codigo" || exit 1
```

### Quero monitorar continuamente

```bash
watch -n 10 'curl -s https://seu-site.com.br | grep -i google'
```

### Quero em cronjob

```bash
# Verificar a cada 6 horas
0 */6 * * * /home/usuario/verify-google-meta-tag.sh https://seu-site.com.br
```

---

## Arquitetura da Solução

```
┌─────────────────────────────────────────────┐
│   URL do Site                               │
└────────────────┬────────────────────────────┘
                 │
                 v
        ┌────────────────┐
        │  curl -s       │  (fetch HTML)
        │  [URL]         │
        └────────┬───────┘
                 │
                 v
        ┌────────────────┐
        │  grep -i       │  (search pattern)
        │  "google-..    │
        └────────┬───────┘
                 │
         ┌───────┴───────┐
         │               │
      Encontrada?       Não encontrada
         │               │
         v               v
    ┌─────────┐      ┌──────────┐
    │ Extrair │      │ FAILURE  │
    │ conteúdo│      │ (exit 1) │
    └────┬────┘      └──────────┘
         │
    Validar código?
         │
    ┌────┴────┐
    │          │
   Sim        Não
    │          │
    v          v
┌──────┐   ┌──────────┐
│Check │   │ SUCCESS  │
│match │   │ (exit 0) │
└──┬───┘   └──────────┘
   │
┌──┴─────┐
│         │
Sim      Não
│         │
v         v
SUCCESS   FAILURE
(exit 0)  (exit 1)
```

---

## Fluxo de Decisão

**Qual script devo usar?**

```
Quer máxima velocidade?
├─ Sim → curl + grep (1 linha)
└─ Não → continue

Quer saída simples?
├─ Sim → verify-google-meta-tag-simple.sh
└─ Não → continue

Quer validação de código?
├─ Sim → verify-google-meta-tag.sh
└─ Não → continue

Projeto Node.js?
├─ Sim → verify-google-meta-tag.js
└─ Não → continue

Projeto TypeScript?
├─ Sim → verify-google-meta-tag.ts
└─ Não → use shell script
```

---

## Roadmap e Melhorias Futuras

Ideias para aprimoramentos:

- [ ] Suporte a proxies HTTP
- [ ] Retry automático com backoff
- [ ] Salvar histórico de verificações
- [ ] Dashboard web com visualização
- [ ] Suporte a webhooks (Slack, Discord)
- [ ] Comparação de múltiplos sites
- [ ] Performance benchmarking
- [ ] Suporte a SPF/DKIM/DMARC
- [ ] Cache local de resultados
- [ ] Exportar em JSON/CSV

---

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Meta tag não encontrada" | Aguarde 5min, verifique _document.tsx |
| "HTTP error" | Teste com `curl -I`, use `-k` ou `-L` flags |
| "Timeout" | Site lento, aumente timeout ou teste conectividade |
| "Código não corresponde" | Copie código correto do Google Search Console |

Veja `GOOGLE_META_VERIFICATION.md` para troubleshooting avançado.

---

## FAQ

**P: Qual script devo usar?**
R: Se tem dúvida, use `./verify-google-meta-tag-simple.sh`

**P: Posso usar em Windows?**
R: Sim, com WSL2 ou Git Bash

**P: Precisa de autenticação?**
R: Não, apenas faz GET público

**P: Funciona com sites privados?**
R: Não, apenas HTML público

**P: Posso modificar os scripts?**
R: Sim, são seus!

---

## Suporte

Para dúvidas:
1. Leia a documentação apropriada
2. Verifique EXEMPLOS_PRATICOS.md
3. Veja GOOGLE_META_VERIFICATION.md para troubleshooting

---

## Versão e Histórico

**Versão:** 1.0
**Data:** 30/04/2026
**Status:** Completo e pronto para usar

### Mudanças nesta versão
- Scripts shell (simples e completo)
- Scripts Node.js e TypeScript
- GitHub Actions workflow
- n8n workflow template
- Documentação completa
- 15 exemplos práticos
- Resumo técnico

---

## Como Começar (3 Passos)

### Passo 1: Leia (5 min)
Leia `QUICK_START.md`

### Passo 2: Teste (30 seg)
Execute:
```bash
./verify-google-meta-tag-simple.sh https://seu-site.com.br
```

### Passo 3: Integre (10 min)
Veja `EXEMPLOS_PRATICOS.md` para integração em seu workflow

---

**Fim do Índice**
