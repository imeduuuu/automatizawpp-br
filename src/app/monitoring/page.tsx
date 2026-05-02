'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMonitoringData();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMonitoringData() {
    try {
      const [metricsRes, healthRes, alertsRes] = await Promise.all([
        fetch('/api/monitoring/metrics'),
        fetch('/api/monitoring/health'),
        fetch('/api/monitoring/alerts')
      ]);

      if (!metricsRes.ok || !healthRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const metricsData = await metricsRes.json();
      const healthData = await healthRes.json();
      const alertsData = await alertsRes.json();

      setMetrics(metricsData);
      setHealth(healthData);
      setAlerts(alertsData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading && !metrics) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento do Sistema</h1>
          <p className="text-gray-600">Phase 5D: Observabilidade em tempo real</p>
        </div>
        <div className="text-sm text-gray-500">
          Atualizado: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Saúde Geral do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {health?.components?.map((component: any) => (
          <Card
            key={component.component}
            className={component.status === 'HEALTHY' ? 'border-green-500' : component.status === 'DEGRADED' ? 'border-yellow-500' : 'border-red-500'}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium capitalize">
                {component.component.replace('_', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    component.status === 'HEALTHY'
                      ? 'bg-green-500'
                      : component.status === 'DEGRADED'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm font-semibold capitalize">{component.status}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Latência: {component.responseTimeMs}ms
              </p>
              {component.errorMessage && (
                <p className="text-xs text-red-600 mt-1">{component.errorMessage}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métricas Principais */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Leads Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.leads.total}</div>
              <p className="text-xs text-gray-600 mt-1">
                Qualificados: {metrics.leads.qualified}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.emails.sent}</div>
              <p className="text-xs text-gray-600 mt-1">
                Taxa de abertura: {metrics.emails.openRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Chamadas Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.calls.logged}</div>
              <p className="text-xs text-gray-600 mt-1">
                Conectadas: {metrics.calls.connected}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">MRR Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.mrr.active.toFixed(2)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Taxa de conversão: {metrics.conversion.overall.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas Ativos */}
      {alerts.length > 0 && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              Alertas Ativos ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-3 rounded border ${
                  alert.severity === 'CRITICAL'
                    ? 'border-red-300 bg-red-50'
                    : alert.severity === 'ERROR'
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-yellow-300 bg-yellow-50'
                }`}
              >
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                <p className="text-xs text-gray-700 mt-1">{alert.description}</p>
                {alert.component && (
                  <p className="text-xs text-gray-600 mt-1">
                    Componente: {alert.component}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(alert.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Link para Log de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Visualizar Logs</CardTitle>
          <CardDescription>Acesse o histórico completo de eventos do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/monitoring/logs"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ver Logs de Eventos
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
