import type { ElementType, ReactNode } from "react";

type SectionCardProps = { as?: ElementType; className?: string; children: ReactNode };

export function SectionCard({ as: Component = "section", className = "", children }: SectionCardProps) {
  return <Component className={`ui-section-card ${className}`.trim()}>{children}</Component>;
}
