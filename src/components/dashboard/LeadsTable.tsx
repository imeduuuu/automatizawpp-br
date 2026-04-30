'use client';

import { useState } from 'react';

interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: string;
  lastActionAt?: string;
  createdAt: string;
}

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
}

type SortField = 'name' | 'status' | 'lastActionAt' | 'createdAt';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  NEW:         { label: 'Novo',       color: '#00FF41', bg: 'rgba(0,255,65,.12)' },
  ENGAGED:     { label: 'Engajado',   color: '#60CFFF', bg: 'rgba(96,207,255,.12)' },
  QUALIFIED:   { label: 'Qualificado',color: '#FFD060', bg: 'rgba(255,208,96,.12)' },
  CLOSED_WON:  { label: 'Ganho',      color: '#00FF41', bg: 'rgba(0,255,65,.2)' },
  CLOSED_LOST: { label: 'Perdido',    color: '#FF6060', bg: 'rgba(255,96,96,.12)' },
};

export function LeadsTable({ leads, loading }: LeadsTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sorted = [...leads].sort((a, b) => {
    const av = (a[sortField] ?? '').toLowerCase();
    const bv = (b[sortField] ?? '').toLowerCase();
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const rows = sorted.slice((page - 1) * perPage, page * perPage);

  const thStyle: React.CSSProperties = {
    padding: '12px 20px', textAlign: 'left', fontSize: 11,
    fontWeight: 800, color: '#B0B0B0', textTransform: 'uppercase',
    letterSpacing: '.1em', borderBottom: '1px solid rgba(0,255,65,.14)',
    background: 'rgba(0,255,65,.03)', cursor: 'pointer', userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '13px 20px', fontSize: 13, color: '#d0d0d0',
    borderBottom: '1px solid rgba(255,255,255,.04)',
  };

  if (loading && leads.length === 0) {
    return (
      <div style={{ border: '1px solid rgba(0,255,65,.18)', borderRadius: 18, padding: '40px 0', textAlign: 'center', color: '#B0B0B0', background: 'rgba(0,255,65,.03)' }}>
        Carregando leads...
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div style={{ border: '1px solid rgba(0,255,65,.18)', borderRadius: 18, padding: '40px 0', textAlign: 'center', color: '#B0B0B0', background: 'rgba(0,255,65,.03)' }}>
        Nenhum lead encontrado
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid rgba(0,255,65,.18)', borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.01))' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {(['name','status','lastActionAt','createdAt'] as SortField[]).map((f, i) => (
                <th key={f} style={thStyle} onClick={() => handleSort(f)}>
                  {['Nome','Status','Última Ação','Criado em'][i]}
                  {' '}{sortField === f ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
              ))}
              <th style={{ ...thStyle, cursor: 'default' }}>Email</th>
              <th style={{ ...thStyle, cursor: 'default' }}>Telefone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => {
              const st = STATUS_STYLE[lead.status] ?? { label: lead.status, color: '#B0B0B0', bg: 'rgba(255,255,255,.06)' };
              return (
                <tr key={lead.id}
                  style={{ transition: '.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,65,.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...tdStyle, color: '#fff', fontWeight: 700 }}>{lead.name}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, color: st.color, background: st.bg, border: `1px solid ${st.color}40` }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={tdStyle}>{lead.lastActionAt ? new Date(lead.lastActionAt).toLocaleDateString('pt-BR') : '—'}</td>
                  <td style={tdStyle}>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td style={tdStyle}>{lead.email || '—'}</td>
                  <td style={tdStyle}>{lead.phone || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ borderTop: '1px solid rgba(0,255,65,.12)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#B0B0B0', fontSize: 13 }}>
          <span>Página {page} de {totalPages} · {sorted.length} leads</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['← Anterior', -1], ['Próxima →', 1]].map(([label, d]) => (
              <button key={String(label)}
                onClick={() => setPage(p => Math.max(1, Math.min(totalPages, p + Number(d))))}
                style={{ padding: '6px 14px', border: '1px solid rgba(0,255,65,.3)', borderRadius: 999, background: 'transparent', color: '#00FF41', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
