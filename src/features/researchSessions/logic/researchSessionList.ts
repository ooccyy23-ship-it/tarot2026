import type { ResearchSession, ResearchSessionStatus } from "../types/researchSession";

export type ResearchSessionFilter = "all" | ResearchSessionStatus;

export const researchSessionFilters: readonly ResearchSessionFilter[] = [
  "all",
  "draft",
  "drawing",
  "observing",
  "validation_due",
  "completed",
  "invalid",
];

export function filterResearchSessions(
  sessions: readonly ResearchSession[],
  filter: ResearchSessionFilter,
): ResearchSession[] {
  return filter === "all"
    ? [...sessions]
    : sessions.filter((session) => session.status === filter);
}

function parseDateOnly(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function calculateRemainingDays(
  deadline: string,
  today: string,
): number {
  return Math.ceil((parseDateOnly(deadline) - parseDateOnly(today)) / 86_400_000);
}

export function formatRemainingDays(
  session: Pick<ResearchSession, "status" | "validationDeadline">,
  today: string,
): string {
  if (session.status === "completed") return "已完成";
  if (session.status === "invalid") return "已失效";
  const days = calculateRemainingDays(session.validationDeadline, today);
  if (days < 0) return `已逾期 ${Math.abs(days)} 天`;
  if (days === 0) return "今天到期";
  return `剩餘 ${days} 天`;
}
