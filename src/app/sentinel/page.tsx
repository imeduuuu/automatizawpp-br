'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { useUiCopy } from '@/components/ui/UiLanguageProvider';

type Stats = {
  total: number;
  unresolved: number;
  critical: number;
  last24h: number;
  lastHour: number;
  autoFixed: number;
  enabled: boolean;
  autoFixEnabled: boolean;
  scanInterval: number;
  model: string;
  sources: string[];
};

type SentinelError = {
  id: string;
  source: string;
  severity: string;
  title: string;
  rawError?: string;
  diagnosis?: string;
  fixApplied?: string;
  autoFixed: boolean;
  resolved: boolean;
  createdAt: string;
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

export default function SentinelPage() {
  const copy = useUiCopy();
  const [stats, setStats] = useState<Stats | null>(null);
  const [errors, setErrors] = useState<SentinelError[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, errorsRes] = await Promise.all([
        fetch('/api/sentinel/stats'),
        fetch(`/api/sentinel/errors?limit=100${filter === 'unresolved' ? '&resolved=false' : ''}${sourceFilter ? `&source=${sourceFilter}` : ''}`),
      ]);
      const statsData = await statsRes.json();
      const errorsData = await errorsRes.json();
      setStats(statsData);
      setErrors(errorsData.errors || errorsData || []);
    } finally {
      setLoading(false);
    }
  }, [filter, sourceFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runScan() {
    setScanning(true);
    try {
      await fetch('/api/sentinel/scan-now', { method: 'POST' });
      await load();
    } finally {
      setScanning(false);
    }
  }

  async function fixError(id: string) {
    await fetch('/api/sentinel/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <PageLayout
      title="Sentinel"
      actions={
        <button
          onClick={runScan}
          disabled={scanning}
          className="ds-button ds-button-primary"
        >
          {scanning ? copy.sentinel.scanning : copy.sentinel.scanNow}
        </button>
      }
    >
    <div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Stat label={copy.sentinel.statTotal} value={stats.total} />
          <Stat label={copy.sentinel.statUnresolved} value={stats.unresolved} accent={stats.unresolved > 0 ? 'text-orange-400' : ''} />
          <Stat label={copy.sentinel.statCritical} value={stats.critical} accent={stats.critical > 0 ? 'text-red-400' : ''} />
          <Stat label={copy.sentinel.stat24h} value={stats.last24h} />
          <Stat label={copy.sentinel.stat1h} value={stats.lastHour} />
          <Stat label={copy.sentinel.statAutoFixed} value={stats.autoFixed} accent="text-green-400" />
        </div>
      )}

      {stats && (
        <div className="flex items-center gap-3 mb-4 text-xs">
          <span className={`px-3 py-1 rounded-full border ${stats.enabled ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-700 text-gray-400'}`}>
            {stats.enabled ? `● ${copy.sentinel.statusActive}` : `○ ${copy.sentinel.statusInactive}`}
          </span>
          <span className={`px-3 py-1 rounded-full border ${stats.autoFixEnabled ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-gray-700 text-gray-400'}`}>
            Auto-fix: {stats.autoFixEnabled ? 'ON' : 'OFF'}
          </span>
          <span className="text-gray-500">Modelo: {stats.model}</span>
          <span className="text-gray-500">Intervalo: {stats.scanInterval}s</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter('unresolved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === 'unresolved' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          {copy.sentinel.filterUnresolved}
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          {copy.sentinel.filterAll}
        </button>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-300 border border-gray-700"
        >
          <option value="">{copy.sentinel.allSources}</option>
          {stats?.sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">{copy.sentinel.loading}</p>
        ) : errors.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">{copy.sentinel.noErrors}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">{copy.sentinel.colSeverity}</th>
                <th className="text-left px-4 py-3">{copy.sentinel.colSource}</th>
                <th className="text-left px-4 py-3">{copy.sentinel.colMessage}</th>
                <th className="text-left px-4 py-3">{copy.sentinel.colDate}</th>
                <th className="text-right px-4 py-3">{copy.sentinel.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((err) => (
                <tr key={err.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs border ${SEVERITY_COLOR[err.severity] || 'bg-gray-700 text-gray-300'}`}>
                      {err.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{err.source}</td>
                  <td className="px-4 py-3 max-w-md" title={err.rawError ?? err.title}>
                    <p className="text-gray-200 truncate">{err.title}</p>
                    {err.rawError && <p className="text-gray-500 text-xs truncate">{err.rawError}</p>}
                    {err.diagnosis && <p className="text-blue-400 text-xs truncate mt-1">↳ {err.diagnosis}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(err.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!err.resolved && (
                      <button
                        onClick={() => fixError(err.id)}
                        className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-xs"
                      >
                        {copy.sentinel.autoFix}
                      </button>
                    )}
                    {err.resolved && <span className="text-green-500 text-xs">{copy.sentinel.resolved}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </PageLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent || 'text-white'}`}>{value}</p>
    </div>
  );
}
