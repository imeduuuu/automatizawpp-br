# Quick Start - Verificação de Meta Tag Google

## Para Usar AGORA (3 segundos)

### Opção 1: Shell Script (Mais Rápido)

```bash
# Copie e execute
./verify-google-meta-tag-simple.sh https://seu-site.com.br
```

Saída:
```
Verificando: https://seu-site.com.br

=== Verificação simples (curl + grep) ===
<meta name="google-site-verification" content="abc123..." />
✓ Meta tag encontrada!
```

---

### Opção 2: Comando Curl Puro (Sem script)

```bash
# Verificar se existe
curl -s https://seu-site.com.br | grep -i google-site-verification

# Extrair apenas o código
curl -s https://seu-site.com.br | grep -oP '(?<=content=")[^"]*'
```

---

### Opção 3: Script Completo com Validação

```bash
./verify-google-meta-tag.sh https://seu-site.com.br seu-codigo-google
```

---

## Exemplos Práticos

### Exemplo 1: Verificar seu site

```bash
./verify-google-meta-tag-simple.sh https://www.meusite.com.br
```

### Exemplo 2: Verificar e validar código

```bash
./verify-google-meta-tag.sh https://www.meusite.com.br "abcdef1234567890"
```

### Exemplo 3: Monitorar continuamente

```bash
watch -n 10 'curl -s https://meusite.com.br | grep -i google'
```

### Exemplo 4: Teste antes de commit

```bash
# Adicione ao package.json
"scripts": {
  "verify:google": "node verify-google-meta-tag.js https://seu-site.com.br seu-codigo"
}

# Execute
npm run verify:google
```

---

## Casos de Uso Reais

### Após Fazer Deploy
```bash
# Deploy para produção
npm run build && npm run export
rsync -avz ./out/ user@server:/var/www/site/

# Verificar se funcionou
./verify-google-meta-tag.sh https://seu-site-producao.com.br abc123
```

### Em GitHub Actions (Automático)
```yaml
# Após deploy automático
- name: Verify Google Meta Tag
  run: node verify-google-meta-tag.js ${{ secrets.DEPLOY_URL }}
```

### Com curl direto (1 linha)
```bash
curl -s https://seu-site.com.br | grep -i "google-site-verification" && echo "OK" || echo "FAIL"
```

---

## Problemas Comuns

### "Meta tag não encontrada"

**Solução rápida:**
1. Aguarde 5 minutos (cache)
2. Abra em navegador anônimo
3. Verifique se _document.tsx tem a meta tag
4. Refaça o deploy

### "Código não corresponde"

**Solução:**
1. Copie o código correto do Google Search Console
2. Atualize em _document.tsx
3. Faça rebuild: `npm run build`
4. Redeploy

### "Erro de conexão"

**Solução:**
1. Teste o site: `curl -I https://seu-site.com.br`
2. Se der erro SSL: use `-k` flag: `curl -k -s ...`
3. Se redirecionar: use `-L` flag: `curl -L -s ...`

---

## Verificação Rápida do Seu Projeto

Se você está em um projeto Next.js que usa Meta Tags:

```bash
# 1. Verificar arquivo local
grep -r "google-site-verification" src/ app/

# 2. Verificar após build
npm run build && npm run export
grep -r "google-site-verification" out/

# 3. Verificar em produção
./verify-google-meta-tag.sh https://seu-site.com.br
```

---

## Integration Rápida

### No seu deploy script (deploy.sh)

```bash
#!/bin/bash

# Deploy
npm run build
npm run export
rsync -avz ./out/ user@server:/var/www/site/

# Verificar
./verify-google-meta-tag.sh https://seu-site.com.br seu-codigo || {
    echo "Meta tag não encontrada!"
    exit 1
}

echo "✓ Deploy e verificação bem-sucedidos!"
```

### No seu package.json

```json
{
  "scripts": {
    "deploy": "npm run build && npm run export && ./scripts/deploy.sh",
    "verify:google": "node verify-google-meta-tag.js https://seu-site.com.br",
    "verify:google:prod": "node verify-google-meta-tag.js https://seu-site-prod.com.br"
  }
}
```

---

## Próximos Passos

1. **Teste agora:** `./verify-google-meta-tag-simple.sh https://seu-site.com.br`
2. **Integre em CI/CD:** Use GitHub Actions ou n8n
3. **Configure alerta:** Notifique se falhar
4. **Monitore:** Execute periodicamente

---

**Dúvidas?** Verifique `GOOGLE_META_VERIFICATION.md` para documentação completa.
