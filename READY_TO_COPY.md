# Ready-to-Copy Code Snippets

Código pronto para copiar e usar nos seus projetos.

## 1. cURL - Teste os Endpoints

### Setup token (substitua seu_token_aqui)
```bash
TOKEN="seu_token_aqui"
BASE_URL="https://sales-os.automatizawpp.com"
```

### Listar Leads
```bash
curl -X GET "$BASE_URL/api/public/leads?status=QUALIFIED&score=50&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Listar Conversas
```bash
curl -X GET "$BASE_URL/api/public/conversations?channel=EMAIL&minScore=50&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Obter Analytics
```bash
curl -X GET "$BASE_URL/api/public/analytics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## 2. JavaScript Fetch - Cliente Web

```javascript
const API_TOKEN = 'seu_token_aqui';
const BASE_URL = 'https://sales-os.automatizawpp.com';

async function fetchPublicLeads(status = null, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('page', page);
  params.append('limit', limit);

  const response = await fetch(`${BASE_URL}/api/public/leads?${params}`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

async function fetchPublicConversations(channel = null, minScore = 0) {
  const params = new URLSearchParams();
  if (channel) params.append('channel', channel);
  params.append('minScore', minScore);

  const response = await fetch(`${BASE_URL}/api/public/conversations?${params}`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

async function fetchPublicAnalytics() {
  const response = await fetch(`${BASE_URL}/api/public/analytics`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Uso:
async function main() {
  try {
    const leads = await fetchPublicLeads('QUALIFIED', 1, 10);
    console.log('Leads:', leads);

    const conversations = await fetchPublicConversations('EMAIL');
    console.log('Conversations:', conversations);

    const analytics = await fetchPublicAnalytics();
    console.log('Analytics:', analytics);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

## 3. React Hook - usePublicAPI

```typescript
import { useState, useEffect } from 'react';

interface UsePublicAPIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  skip?: boolean; // Skip fetching
}

interface UsePublicAPIResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePublicAPI<T = any>(
  endpoint: string,
  options?: UsePublicAPIOptions
): UsePublicAPIResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<string | null>(null);

  const token = process.env.REACT_APP_PUBLIC_API_TOKEN;
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://sales-os.automatizawpp.com';

  const refetch = async () => {
    if (options?.skip || !token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: options?.method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: options?.body ? JSON.stringify(options.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [endpoint, token, baseUrl]);

  return { data, loading, error, refetch };
}
```

## 4. React Component - Leads Table

```typescript
import React, { useState } from 'react';
import { usePublicAPI } from '@/hooks/usePublicAPI';

interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  leadScoreValue: number;
  createdAt: string;
  updatedAt: string;
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export function PublicLeadsTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const queryString = `/api/public/leads?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`;
  const { data, loading, error, refetch } = usePublicAPI<LeadsResponse>(queryString);

  if (loading) return <div className="p-4">Carregando leads...</div>;
  if (error) return <div className="p-4 text-red-600">Erro: {error}</div>;
  if (!data) return <div className="p-4">Sem dados</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Leads</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filtrar por Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded"
        >
          <option value="">Todos</option>
          <option value="QUALIFIED">Qualificado</option>
          <option value="CLOSED_WON">Fechado Ganho</option>
          <option value="PROPOSAL_SENT">Proposta Enviada</option>
          <option value="NEGOTIATION">Negociação</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Nome</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Telefone</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-center">Score</th>
              <th className="border p-2 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {data.leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="border p-2">{lead.fullName}</td>
                <td className="border p-2">{lead.email}</td>
                <td className="border p-2">{lead.phone}</td>
                <td className="border p-2">{lead.status}</td>
                <td className="border p-2 text-center">{lead.leadScoreValue}</td>
                <td className="border p-2">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>Total: {data.total} leads</div>

        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="px-3 py-2">Página {data.page}</span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={!data.hasMore}
            className="px-3 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 5. React Component - Analytics Dashboard

```typescript
import React from 'react';
import { usePublicAPI } from '@/hooks/usePublicAPI';

interface Stats {
  totalLeads: number;
  emailsSent: number;
  callsCompleted: number;
  averageScore: number;
  conversionRate: number;
  responseTime: number;
}

interface AnalyticsResponse {
  stats: Stats;
}

export function PublicAnalyticsDashboard() {
  const { data, loading, error } = usePublicAPI<AnalyticsResponse>('/api/public/analytics');

  if (loading) return <div className="p-4">Carregando KPIs...</div>;
  if (error) return <div className="p-4 text-red-600">Erro: {error}</div>;
  if (!data) return <div className="p-4">Sem dados</div>;

  const { stats } = data;

  const StatCard = ({ title, value, unit = '' }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      {unit && <p className="text-gray-500 text-sm">{unit}</p>}
    </div>
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total de Leads"
          value={stats.totalLeads}
          unit="Últimos 30 dias"
        />

        <StatCard
          title="Emails Enviados"
          value={stats.emailsSent}
        />

        <StatCard
          title="Chamadas Completadas"
          value={stats.callsCompleted}
        />

        <StatCard
          title="Score Médio"
          value={stats.averageScore}
          unit="/100"
        />

        <StatCard
          title="Taxa de Conversão"
          value={`${stats.conversionRate.toFixed(1)}%`}
        />

        <StatCard
          title="Tempo de Resposta"
          value={stats.responseTime.toFixed(1)}
          unit="horas"
        />
      </div>
    </div>
  );
}
```

## 6. Python - Requisições com Requests

```python
import requests
import json
from typing import Optional, Dict, Any

class PublicAPIClient:
    def __init__(self, api_token: str, base_url: str = "https://sales-os.automatizawpp.com"):
        self.api_token = api_token
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

    def get_leads(
        self,
        status: Optional[str] = None,
        score: Optional[int] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get leads with filters"""
        params = {"page": page, "limit": limit}
        if status:
            params["status"] = status
        if score is not None:
            params["score"] = score

        response = requests.get(
            f"{self.base_url}/api/public/leads",
            params=params,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def get_conversations(
        self,
        channel: Optional[str] = None,
        min_score: Optional[int] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get conversations with filters"""
        params = {"page": page, "limit": limit}
        if channel:
            params["channel"] = channel
        if min_score is not None:
            params["minScore"] = min_score

        response = requests.get(
            f"{self.base_url}/api/public/conversations",
            params=params,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def get_analytics(self) -> Dict[str, Any]:
        """Get analytics/KPIs"""
        response = requests.get(
            f"{self.base_url}/api/public/analytics",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()


# Uso:
if __name__ == "__main__":
    client = PublicAPIClient(api_token="seu_token_aqui")

    # Leads
    leads = client.get_leads(status="QUALIFIED", score=50)
    print("Leads:", json.dumps(leads, indent=2))

    # Conversations
    conversations = client.get_conversations(channel="EMAIL")
    print("Conversations:", json.dumps(conversations, indent=2))

    # Analytics
    analytics = client.get_analytics()
    print("Analytics:", json.dumps(analytics, indent=2))
```

## 7. Variáveis de Ambiente - .env

```bash
# Production
PUBLIC_DASHBOARD_TOKEN="seu_token_seguro_aqui"

# Frontend
NEXT_PUBLIC_API_BASE_URL="https://sales-os.automatizawpp.com"
NEXT_PUBLIC_API_TOKEN="seu_token_seguro_aqui"

# Python Client
API_BASE_URL="https://sales-os.automatizawpp.com"
API_TOKEN="seu_token_seguro_aqui"
```

## 8. Gerar Token Seguro

```bash
# OpenSSL (recomendado)
openssl rand -base64 32

# Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

Todos esses snippets estão prontos para copiar. Substitua `seu_token_aqui` pelo token gerado e teste!
