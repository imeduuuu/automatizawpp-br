# Frontend Integration Guide

Como integrar os endpoints públicos da API no frontend (automatizawpp.com).

## Setup Básico

### 1. Variáveis de Ambiente (Frontend)
Adicione ao seu `.env.local` do frontend:

```env
NEXT_PUBLIC_API_BASE_URL=https://sales-os.automatizawpp.com
NEXT_PUBLIC_API_TOKEN=seu_token_aqui
```

### 2. Hook React para Fetchs

Crie um hook para facilitar requisições:

```typescript
// hooks/usePublicAPI.ts
import { useState, useEffect } from 'react';

interface FetchOptions {
  method?: string;
  body?: any;
}

export function usePublicAPI<T>(endpoint: string, options?: FetchOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`,
          {
            method: options?.method || 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: options?.body ? JSON.stringify(options.body) : undefined
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}
```

### 3. Componente: Leads Table

```typescript
// components/PublicLeadsTable.tsx
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
  const [status, setStatus] = useState<string | null>(null);
  
  const endpoint = `/api/public/leads?page=${page}&limit=20${status ? `&status=${status}` : ''}`;
  const { data, loading, error } = usePublicAPI<LeadsResponse>(endpoint);

  if (loading) return <div>Carregando leads...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!data) return <div>Sem dados</div>;

  return (
    <div>
      <h2>Leads Qualificados</h2>
      
      <div>
        <select onChange={(e) => setStatus(e.target.value || null)}>
          <option value="">Todos os Status</option>
          <option value="QUALIFIED">Qualificado</option>
          <option value="CLOSED_WON">Fechado Ganho</option>
          <option value="PROPOSAL_SENT">Proposta Enviada</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Score</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {data.leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.fullName}</td>
              <td>{lead.email}</td>
              <td>{lead.phone}</td>
              <td>{lead.status}</td>
              <td>{lead.leadScoreValue}</td>
              <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        Total: {data.total} leads
      </div>

      <div>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Anterior
        </button>
        <span>Página {data.page}</span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={!data.hasMore}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
```

### 4. Componente: Analytics Dashboard

```typescript
// components/PublicAnalyticsDashboard.tsx
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

  if (loading) return <div>Carregando KPIs...</div>;
  if (error) return <div>Erro ao carregar dados: {error}</div>;
  if (!data) return <div>Sem dados disponíveis</div>;

  const { stats } = data;

  return (
    <div className="analytics-grid">
      <div className="stat-card">
        <h3>Leads</h3>
        <p className="stat-value">{stats.totalLeads}</p>
        <p className="stat-label">Últimos 30 dias</p>
      </div>

      <div className="stat-card">
        <h3>Emails Enviados</h3>
        <p className="stat-value">{stats.emailsSent}</p>
      </div>

      <div className="stat-card">
        <h3>Chamadas Completadas</h3>
        <p className="stat-value">{stats.callsCompleted}</p>
      </div>

      <div className="stat-card">
        <h3>Score Médio</h3>
        <p className="stat-value">{stats.averageScore}</p>
        <p className="stat-subtext">/100</p>
      </div>

      <div className="stat-card">
        <h3>Taxa de Conversão</h3>
        <p className="stat-value">{stats.conversionRate.toFixed(1)}%</p>
      </div>

      <div className="stat-card">
        <h3>Tempo de Resposta</h3>
        <p className="stat-value">{stats.responseTime.toFixed(1)}</p>
        <p className="stat-subtext">horas</p>
      </div>
    </div>
  );
}
```

### 5. Componente: Conversations Feed

```typescript
// components/PublicConversationsFeed.tsx
import { usePublicAPI } from '@/hooks/usePublicAPI';

interface Conversation {
  id: string;
  leadId: string;
  channel: string;
  subject: string;
  messageCount: number;
  lastMessageAt: string;
}

interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export function PublicConversationsFeed() {
  const [channel, setChannel] = useState<string | null>(null);
  const endpoint = `/api/public/conversations?page=1&limit=20${channel ? `&channel=${channel}` : ''}`;
  const { data, loading, error } = usePublicAPI<ConversationsResponse>(endpoint);

  if (loading) return <div>Carregando conversas...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!data) return <div>Sem dados</div>;

  return (
    <div>
      <h2>Conversas Recentes</h2>
      
      <select onChange={(e) => setChannel(e.target.value || null)}>
        <option value="">Todos os Canais</option>
        <option value="EMAIL">Email</option>
        <option value="WEB_CHAT">Chat Web</option>
        <option value="VOICE">Chamadas</option>
      </select>

      <div className="conversations-list">
        {data.conversations.map((conv) => (
          <div key={conv.id} className="conversation-item">
            <div className="conversation-header">
              <h4>{conv.subject || 'Sem assunto'}</h4>
              <span className="channel-badge">{conv.channel}</span>
            </div>
            <div className="conversation-meta">
              <span>{conv.messageCount} mensagens</span>
              <span>{new Date(conv.lastMessageAt || '').toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Exemplo: Página Completa

```typescript
// pages/public-dashboard.tsx
import { PublicLeadsTable } from '@/components/PublicLeadsTable';
import { PublicAnalyticsDashboard } from '@/components/PublicAnalyticsDashboard';
import { PublicConversationsFeed } from '@/components/PublicConversationsFeed';

export default function PublicDashboard() {
  return (
    <div className="public-dashboard">
      <h1>Sales OS - Dashboard Público</h1>
      
      <section className="analytics-section">
        <PublicAnalyticsDashboard />
      </section>

      <section className="leads-section">
        <h2>Leads</h2>
        <PublicLeadsTable />
      </section>

      <section className="conversations-section">
        <PublicConversationsFeed />
      </section>
    </div>
  );
}
```

## Segurança

1. **Token em .env.local**: Nunca commita tokens em repositório
2. **HTTPS em produção**: Sempre use HTTPS para requisições
3. **Validação CORS**: Configure CORS se necessário
4. **Rate limiting**: Considere implementar no backend

## Troubleshooting

### Erro 401 Unauthorized
- Verifique se `NEXT_PUBLIC_API_TOKEN` está correto
- Confirme que `PUBLIC_DASHBOARD_TOKEN` foi setado no backend

### Erro CORS
- Configure headers CORS no Next.js backend
- Adicione `.env` variable: `NEXT_PUBLIC_API_BASE_URL`

### Dados vazios
- Verifique se há leads com status != NEW e createdAt >= 30 dias
- Confira os filtros usados

## Performance

- Cache: Implemente SWR ou React Query para cachear dados
- Pagination: Use paginação para grandes datasets
- Debouncing: Para filtros em tempo real

Exemplo com SWR:

```typescript
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url, {
  headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}` }
}).then(r => r.json());

export function LeadsWithCache() {
  const { data } = useSWR('/api/public/leads', fetcher);
  // ...
}
```
