# Testing Guide - Public API

## Setup Local

### 1. Configurar Variável de Ambiente

```bash
# .env.local ou .env
PUBLIC_DASHBOARD_TOKEN="test_token_12345"
```

### 2. Iniciar Servidor

```bash
npm run dev
```

O servidor iniciará em `http://localhost:3000`

## Testes com cURL

### 1. Teste sem Token (deve falhar 401)

```bash
curl http://localhost:3000/api/public/leads
```

Esperado:
```json
{
  "error": "Invalid or missing token"
}
```

### 2. Teste com Token Inválido (deve falhar 401)

```bash
curl -H "Authorization: Bearer wrong_token" \
  http://localhost:3000/api/public/leads
```

### 3. Teste Válido: Listar Leads

```bash
TOKEN="test_token_12345"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/leads?page=1&limit=10"
```

Esperado:
```json
{
  "leads": [
    {
      "id": "lead_id_here",
      "fullName": "Nome do Lead",
      "email": "email@example.com",
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
  "pageSize": 10,
  "hasMore": true
}
```

### 4. Teste com Filtros

```bash
TOKEN="test_token_12345"

# Por status
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/leads?status=QUALIFIED"

# Por score
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/leads?score=50"

# Ambos
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/leads?status=QUALIFIED&score=50&page=1&limit=20"
```

### 5. Teste: Conversas

```bash
TOKEN="test_token_12345"

# Todas as conversas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/conversations"

# Por canal
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/conversations?channel=EMAIL"

# Por score mínimo do lead
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/conversations?minScore=50"
```

### 6. Teste: Analytics

```bash
TOKEN="test_token_12345"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/analytics"
```

Esperado:
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

## Testes com Postman

### 1. Criar Environment

```
{
  "API_BASE_URL": "http://localhost:3000",
  "PUBLIC_API_TOKEN": "test_token_12345"
}
```

### 2. Criar Requisições

#### GET /api/public/leads
```
GET {{API_BASE_URL}}/api/public/leads?page=1&limit=20
Authorization: Bearer {{PUBLIC_API_TOKEN}}
```

#### GET /api/public/conversations
```
GET {{API_BASE_URL}}/api/public/conversations
Authorization: Bearer {{PUBLIC_API_TOKEN}}
```

#### GET /api/public/analytics
```
GET {{API_BASE_URL}}/api/public/analytics
Authorization: Bearer {{PUBLIC_API_TOKEN}}
```

## Testes com JavaScript/Fetch

```javascript
const TOKEN = 'test_token_12345';
const BASE_URL = 'http://localhost:3000';

// Teste 1: Leads
async function testLeads() {
  const response = await fetch(`${BASE_URL}/api/public/leads?page=1&limit=5`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  const data = await response.json();
  console.log('Leads:', data);
}

// Teste 2: Conversations
async function testConversations() {
  const response = await fetch(`${BASE_URL}/api/public/conversations`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  const data = await response.json();
  console.log('Conversations:', data);
}

// Teste 3: Analytics
async function testAnalytics() {
  const response = await fetch(`${BASE_URL}/api/public/analytics`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  const data = await response.json();
  console.log('Analytics:', data);
}

// Rodar todos
Promise.all([testLeads(), testConversations(), testAnalytics()]);
```

## Testes com Insomnia

1. Criar nova coleção "Public API"
2. Criar variável de ambiente: `token` = `test_token_12345`
3. Criar requisições:

```
GET http://localhost:3000/api/public/leads
Header: Authorization: Bearer {% raw %}{{ token }}{% endraw %}
```

## Checklist de Testes

- [ ] Sem token retorna 401
- [ ] Token inválido retorna 401
- [ ] Token válido retorna dados
- [ ] Filtro status funciona
- [ ] Filtro score funciona
- [ ] Filtro channel (conversations) funciona
- [ ] Paginação funciona (page, limit)
- [ ] hasMore retorna verdadeiro quando há mais dados
- [ ] Analytics retorna todas as 6 métricas
- [ ] Timestamps estão em ISO 8601
- [ ] Nomes sem dados retornam "Sin nombre"
- [ ] Campos null são incluídos (não omitidos)

## Validação de Dados

### Leads retornados têm >= 30 dias?

```bash
TOKEN="test_token_12345"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/leads?limit=1" | jq '.leads[0].createdAt'

# Verificar: data deve estar >= 30 dias atrás
```

### Status != NEW?

```bash
TOKEN="test_token_12345"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/leads?limit=10" | jq '.leads[].status' | sort | uniq

# Esperado: Nenhum "NEW"
```

### Conversas têm leads pagos?

```bash
TOKEN="test_token_12345"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/conversations?limit=5" | jq '.conversations[].leadId'

# Verificar: Deve retornar IDs de leads existentes
```

## Performance

### Testar paginação com muitos dados

```bash
TOKEN="test_token_12345"

# Primeira página (rápido)
time curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/leads?page=1&limit=100"

# Última página (pode ser lento)
time curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/leads?page=1000&limit=100"
```

### Testar analytics com muitos leads

```bash
TOKEN="test_token_12345"

time curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/public/analytics"
```

## Logs para Debug

No servidor (terminal onde `npm run dev` está rodando), você verá logs como:

```
[public/leads] GET /api/public/leads - 200 - 45ms
[public/conversations] GET /api/public/conversations - 200 - 120ms
[public/analytics] GET /api/public/analytics - 200 - 250ms
```

Se houver erro:

```
[public/leads] Error: Database connection failed
```

## Dados de Teste

Se você não tem dados reais, pode criar dados de teste:

```bash
# Via Prisma
npx prisma db push

# Via seed script
npx prisma db seed
```

Ver `prisma/seed.ts` para entender o script de seed.

## Checklist de Deploy

Antes de deployar:

- [ ] `PUBLIC_DASHBOARD_TOKEN` definido em .env (produção)
- [ ] Endpoints funcionam localmente com token válido
- [ ] Sem logs sensíveis sendo exibidos
- [ ] CORS configurado se necessário
- [ ] Rate limiting considerado (se necessário)
- [ ] Documentação (PUBLIC_API.md) atualizada
- [ ] Frontend integrado e testado

## Problemas Comuns

### "error: "Invalid or missing token""
- Verifique se `PUBLIC_DASHBOARD_TOKEN` está correto no .env
- Confirme que header está correto: `Authorization: Bearer <token>`

### Dados vazios
- Verifique: há leads com status != NEW?
- Verifique: há leads com createdAt >= 30 dias?
- Query: `SELECT COUNT(*) FROM "Lead" WHERE status != 'NEW' AND "createdAt" >= NOW() - INTERVAL '30 days';`

### Erro 500
- Verifique logs do servidor
- Confirme que banco de dados está conectado
- Verifique query complexity se tempo limite for excedido

### Paginação não funciona
- Verifique limit: deve estar entre 1 e 100
- Verifique page: deve ser >= 1
- hasMore deve ser falso na última página
