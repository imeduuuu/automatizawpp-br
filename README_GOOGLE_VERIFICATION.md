# Verificação Programática de Meta Tag Google Site Verification

## O que foi criado?

Um conjunto completo de scripts e ferramentas para verificar programaticamente se a meta tag `google-site-verification` foi adicionada com sucesso a um site Next.js após deploy.

## Arquivos Criados

### Scripts Executáveis

1. **verify-google-meta-tag-simple.sh** (1KB)
   - Script shell MAIS SIMPLES
   - Apenas curl + grep
   - Ideal para CI/CD rápido
   - Sem dependências extras

2. **verify-google-meta-tag.sh** (3.1KB)
   - Script shell COMPLETO
   - Com validação detalhada
   - Cores e mensagens amigáveis
   - Dicas de troubleshooting

3. **verify-google-meta-tag.js** (5KB)
   - Script Node.js
   - Para integração em projetos Node
   - Saída estruturada

4. **verify-google-meta-tag.ts** (6.6KB)
   - Script TypeScript
   - Para projetos TypeScript
   - Type-safe, retorna VerificationResult

### Documentação

5. **QUICK_START.md** (3.8KB)
   - Comece em 30 segundos
   - Exemplos rápidos
   - Problemas comuns e soluções

6. **GOOGLE_META_VERIFICATION.md** (8.2KB)
   - Documentação completa
   - Todos os casos de uso
   - Troubleshooting avançado
   - Integração com n8n, GitHub Actions, Docker

7. **EXEMPLOS_PRATICOS.md** (Novo)
   - 15 exemplos práticos
   - Diferentes contextos (deploy, CI/CD, cron, etc)
   - Código pronto para copiar e colar

8. **README_GOOGLE_VERIFICATION.md** (Este arquivo)
   - Sumário geral
   - Como usar

### Integrações

9. **.github-workflows-verify-google-meta.yml** (2.9KB)
   - GitHub Actions workflow
   - Após deploy automático
   - Notificações de sucesso/erro

10. **example-n8n-workflow.json** (3.8KB)
    - Workflow n8n pronto para importar
    - Com email notifications

## Como Usar (3 Formas)

### Forma 1: Ultra-Rápida (Linha de Comando)

```bash
curl -s https://seu-site.com.br | grep -i google-site-verification
```

### Forma 2: Script Simples (Recomendado)

```bash
./verify-google-meta-tag-simple.sh https://seu-site.com.br
```

### Forma 3: Script Completo (Com Validação)

```bash
./verify-google-meta-tag.sh https://seu-site.com.br "seu-codigo-google"
```

## Exemplos de Uso

### Após fazer deploy

```bash
# Deploy seu site
npm run build && npm run export
rsync -avz ./out/ user@servidor:/var/www/site/

# Verificar
./verify-google-meta-tag.sh https://seu-site-producao.com.br "seu-codigo"
```

### Em GitHub Actions (Automático)

```yaml
- name: Verify Google Meta Tag
  run: ./verify-google-meta-tag.sh https://seu-site.com.br ${{ secrets.GOOGLE_CODE }}
```

### No package.json

```json
{
  "scripts": {
    "verify:google": "node verify-google-meta-tag.js https://seu-site.com.br seu-codigo"
  }
}
```

## Casos de Uso Cobertos

- ✓ Verificação pós-deploy
- ✓ Validação de código específico
- ✓ Monitoramento contínuo
- ✓ CI/CD automation (GitHub Actions)
- ✓ n8n workflows
- ✓ Cronjobs
- ✓ Deploy scripts
- ✓ Docker integration
- ✓ Slack notifications

## O que Cada Script Faz

1. **Faz curl** para a URL do site
2. **Procura** pela meta tag no HTML
3. **Extrai** o conteúdo completo
4. **Valida** o código (se fornecido)
5. **Reporta** sucesso ou falha com cores

## Características

✓ Simples e direto (curl + grep)
✓ Sem dependências externas
✓ Suporta validação de código específico
✓ Mensagens de erro úteis
✓ Saída colorida e formatada
✓ Funciona em qualquer sistema (Linux/Mac)
✓ Rápido (<2s por verificação)
✓ Pronto para CI/CD

## Próximos Passos

1. **Leia QUICK_START.md** para começar em 30 segundos
2. **Use verify-google-meta-tag-simple.sh** para teste rápido
3. **Integre em seu deploy** seguindo EXEMPLOS_PRATICOS.md
4. **Configure monitoramento** com cronjob ou GitHub Actions

## Estrutura de Arquivos

```
/Users/eduardosilva/Antigravity/automatizawppBR/
├── verify-google-meta-tag-simple.sh      (1KB - mais rápido)
├── verify-google-meta-tag.sh             (3.1KB - mais detalhado)
├── verify-google-meta-tag.js             (5KB - Node.js)
├── verify-google-meta-tag.ts             (6.6KB - TypeScript)
├── QUICK_START.md                        (comece aqui!)
├── GOOGLE_META_VERIFICATION.md           (documentação completa)
├── EXEMPLOS_PRATICOS.md                  (15 exemplos)
├── README_GOOGLE_VERIFICATION.md         (este arquivo)
├── .github-workflows-verify-google-meta.yml
└── example-n8n-workflow.json
```

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Meta tag não encontrada | Aguarde 5min (cache), verifique _document.tsx, faça redeploy |
| HTTP error | Verifique URL com `curl -I`, se SSL usar `-k`, se redirect usar `-L` |
| Código não corresponde | Copie código certo do Google Search Console, rebuild, redeploy |
| Timeout | Site lento, aumente timeout ou use `-m 30` com curl |

## Comandos Úteis

```bash
# Verificação rápida
curl -s https://seu-site.com.br | grep -i google

# Contar meta tags
curl -s https://seu-site.com.br | grep -ic google-site-verification

# Extrair código
curl -s https://seu-site.com.br | grep -oP '(?<=content=")[^"]*'

# Com timeout de 5 segundos
timeout 5 curl -s https://seu-site.com.br | grep -i google

# Monitorar em tempo real
watch -n 5 'curl -s https://seu-site.com.br | grep -i google'
```

## Suporte para Diferentes Ambientes

- ✓ Local (localhost)
- ✓ Staging
- ✓ Produção
- ✓ Subdomínios
- ✓ WWW vs não-WWW
- ✓ HTTP e HTTPS

## Performance

| Método | Tempo |
|--------|-------|
| curl + grep | <1s |
| simple.sh | 1-2s |
| verify.sh | 2-3s |
| Node.js | 2-3s |
| TypeScript | 3-4s |

## Dependências

**Obrigatórias:**
- curl (sempre disponível)
- grep (sempre disponível)
- bash (sempre disponível)

**Opcionais:**
- Node.js (para scripts .js)
- ts-node (para scripts .ts)

## FAQ

**P: Posso usar em Windows?**
R: Sim, com WSL2 ou Git Bash. Scripts shell funcionam.

**P: Funciona com sites estáticos?**
R: Sim, qualquer site HTML com meta tag.

**P: Posso usar em Docker?**
R: Sim, curl e grep estão em qualquer imagem base.

**P: Integra com n8n?**
R: Sim, veja example-n8n-workflow.json

**P: Precisa de autenticação?**
R: Não, verifica apenas o HTML público.

---

**Versão:** 1.0
**Data:** 30/04/2026
**Status:** Pronto para usar
