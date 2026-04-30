# Public Dashboard API - Comece Aqui

## O que foi criado?

Uma API pública com **3 endpoints** para expor dados do Sales OS no automatizawpp.com.

Tempo total: **~30 minutos** de desenvolvimento
Status: **PRONTO PARA USAR**

---

## 3 Endpoints Implementados

### 1. GET /api/public/leads
Lista leads pagos (status != NEW, últimos 30 dias)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.automatizawpp.com/api/public/leads?status=QUALIFIED&score=50"
```

### 2. GET /api/public/conversations
Lista conversas de leads pagos

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.automatizawpp.com/api/public/conversations?channel=EMAIL"
```

### 3. GET /api/public/analytics
Retorna 6 KPIs agregados

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.automatizawpp.com/api/public/analytics"
```

---

## Primeiros Passos (5 minutos)

### 1. Gerar Token
```bash
openssl rand -base64 32
# Exemplo output: "abc123def456ghi789jkl..."
```

### 2. Configurar .env
```bash
PUBLIC_DASHBOARD_TOKEN="abc123def456ghi789jkl..."
```

### 3. Testar Localmente
```bash
npm run dev

# Em outro terminal:
TOKEN="abc123def456ghi789jkl..."
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/public/leads
```

### 4. Pronto!
Você tem 3 endpoints funcionando.

---

## Arquivos Criados

### Código (4 arquivos)
```
src/lib/public-auth.ts                          → Middleware de auth
src/app/api/public/leads/route.ts              → GET /api/public/leads
src/app/api/public/conversations/route.ts      → GET /api/public/conversations
src/app/api/public/analytics/route.ts          → GET /api/public/analytics
```

### Documentação (7 arquivos)
```
PUBLIC_API.md                 → Documentação técnica completa
FRONTEND_INTEGRATION.md       → Como integrar no React
TESTING_GUIDE.md              → Como testar (cURL, Postman, JS)
READY_TO_COPY.md              → Código pronto para copiar
IMPLEMENTATION_SUMMARY.md     → Resumo técnico
PUBLIC_API_INDEX.md           → Índice de navegação
PUBLIC_API_SUMMARY.txt        → Visão geral executiva
```

### Testes
```
test-public-api.sh            → Script bash para testar
```

### Configuração
```
.env.example                  → Adicionado: PUBLIC_DASHBOARD_TOKEN
```

---

## Guia Rápido por Caso de Uso

### Caso 1: Quero testar agora
```
1. Leia: TESTING_GUIDE.md
2. Execute: ./test-public-api.sh (após configurar token)
3. Valide: responses no terminal
```

### Caso 2: Quero integrar no frontend React
```
1. Leia: FRONTEND_INTEGRATION.md
2. Copie: usePublicAPI hook
3. Use: componentes LeadsTable, Dashboard, Conversations
```

### Caso 3: Quero usar a API em outro projeto
```
1. Leia: READY_TO_COPY.md
2. Copie: JavaScript fetch functions ou Python client
3. Adapte: para seu caso de uso
```

### Caso 4: Quero documentação técnica
```
Leia: PUBLIC_API.md
→ Endpoints, query params, responses, erros
```

### Caso 5: Quero deployar em produção
```
1. Configure PUBLIC_DASHBOARD_TOKEN em variáveis de produção
2. Deploy normalmente (npm run build && npm start)
3. Teste endpoints em produção
4. Integre no automatizawpp.com
```

---

## Estrutura de Dados Retornada

### GET /api/public/leads
```json
{
  "leads": [
    {
      "id": "lead_123",
      "fullName": "João Silva",
      "email": "joao@example.com",
      "phone": "+55123456789",
      "source": "google_ads",
      "status": "QUALIFIED",
      "leadScoreValue": 75,
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-30T15:30:00Z"
    }
  ],
  "total": 245,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

### GET /api/public/conversations
```json
{
  "conversations": [
    {
      "id": "conv_456",
      "leadId": "lead_123",
      "channel": "EMAIL",
      "subject": "Proposta de Projeto",
      "messageCount": 5,
      "lastMessageAt": "2026-04-30T14:20:00Z"
    }
  ],
  "total": 320,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

### GET /api/public/analytics
```json
{
  "stats": {
    "totalLeads": 245,
    "emailsSent": 1203,
    "callsCompleted": 87,
    "averageScore": 62.45,
    "conversionRate": 23.67,
    "responseTime": 4.5
  }
}
```

---

## Segurança

- ✅ Autenticação por token Bearer
- ✅ Validação em middleware
- ✅ Sem exposição de dados sensíveis
- ✅ Apenas dados de 30+ dias
- ✅ Status NEW excluído
- ✅ Error handling apropriado

---

## Limitações & Considerações

| Item | Atual | Consideração |
|------|-------|--------------|
| Rate Limiting | Não | Implementar em produção |
| Cache | Não | Considere Redis se muitas requisições |
| CORS | Básico | Configure conforme necessário |
| Paginação | Até 100 itens | Max para performance |
| Autenticação | Token simples | Considere JWT/OAuth2 em futuro |

---

## Próximos Passos (Ordem)

1. **Hoje:** Teste localmente (TESTING_GUIDE.md)
2. **Hoje:** Configure token em produção
3. **Amanhã:** Integre no frontend (FRONTEND_INTEGRATION.md)
4. **Amanhã:** Deploy para produção
5. **Próxima semana:** Monitore e otimize

---

## Contato/Troubleshooting

### Erro: "Invalid or missing token"
→ Verifique: PUBLIC_DASHBOARD_TOKEN no .env
→ Verifique: Header correto `Authorization: Bearer <token>`

### Erro: Sem dados retornados
→ Verifique: há leads com status != NEW?
→ Verifique: há leads com createdAt >= 30 dias?

### Erro 500
→ Verifique logs do servidor
→ Confirme: banco de dados está conectado

Para mais: Veja **TESTING_GUIDE.md**

---

## Checklist de Deploy

- [ ] PUBLIC_DASHBOARD_TOKEN gerado e salvo
- [ ] Token configurado em .env (dev)
- [ ] Endpoints testados localmente
- [ ] Token configurado em variáveis de produção
- [ ] Deploy realizado
- [ ] Endpoints testados em produção
- [ ] Frontend integrado
- [ ] Monitoramento configurado

---

## Arquivos de Referência

| Arquivo | Para quem | Quando ler |
|---------|-----------|-----------|
| **START_HERE.md** | Todos | Agora |
| **TESTING_GUIDE.md** | Desenvolvedores | Após setup |
| **READY_TO_COPY.md** | Desenvolvedores | Quando codificar |
| **FRONTEND_INTEGRATION.md** | Frontend devs | Para integrar no React |
| **PUBLIC_API.md** | Arquitetos/Tech leads | Para referência técnica |
| **PUBLIC_API_INDEX.md** | Todos | Para navegação |

---

## Pronto?

1. Configure token: `openssl rand -base64 32`
2. Adicione ao .env: `PUBLIC_DASHBOARD_TOKEN="..."`
3. Teste: `npm run dev` → veja TESTING_GUIDE.md
4. Integre: veja FRONTEND_INTEGRATION.md
5. Deploy: configure token em produção

**Bom desenvolvimento!**

---

Última atualização: 2026-04-30
Status: PRONTO PARA USAR
