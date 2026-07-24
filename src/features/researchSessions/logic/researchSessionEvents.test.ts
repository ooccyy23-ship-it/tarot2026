import { describe, expect, it } from "vitest";
import type {
  ResearchEventRecord,
  ResearchSessionStatus,
} from "../types/researchSession";
import {
  canEditResearchEvents,
  isDateWithinResearchPeriod,
  normalizeResearchEventInput,
  sortResearchEvents,
  validateResearchEventInput,
  type ResearchEventInput,
} from "./researchSessionEvents";

const session = {
  status: "observing" as ResearchSessionStatus,
  startDate: "2026-07-24",
  validationDeadline: "2026-07-31",
};

const validInput: ResearchEventInput = {
  eventDate: "2026-07-25",
  eventTime: "09:30",
  eventType: "直接訊息",
  description: "小峰傳送一則直接訊息。",
  isDirectInteraction: true,
  initiatedByXiaofeng: true,
  hasConcreteAction: false,
  relatedSets: ["A"],
  relatedQuestionIds: ["communication-q1"],
};

function event(
  eventId: string,
  eventDate: string,
  eventTime?: string,
): ResearchEventRecord {
  return {
    eventId,
    sessionId: "7D-20260724-001",
    ownerId: "owner",
    eventDate,
    ...(eventTime ? { eventTime } : {}),
    eventType: "直接訊息",
    description: eventId,
    isDirectInteraction: true,
    initiatedByXiaofeng: true,
    hasConcreteAction: false,
    relatedSets: ["A"],
    relatedQuestionIds: [],
    createdAt: null,
    updatedAt: null,
  };
}

describe("research session reality events", () => {
  it("accepts new and edited events during observing or validation_due", () => {
    expect(validateResearchEventInput(session, validInput)).toEqual([]);
    expect(validateResearchEventInput(
      { ...session, status: "validation_due" },
      { ...validInput, description: "修改後的事件內容" },
    )).toEqual([]);
  });

  it("enforces the inclusive research date range", () => {
    expect(isDateWithinResearchPeriod("2026-07-24", session.startDate, session.validationDeadline)).toBe(true);
    expect(isDateWithinResearchPeriod("2026-07-31", session.startDate, session.validationDeadline)).toBe(true);
    expect(isDateWithinResearchPeriod("2026-07-23", session.startDate, session.validationDeadline)).toBe(false);
    expect(validateResearchEventInput(session, { ...validInput, eventDate: "2026-08-01" })[0])
      .toContain("事件日期必須介於");
  });

  it("makes completed and invalid sessions read-only", () => {
    expect(canEditResearchEvents("completed")).toBe(false);
    expect(canEditResearchEvents("invalid")).toBe(false);
    expect(validateResearchEventInput({ ...session, status: "completed" }, validInput)[0])
      .toContain("只有觀測中或待驗證");
  });

  it("does not count no-interaction records as direct or positive actions", () => {
    const normalized = normalizeResearchEventInput({
      ...validInput,
      eventType: "無互動紀錄",
      hasConcreteAction: true,
    });
    expect(normalized.isDirectInteraction).toBe(false);
    expect(normalized.initiatedByXiaofeng).toBe(false);
    expect(normalized.hasConcreteAction).toBe(false);
    expect(validateResearchEventInput(session, normalized)).toEqual([]);
  });

  it("sorts the timeline by event date and optional time, newest first", () => {
    const sorted = sortResearchEvents([
      event("older", "2026-07-24", "20:00"),
      event("latest", "2026-07-26"),
      event("middle", "2026-07-25", "08:00"),
    ]);
    expect(sorted.map((item) => item.eventId)).toEqual(["latest", "middle", "older"]);
  });
});
