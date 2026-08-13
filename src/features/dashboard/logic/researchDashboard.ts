import { calculateRemainingDays } from "../../researchSessions/logic/researchSessionList";
import type { ResearchSession } from "../../researchSessions/types/researchSession";
import type { ParsedTarotRecord } from "../../records/types/tarotRecord";

export type DashboardRecordGroup = {
  groupId: string;
  groupTitle: string;
  observationDate: string;
  observationTime: string;
  cards: Array<Pick<ParsedTarotRecord, "cardName" | "orientationLabel" | "questionOrder">>;
};

export type DashboardPendingAction = {
  id: string;
  priority: number;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  tone: "urgent" | "warning" | "info";
};

export function localDateKey(now = new Date()): string {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatFullDate(value: string): string {
  return value.replace(/-/g, "/");
}

export function formatShortDate(value: string): string {
  const [, month = "", day = ""] = value.split("-");
  return month && day ? `${month}/${day}` : value;
}

export function formatDateTime(date: string, time: string): string {
  return `${formatFullDate(date)} ${time}`;
}

export function groupFormalRecords(records: readonly ParsedTarotRecord[]): DashboardRecordGroup[] {
  const grouped = new Map<string, ParsedTarotRecord[]>();
  records.forEach((record) => grouped.set(record.groupId, [...(grouped.get(record.groupId) ?? []), record]));
  return [...grouped.values()]
    .filter((group) => group.length > 0)
    .sort((left, right) => right[0].observationDateTime.localeCompare(left[0].observationDateTime))
    .map((group) => ({
      groupId: group[0].groupId,
      groupTitle: group[0].groupTitle,
      observationDate: group[0].observationDate,
      observationTime: group[0].observationTime,
      cards: group
        .slice()
        .sort((left, right) => left.questionOrder - right.questionOrder)
        .map(({ cardName, orientationLabel, questionOrder }) => ({ cardName, orientationLabel, questionOrder })),
    }));
}

export function activeResearchSessions(sessions: readonly ResearchSession[]): ResearchSession[] {
  return sessions.filter((session) => !["completed", "invalid"].includes(session.status));
}

export function completedResearchCount(sessions: readonly ResearchSession[]): number {
  return sessions.filter((session) => session.status === "completed").length;
}

export function sessionTimingLabel(session: ResearchSession, today: string): string {
  if (session.status === "validation_due") return "待驗證";
  if (session.status === "completed") return "已完成";
  if (session.status === "invalid") return "已失效";
  const remaining = calculateRemainingDays(session.validationDeadline, today);
  if (remaining < 0) return "待驗證";
  if (remaining === 0) return "今天開始驗證";
  return `剩餘 ${remaining} 天`;
}

export function buildPendingActions({
  sessions,
  today,
  hasDrawDraft,
  hasImportDraft,
}: {
  sessions: readonly ResearchSession[];
  today: string;
  hasDrawDraft: boolean;
  hasImportDraft: boolean;
}): DashboardPendingAction[] {
  const actions: DashboardPendingAction[] = [];
  sessions.forEach((session) => {
    if (["completed", "invalid"].includes(session.status)) return;
    const remaining = calculateRemainingDays(session.validationDeadline, today);
    const href = `#/research/${encodeURIComponent(session.sessionId)}`;
    if (session.status === "validation_due" || remaining < 0) {
      actions.push({ id: `validation:${session.sessionId}`, priority: 1, title: `${session.sessionId} 已到驗證日期`, description: "研究資料已進入待驗證階段。", actionLabel: "開始驗證", href, tone: "urgent" });
    } else if (remaining === 0) {
      actions.push({ id: `today:${session.sessionId}`, priority: 2, title: `${session.sessionId} 今天進入驗證`, description: "可查看研究內容並準備逐題驗證。", actionLabel: "查看研究", href, tone: "warning" });
    } else if (remaining === 1) {
      actions.push({ id: `tomorrow:${session.sessionId}`, priority: 3, title: `${session.sessionId} 明天進入驗證`, description: "研究觀察期即將結束。", actionLabel: "查看研究", href, tone: "warning" });
    }
  });
  if (hasDrawDraft) actions.push({ id: "draw-draft", priority: 4, title: "有一筆尚未完成的抽牌", description: "抽牌進度仍保留在這台裝置。", actionLabel: "繼續抽牌", href: "#/draw", tone: "info" });
  if (hasImportDraft) actions.push({ id: "import-draft", priority: 5, title: "有一筆尚未完成的紀錄匯入", description: "匯入草稿仍保留在這台裝置。", actionLabel: "繼續匯入", href: "#/import", tone: "info" });
  return actions.sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

export function groupsInRecentDays(groups: readonly DashboardRecordGroup[], today: string, days: number): number {
  const date = new Date(`${today}T12:00:00`);
  date.setDate(date.getDate() - Math.max(0, days - 1));
  const from = localDateKey(date);
  return groups.filter((group) => group.observationDate >= from && group.observationDate <= today).length;
}
