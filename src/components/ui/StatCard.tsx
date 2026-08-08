type StatCardProps = { label: string; value: string | number; hint?: string };

export function StatCard({ label, value, hint }: StatCardProps) {
  return <article className="ui-stat-card"><span>{label}</span><strong>{value}</strong>{hint ? <small>{hint}</small> : null}</article>;
}
