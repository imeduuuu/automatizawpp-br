import type { ReactNode } from 'react';

type TopBarProps = {
  title: string;
  actions?: ReactNode;
};

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="ds-topbar">
      <h1 className="ds-topbar-title">{title}</h1>
      <div className="ds-topbar-actions">{actions}</div>
    </header>
  );
}
