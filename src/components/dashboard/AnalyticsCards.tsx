'use client';

interface AnalyticsCardsProps {
  analytics: {
    totalLeads: number;
    emailsSent: number;
    callsMade: number;
    conversionRate: number;
    newLeads: number;
    respondedLeads: number;
  };
}

const CARDS = [
  { label: 'Total de Leads',        icon: '↗', getValue: (a: AnalyticsCardsProps['analytics']) => a.totalLeads },
  { label: 'Emails Enviados',        icon: '✉', getValue: (a: AnalyticsCardsProps['analytics']) => a.emailsSent },
  { label: 'Chamadas Realizadas',    icon: '◎', getValue: (a: AnalyticsCardsProps['analytics']) => a.callsMade },
  { label: 'Taxa de Conversão',      icon: '⚡', getValue: (a: AnalyticsCardsProps['analytics']) => `${a.conversionRate.toFixed(1)}%` },
  { label: 'Leads Novos',            icon: '✦', getValue: (a: AnalyticsCardsProps['analytics']) => a.newLeads },
  { label: 'Leads Respondidos',      icon: '✔', getValue: (a: AnalyticsCardsProps['analytics']) => a.respondedLeads },
];

export function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      {CARDS.map((card) => (
        <div key={card.label} style={{
          background: 'linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.015))',
          border: '1px solid rgba(0,255,65,.18)',
          borderRadius: 20,
          padding: '22px 24px',
          transition: '.3s',
          cursor: 'default',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,.6)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,.18)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ color: '#B0B0B0', fontSize: 13, fontWeight: 600, margin: 0 }}>{card.label}</p>
            <span style={{
              width: 36, height: 36, borderRadius: 12,
              border: '1px solid rgba(0,255,65,.22)',
              background: 'rgba(0,255,65,.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#00FF41', fontSize: 16,
              boxShadow: '0 0 14px rgba(0,255,65,.2)',
            }}>{card.icon}</span>
          </div>
          <p style={{ fontSize: 36, fontWeight: 900, color: '#00FF41', margin: 0, textShadow: '0 0 24px rgba(0,255,65,.4)', letterSpacing: '-.03em' }}>
            {card.getValue(analytics)}
          </p>
        </div>
      ))}
    </div>
  );
}
