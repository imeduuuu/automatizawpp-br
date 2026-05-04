import type { ReactNode } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

type TopBarProps = {
  title: string;
  actions?: ReactNode;
};

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="ds-topbar">
      <h1 className="ds-topbar-title">{title}</h1>
      <div className="ds-topbar-actions">
        {actions}
        <NotificationBell />
      </div>
    </header>
  );
}
