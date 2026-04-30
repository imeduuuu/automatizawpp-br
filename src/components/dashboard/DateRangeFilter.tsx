'use client';

interface DateRangeFilterProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onExportCSV: () => void;
}

const btnBase: React.CSSProperties = {
  padding: '7px 14px', fontSize: 12, fontWeight: 700,
  border: '1px solid rgba(0,255,65,.25)', borderRadius: 999,
  background: 'transparent', color: '#B0B0B0', cursor: 'pointer', transition: '.2s',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', fontSize: 12,
  background: '#0a0a0a', border: '1px solid rgba(0,255,65,.25)',
  borderRadius: 10, color: '#d0d0d0', outline: 'none',
  colorScheme: 'dark',
};

export function DateRangeFilter({ dateRange, onDateRangeChange, onExportCSV }: DateRangeFilterProps) {
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const quick = (days: number) => {
    const to = new Date();
    onDateRangeChange({ from: new Date(to.getTime() - days * 86400000), to });
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '14px 18px', border: '1px solid rgba(0,255,65,.18)', borderRadius: 16, background: 'rgba(0,255,65,.03)' }}>
      <span style={{ fontSize: 11, color: '#00FF41', fontWeight: 900, letterSpacing: '.12em' }}>◈ PERÍODO</span>

      <div style={{ display: 'flex', gap: 6 }}>
        {[7, 30, 90].map(d => (
          <button key={d} style={btnBase} onClick={() => quick(d)}
            onMouseEnter={e => { (e.currentTarget.style.color = '#00FF41'); (e.currentTarget.style.borderColor = '#00FF41'); }}
            onMouseLeave={e => { (e.currentTarget.style.color = '#B0B0B0'); (e.currentTarget.style.borderColor = 'rgba(0,255,65,.25)'); }}
          >{d} dias</button>
        ))}
      </div>

      <input type="date" style={inputStyle} value={fmt(dateRange.from)}
        onChange={e => onDateRangeChange({ ...dateRange, from: new Date(e.target.value) })} />
      <input type="date" style={inputStyle} value={fmt(dateRange.to)}
        onChange={e => onDateRangeChange({ ...dateRange, to: new Date(e.target.value) })} />

      <button onClick={onExportCSV} style={{
        ...btnBase, marginLeft: 'auto',
        color: '#001406', background: '#00FF41', borderColor: '#00FF41',
        boxShadow: '0 0 18px rgba(0,255,65,.35)',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = '#00cc33')}
        onMouseLeave={e => (e.currentTarget.style.background = '#00FF41')}
      >
        ↓ Exportar CSV
      </button>
    </div>
  );
}
