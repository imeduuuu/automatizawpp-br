'use client';

import { useState, useEffect } from 'react';

interface SEOMetrics {
  googleSearchConsole: {
    metrics: {
      totalClicks: number;
      totalImpressions: number;
      averageCTR: number;
      averagePosition: number;
      topQueries: Array<{
        query: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }>;
      topPages: Array<{
        page: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }>;
    };
    indexation: {
      isHealthy: boolean;
      indexedPages: number;
      excludedPages: number;
      errorPages: number;
      warnings: string[];
    };
  };
  organicTraffic: {
    organicSessions: number;
    organicUsers: number;
    conversionRate: number;
    avgSessionDuration: number;
    bounceRate: number;
    topPages: Array<{
      page: string;
      sessions: number;
      users: number;
      bounceRate: number;
    }>;
  };
  competitors: Array<{
    competitor: string;
    dominantKeywords: string[];
    estimatedMonthlyTraffic: number;
    backlinks: number;
    domainAuthority: number;
  }>;
  healthScore: {
    score: number;
    details: {
      technicalSEO: number;
      onPageSEO: number;
      contentQuality: number;
      backlinks: number;
      sitespeed: number;
    };
    recommendations: string[];
  };
  backlinks: Array<{
    source: string;
    anchor: string;
    authority: number;
    firstSeen: string;
    language: string;
  }>;
}

export default function SEODashboard() {
  const [data, setData] = useState<SEOMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('api_token') || process.env.NEXT_PUBLIC_API_TOKEN;
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/seo/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando dashboard SEO...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Erro ao carregar dashboard</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>Sem dados disponíveis</div>;
  }

  const gsc = data.googleSearchConsole;
  const health = data.healthScore;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Dashboard SEO</h1>

        {/* Resumo de Saúde */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Saúde do Site</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{health.score}/100</div>
              <div className="text-gray-600">Score Geral</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{health.details.technicalSEO}</div>
              <div className="text-gray-600">SEO Técnico</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{health.details.onPageSEO}</div>
              <div className="text-gray-600">On-Page SEO</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{health.details.contentQuality}</div>
              <div className="text-gray-600">Qualidade de Conteúdo</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{health.details.sitespeed}</div>
              <div className="text-gray-600">Velocidade do Site</div>
            </div>
          </div>
        </div>

        {/* Métricas GSC */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Google Search Console</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-2xl font-bold">{gsc.metrics.totalClicks}</div>
              <div className="text-gray-600">Cliques (28 dias)</div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-2xl font-bold">{gsc.metrics.totalImpressions}</div>
              <div className="text-gray-600">Impressões</div>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="text-2xl font-bold">{(gsc.metrics.averageCTR * 100).toFixed(2)}%</div>
              <div className="text-gray-600">CTR Médio</div>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="text-2xl font-bold">{gsc.metrics.averagePosition.toFixed(1)}</div>
              <div className="text-gray-600">Posição Média</div>
            </div>
          </div>

          {/* Status de Indexação */}
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Status de Indexação</h3>
            <div className={`p-4 rounded ${gsc.indexation.isHealthy ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <p className="font-bold mb-2">
                {gsc.indexation.isHealthy ? '✓ Status Saudável' : '⚠ Atenção Necessária'}
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-bold">{gsc.indexation.indexedPages}</span>
                  <div className="text-gray-600">Páginas Indexadas</div>
                </div>
                <div>
                  <span className="text-orange-600 font-bold">{gsc.indexation.excludedPages}</span>
                  <div className="text-gray-600">Excluídas</div>
                </div>
                <div>
                  <span className="text-red-600 font-bold">{gsc.indexation.errorPages}</span>
                  <div className="text-gray-600">Com Erros</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Queries */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Top Queries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Query</th>
                  <th className="text-center py-2 px-2">Posição</th>
                  <th className="text-center py-2 px-2">Cliques</th>
                  <th className="text-center py-2 px-2">Impressões</th>
                  <th className="text-center py-2 px-2">CTR</th>
                </tr>
              </thead>
              <tbody>
                {gsc.metrics.topQueries.map((query, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">{query.query}</td>
                    <td className="text-center py-2 px-2">{query.position.toFixed(1)}</td>
                    <td className="text-center py-2 px-2">{query.clicks}</td>
                    <td className="text-center py-2 px-2">{query.impressions}</td>
                    <td className="text-center py-2 px-2">{(query.ctr * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recomendações */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Recomendações de Otimização</h2>
          <ul className="space-y-2">
            {health.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-orange-500 mr-3">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
