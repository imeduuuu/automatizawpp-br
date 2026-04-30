# Public API Implementation Summary

## Arquivos Criados

### 1. Middleware de Autenticação
**Arquivo:** `src/lib/public-auth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function validatePublicToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  const expectedToken = process.env.PUBLIC_DASHBOARD_TOKEN;
  if (!expectedToken || token !== expectedToken) return null;

  return token;
}

export function createUnauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}
```

### 2. Endpoint: /api/public/leads
**Arquivo:** `src/app/api/public/leads/route.ts`

Lista leads pagos com filtros.

**Features:**
- Filtra por status (status !== 'NEW')
- Filtra por data (createdAt >= 30 dias)
- Filtra por score mínimo
- Paginação (limit max: 100)
- Ordenação por score (DESC)

**Query Params:**
- `status` - Filtro por status
- `score` - Score mínimo
- `page` - Número da página
- `limit` - Itens por página

### 3. Endpoint: /api/public/conversations
**Arquivo:** `src/app/api/public/conversations/route.ts`

Lista conversas (emails, mensagens, calls) de leads pagos.

**Features:**
- Filtra conversas de leads pagos
- Filtro por canal (EMAIL, WEB_CHAT, VOICE)
- Filtro por score do lead associado
- Conta mensagens por conversa
- Ordena por lastMessageAt (DESC)

**Query Params:**
- `channel` - Filtro por canal
- `minScore` - Score mínimo do lead
- `page` - Número da página
- `limit` - Itens por página

### 4. Endpoint: /api/public/analytics
**Arquivo:** `src/app/api/public/analytics/route.ts`

Retorna KPIs agregados.

**Métricas:**
- `totalLeads` - Total de leads pagos
- `emailsSent` - Total de emails enviados
- `callsCompleted` - Calls completadas
- `averageScore` - Score médio
- `conversionRate` - % de leads convertidos (WON/CLOSED_WON/BOOKED)
- `responseTime` - Tempo médio de primeira resposta (horas)

### 5. Variável de Ambiente
**Arquivo:** `.env.example`

```
PUBLIC_DASHBOARD_TOKEN=""
```

Gere um token seguro:
```bash
openssl rand -base64 32
```

## Segurança

1. **Token-based auth:** Header `Authorization: Bearer <token>`
2. **Validação:** Middleware valida token em todas as requisições
3. **Data filtering:**
   - Apenas leads com status !== 'NEW'
   - Apenas dados de últimos 30 dias
   - Sem exposição de dados internos de agentes
4. **Erro handling:** 401 para unauthorized, 500 para erros

## Deployment

1. Configure `PUBLIC_DASHBOARD_TOKEN` no seu `.env` (produção)
2. Deploy via Vercel ou seu método atual
3. Teste endpoints com o script `test-public-api.sh`

## Exemplos de Uso

### Request com cURL
```bash
TOKEN="seu_token_aqui"

# Leads qualificados
curl "http://localhost:3000/api/public/leads?status=QUALIFIED&score=50" \
  -H "Authorization: Bearer $TOKEN"

# Conversas por email
curl "http://localhost:3000/api/public/conversations?channel=EMAIL" \
  -H "Authorization: Bearer $TOKEN"

# KPIs
curl "http://localhost:3000/api/public/analytics" \
  -H "Authorization: Bearer $TOKEN"
```

### Request com JavaScript/Fetch
```javascript
const TOKEN = 'seu_token_aqui';

// Leads
fetch('http://localhost:3000/api/public/leads?page=1', {
  headers: { 'Authorization': `Bearer ${TOKEN}` }
})
  .then(r => r.json())
  .then(data => console.log(data.leads));

// Analytics
fetch('http://localhost:3000/api/public/analytics', {
  headers: { 'Authorization': `Bearer ${TOKEN}` }
})
  .then(r => r.json())
  .then(data => console.log(data.stats));
```

## Estrutura de Diretórios

```
src/
  lib/
    public-auth.ts              (middleware)
  app/api/public/
    leads/
      route.ts
    conversations/
      route.ts
    analytics/
      route.ts
```

## Documentação Completa

Veja `PUBLIC_API.md` para documentação detalhada de cada endpoint.

## Próximos Passos

1. Configure `PUBLIC_DASHBOARD_TOKEN` em produção
2. Integre endpoints no frontend (automatizawpp.com)
3. Considere adicionar rate limiting em produção
4. Monitore performance das queries em analytics
5. Implemente refresh cache se necessário

## Notas Importantes

- Todos os timestamps em ISO 8601 (UTC)
- Sem dados sensíveis de agentes (nomes, histórico interno)
- Apenas leads e conversas de 30+ dias expostos
- Max limit: 100 itens por página
- Nomes sem dados: "Sin nombre"
