import type { ReactNode } from "react";

type PageHeaderProps = { eyebrow?: string; title: string; description: string; actions?: ReactNode };

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="ui-page-header">
      <div>{eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}<h1>{title}</h1><p>{description}</p></div>
      {actions ? <div className="ui-page-actions">{actions}</div> : null}
    </header>
  );
}
