'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LogsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventType: '',
    severity: '',
    source: '',
    limit: 50
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  async function fetchEvents() {
    try {
      const query = new URLSearchParams();
      if (filters.eventType) query.append('eventType', filters.eventType);
      if (filters.severity) query.append('severity', filters.severity);
      if (filters.source) query.append('source', filters.source);
      query.append('limit', filters.limit.toString());

      const res = await fetch(`/api/monitoring/events?${query}`);
      if (!res.ok) throw new Error('Failed to fetch events');

      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'ERROR':
        return 'bg-orange-100 text-orange-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Log de Eventos</h1>
        <p className="text-gray-600">Histórico detalhado de eventos do sistema</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Evento</label>
              <input
                type="text"
                placeholder="Ex: lead.created"
                value={filters.eventType}
                onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Severidade</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="">Todas</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fonte</label>
              <select
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="">Todas</option>
                <option value="API">API</option>
                <option value="WEBHOOK">Webhook</option>
                <option value="CRON">Cron</option>
                <option value="AGENT">Agent</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantidade</label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {loading ? 'Carregando...' : `${events.length} Eventos`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum evento encontrado</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {events.map((event: any) => (
                <div
                  key={event.id}
                  className="p-3 border rounded hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {event.eventType}
                        </code>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${getSeverityColor(
                            event.severity
                          )}`}
                        >
                          {event.severity}
                        </span>
                        <span className="text-xs text-gray-600">{event.source}</span>
                      </div>
                      <h4 className="font-semibold text-sm">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                          {event.description}
                        </p>
                      )}
                      {event.metadata && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-gray-600">
                            Metadados
                          </summary>
                          <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(event.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
