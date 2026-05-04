import type { ReactNode } from 'react';

export function EmptyState({
  title = 'Nenhum dado disponível',
  message = 'Comece adicionando um novo item',
  icon,
}: {
  title?: string;
  message?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <h3 className="font-semibold text-var(--text) mb-2">{title}</h3>
      <p className="text-sm">{message}</p>
    </div>
  );
}
