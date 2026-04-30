# Public Dashboard API

API endpoints públicos para expor dados do Sales OS para a página pública automatizawpp.com.

## Autenticação

Todos os endpoints requerem token de autenticação no header:

```bash
Authorization: Bearer <PUBLIC_DASHBOARD_TOKEN>
```

O token deve ser definido na variável de ambiente `PUBLIC_DASHBOARD_TOKEN`.

## Endpoints

### 1. GET /api/public/leads

Lista leads pagos com filtros de status, score e paginação.

**Restrições:**
- Apenas leads com `status !== 'NEW'`
- Apenas leads com `createdAt >= 30 dias atrás`

**Query Parameters:**
- `status` (opcional): Filtro por status do lead (ex: QUALIFIED, CLOSED_WON, WON)
- `score` (opcional): Filtro por leadScoreValue mínima (default: 0)
- `page` (opcional): Número da página (default: 1)
- `limit` (opcional): Itens por página (default: 20, max: 100)

**Exemplo de Request:**

```bash
curl -X GET "http://localhost:3000/api/public/leads?status=QUALIFIED&score=50&page=1&limit=20" \
  -H "Authorization: Bearer seu_token_aqui"
```

**Exemplo de Response:**

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
  "total": 145,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

### 2. GET /api/public/conversations

Lista conversas (emails, mensagens, calls) de leads pagos.

**Restrições:**
- Apenas conversas de leads com `status !== 'NEW'`
- Apenas conversas de leads com `createdAt >= 30 dias atrás`

**Query Parameters:**
- `channel` (opcional): Filtro por canal (EMAIL, WEB_CHAT, VOICE, etc.)
- `minScore` (opcional): Filtro por leadScoreValue mínima do lead associado (default: 0)
- `page` (opcional): Número da página (default: 1)
- `limit` (opcional): Itens por página (default: 20, max: 100)

**Exemplo de Request:**

```bash
curl -X GET "http://localhost:3000/api/public/conversations?channel=EMAIL&minScore=50&page=1" \
  -H "Authorization: Bearer seu_token_aqui"
```

**Exemplo de Response:**

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

### 3. GET /api/public/analytics

Retorna resumo de KPIs agregados do dashboard.

**Restrições:**
- Apenas métricas de leads com `status !== 'NEW'`
- Apenas métricas de leads com `createdAt >= 30 dias atrás`

**Query Parameters:** Nenhum

**Exemplo de Request:**

```bash
curl -X GET "http://localhost:3000/api/public/analytics" \
  -H "Authorization: Bearer seu_token_aqui"
```

**Exemplo de Response:**

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

**Explicação dos campos:**
- `totalLeads`: Total de leads pagos (status != NEW, últimos 30 dias)
- `emailsSent`: Total de emails enviados
- `callsCompleted`: Total de calls completadas (status: CONNECTED, INTERESTED, BOOKED, QUALIFIED)
- `averageScore`: Score médio dos leads (leadScoreValue)
- `conversionRate`: Percentual de leads convertidos (WON, CLOSED_WON, BOOKED) / total
- `responseTime`: Tempo médio de primeira resposta em horas

## Erros

### 401 Unauthorized

```json
{
  "error": "Invalid or missing token"
}
```

### 500 Server Error

```json
{
  "error": "Error message"
}
```

## Configuração

1. Gere um token seguro (ex: `openssl rand -base64 32`)
2. Defina em `.env`:
   ```
   PUBLIC_DASHBOARD_TOKEN="seu_token_gerado"
   ```
3. Redeploy o aplicativo

## Segurança

- Tokens devem ser rotacionados regularmente
- Recomenda-se usar HTTPS em produção
- O token não expõe dados sensíveis de agentes internos (nomes de usuários, histórico interno, etc.)
- Apenas leads e conversas de 30+ dias são expostos para evitar dados muito frescos/sensíveis

## Rate Limiting

Atualmente não há rate limiting implementado. Considere adicionar em produção se necessário.

## Notas

- Todos os timestamps são retornados em ISO 8601 (UTC)
- Nomes de leads sem dados são retornados como "Sin nombre"
- Campos nulos são retornados como `null` em vez de omitidos
