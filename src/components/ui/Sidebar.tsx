'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import { useUiCopy, useUiLanguage } from '@/components/ui/UiLanguageProvider';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { logoutAction } from '@/lib/actions/auth-actions';

type SidebarProps = {
  badges?: Partial<Record<string, number>>;
  userName?: string;
  role?: string;
};

type NavItem = {
  href: string;
  label: string;
  section: 'Principal' | 'Operaciones' | 'Cuenta';
  icon: ReactNode;
  badgeKey?: string;
};

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    section: 'Principal',
    icon: <path d="M4 4h6v6H4zM14 4h6v4h-6zM4 14h6v6H4zM14 10h6v10h-6z" />
  },
  {
    href: '/contatos',
    label: 'Contatos',
    section: 'Principal',
    icon: <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z" />,
    badgeKey: 'leads'
  },
  {
    href: '/conversations',
    label: 'Conversas',
    section: 'Operaciones',
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    badgeKey: 'conversations'
  },
  {
    href: '/emails',
    label: 'Emails',
    section: 'Operaciones',
    icon: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>
  },
  {
    href: '/calls',
    label: 'Chamadas',
    section: 'Operaciones',
    icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />,
    badgeKey: 'calls'
  },
  {
    href: '/follow-ups',
    label: 'Follow-ups',
    section: 'Operaciones',
    icon: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
    badgeKey: 'followUps'
  },
  {
    href: '/sequences',
    label: 'Sequências',
    section: 'Operaciones',
    icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>
  },
  {
    href: '/agents',
    label: 'Agentes',
    section: 'Operaciones',
    icon: <><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>
  },
  {
    href: '/sentinel',
    label: 'Sentinel',
    section: 'Operaciones',
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
    badgeKey: 'sentinel'
  },
  {
    href: '/settings',
    label: 'Configurações',
    section: 'Cuenta',
    icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>
  },
  {
    href: '/account',
    label: 'Conta',
    section: 'Cuenta',
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
  }
];

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function initialsFrom(name: string) {
  const chunks = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (chunks.length === 0) return 'AW';
  return chunks.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function Sidebar({ badges = {}, userName = 'Equipo AutomatizaWPP', role = 'Operador' }: SidebarProps) {
  const pathname = usePathname();
  const copy = useUiCopy();
  const { language } = useUiLanguage();

  const sections: Array<NavItem['section']> = ['Principal', 'Operaciones', 'Cuenta'];
  const sectionLabels = {
    Principal: language === 'en' ? 'Main' : language === 'ca' ? 'Principal' : 'Principal',
    'Operaciones': language === 'en' ? 'Operations' : language === 'ca' ? 'Operacions' : language === 'pt' ? 'Operações' : 'Operaciones',
    Cuenta: language === 'en' ? 'Account' : language === 'ca' ? 'Compte' : language === 'pt' ? 'Conta' : 'Cuenta'
  } as const;
  const navLabelByHref: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/contatos': language === 'en' ? 'Contacts' : 'Contatos',
    '/conversations': language === 'en' ? 'Conversations' : language === 'ca' ? 'Converses' : 'Conversas',
    '/emails': 'Emails',
    '/calls': language === 'en' ? 'Calls' : language === 'ca' ? 'Trucades' : 'Chamadas',
    '/follow-ups': 'Follow-ups',
    '/sequences': language === 'en' ? 'Sequences' : language === 'ca' ? 'Seqüències' : 'Sequências',
    '/agents': language === 'en' ? 'Agents' : language === 'ca' ? 'Agents' : 'Agentes',
    '/sentinel': 'Sentinel',
    '/settings': language === 'en' ? 'Settings' : language === 'ca' ? 'Configuració' : 'Configurações',
    '/account': language === 'en' ? 'Account' : language === 'ca' ? 'Compte' : 'Conta'
  };

  return (
    <aside className="ds-sidebar">
      <Link href="/dashboard" className="ds-logo">
        <BrandWordmark />
      </Link>

      {sections.map((section) => (
        <div key={section}>
          <p className="ds-nav-section">{sectionLabels[section]}</p>
          {navItems
            .filter((item) => item.section === section)
            .map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
              const badgeValue = item.badgeKey ? badges[item.badgeKey] : undefined;

              return (
                <Link key={item.href} href={item.href} className={`ds-nav-item${active ? ' active' : ''}`}>
                  <span className="ds-nav-label">
                    <NavIcon>{item.icon}</NavIcon>
                    {navLabelByHref[item.href] ?? item.label}
                  </span>
                  {typeof badgeValue === 'number' && badgeValue > 0 ? <span className="ds-nav-badge">{badgeValue}</span> : null}
                </Link>
              );
            })}
        </div>
      ))}

      <div className="ds-sidebar-footer">
        <LanguageSwitcher />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginTop: 10 }}>
          <span className="ds-avatar">{initialsFrom(userName)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="ds-user-name">{userName}</p>
            <p className="ds-user-role">{role}</p>
          </div>
        </div>
        <form action={logoutAction} style={{ width: '100%', marginTop: 8 }}>
          <button
            type="submit"
            className="ds-nav-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text)', font: 'inherit' }}
          >
            <span className="ds-nav-label">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              {language === 'en' ? 'Sign out' : language === 'ca' ? 'Tancar sessió' : 'Sair'}
            </span>
          </button>
        </form>
      </div>
    </aside>
  );
}
