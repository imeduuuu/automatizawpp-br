'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard',      label: 'Dashboard',    icon: '◈' },
  { href: '/leads',          label: 'Leads',         icon: '↗' },
  { href: '/conversations',  label: 'Conversas',     icon: '✉' },
  { href: '/calls',          label: 'Chamadas',      icon: '◎' },
  { href: '/follow-ups',     label: 'Follow-ups',    icon: '⟳' },
  { href: '/agents',         label: 'Agentes',       icon: '✦' },
  { href: '/settings',       label: 'Config',        icon: '⚙' },
];

interface DashboardHeaderProps {
  dateRange: { from: Date; to: Date };
  onLogout: () => void;
}

export function DashboardHeader({ dateRange, onLogout }: DashboardHeaderProps) {
  const pathname = usePathname();
  const from = dateRange.from.toLocaleDateString('pt-BR');
  const to = dateRange.to.toLocaleDateString('pt-BR');

  return (
    <header style={{
      borderBottom: '1px solid rgba(0,255,65,.18)',
      background: 'rgba(0,0,0,.92)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Top row: brand + period + logout */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#00FF41', fontSize: 10, fontWeight: 900, letterSpacing: '.16em', textTransform: 'uppercase' }}>● LIVE</span>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-.03em' }}>AutomatizaWPP</h1>
          </div>
          <p style={{ fontSize: 11, color: '#666', marginTop: 1 }}>{from} — {to}</p>
        </div>
        <button
          onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', border: '1px solid rgba(0,255,65,.3)', borderRadius: 999, background: 'transparent', color: '#B0B0B0', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#00FF41'; e.currentTarget.style.borderColor = '#00FF41'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#B0B0B0'; e.currentTarget.style.borderColor = 'rgba(0,255,65,.3)'; }}
        >
          ↪ Sair
        </button>
      </div>

      {/* Nav row */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px',
              fontSize: 12, fontWeight: active ? 800 : 600,
              color: active ? '#00FF41' : '#B0B0B0',
              borderBottom: active ? '2px solid #00FF41' : '2px solid transparent',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: '.2s',
              textShadow: active ? '0 0 12px rgba(0,255,65,.5)' : 'none',
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#B0B0B0'; }}
            >
              <span style={{ fontSize: 13 }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
