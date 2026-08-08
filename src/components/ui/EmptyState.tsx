import type { ReactNode } from "react";

type EmptyStateProps = { title: string; description: string; action?: ReactNode };

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <div className="ui-empty-state"><span className="ui-empty-mark" aria-hidden="true">T</span><strong>{title}</strong><p>{description}</p>{action}</div>;
}
