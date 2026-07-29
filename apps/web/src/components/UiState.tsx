import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div>
        <p className="empty-state-title">{title}</p>
        {children && <p className="empty-state-copy">{children}</p>}
      </div>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}