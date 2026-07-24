import type {
  ResearchEventRecord,
  ResearchEventType,
  ResearchSession,
  ResearchSessionStatus,
  ResearchSetCode,
} from "../types/researchSession";

export const researchEventTypes: readonly ResearchEventType[] = [
  "直接訊息",
  "電話",
  "面對面互動",
  "社群互動",
  "第三人相關事件",
  "主動邀約",
  "關心或分享",
  "爭執或誤解",
  "具體行動",
  "無互動紀錄",
  "其他",
];

export type ResearchEventInput = {
  eventDate: string;
  eventTime?: string;
  eventType: ResearchEventType;
  description: string;
  isDirectInteraction: boolean;
  initiatedByXiaofeng: boolean;
  hasConcreteAction: boolean;
  relatedSets: ResearchSetCode[];
  relatedQuestionIds: string[];
};

export function canEditResearchEvents(status: ResearchSessionStatus): boolean {
  return status === "observing" || status === "validation_due";
}

export function isDateWithinResearchPeriod(
  eventDate: string,
  startDate: string,
  validationDeadline: string,
): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    && eventDate >= startDate
    && eventDate <= validationDeadline;
}

export function validateResearchEventInput(
  session: Pick<ResearchSession, "status" | "startDate" | "validationDeadline">,
  input: ResearchEventInput,
): string[] {
  const errors: string[] = [];
  if (!canEditResearchEvents(session.status)) {
    errors.push("只有觀測中或待驗證的 Session 可以新增或修改事件。");
  }
  if (!isDateWithinResearchPeriod(input.eventDate, session.startDate, session.validationDeadline)) {
    errors.push(`事件日期必須介於 ${session.startDate} 與 ${session.validationDeadline}。`);
  }
  if (input.eventTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.eventTime)) {
    errors.push("事件時間格式不正確。");
  }
  if (!researchEventTypes.includes(input.eventType)) {
    errors.push("事件類型不正確。");
  }
  if (!input.description.trim()) {
    errors.push("事件內容為必填。");
  }
  if (input.relatedSets.some((setCode) => !["A", "B", "C"].includes(setCode))) {
    errors.push("關聯題組只能選擇 A、B 或 C。");
  }
  if (
    input.relatedQuestionIds.some(
      (questionId) => !/^(communication|interaction|progress)-q[1-5]$/.test(questionId),
    )
  ) {
    errors.push("關聯題號不正確。");
  }
  if (
    input.eventType === "無互動紀錄"
    && (input.isDirectInteraction || input.initiatedByXiaofeng || input.hasConcreteAction)
  ) {
    errors.push("「無互動紀錄」不可標記為直接互動、小峰主動或具體行動。");
  }
  return errors;
}

export function normalizeResearchEventInput(input: ResearchEventInput): ResearchEventInput {
  const relatedSets = [...new Set(input.relatedSets)].sort();
  const relatedQuestionIds = [...new Set(input.relatedQuestionIds)].sort();
  const noInteraction = input.eventType === "無互動紀錄";
  return {
    eventDate: input.eventDate,
    ...(input.eventTime ? { eventTime: input.eventTime } : {}),
    eventType: input.eventType,
    description: input.description.trim(),
    isDirectInteraction: noInteraction ? false : input.isDirectInteraction,
    initiatedByXiaofeng: noInteraction ? false : input.initiatedByXiaofeng,
    hasConcreteAction: noInteraction ? false : input.hasConcreteAction,
    relatedSets,
    relatedQuestionIds,
  };
}

export function eventSortKey(event: Pick<ResearchEventRecord, "eventDate" | "eventTime">): string {
  return `${event.eventDate}T${event.eventTime || "00:00"}`;
}

export function sortResearchEvents(
  events: readonly ResearchEventRecord[],
): ResearchEventRecord[] {
  return [...events].sort((a, b) => {
    const byOccurredAt = eventSortKey(b).localeCompare(eventSortKey(a));
    if (byOccurredAt !== 0) return byOccurredAt;
    return b.eventId.localeCompare(a.eventId);
  });
}
