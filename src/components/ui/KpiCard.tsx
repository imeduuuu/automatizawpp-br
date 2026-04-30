type KpiCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
};

export function KpiCard({ label, value, sub, accent = false }: KpiCardProps) {
  const style = accent
    ? {
        borderColor: 'var(--green)',
        background: 'var(--green-light)'
      }
    : undefined;

  const valueStyle = accent
    ? {
        color: 'var(--green-dark)'
      }
    : undefined;

  return (
    <article className="ds-card" style={style}>
      <p className="ds-kpi-label">{label}</p>
      <p className="ds-kpi-value" style={valueStyle}>
        {value}
      </p>
      {sub ? <p className="ds-kpi-sub">{sub}</p> : null}
    </article>
  );
}
