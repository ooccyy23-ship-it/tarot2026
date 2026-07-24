import { describe, expect, it } from "vitest";
import type { ResearchSession } from "../types/researchSession";
import {
  calculateRemainingDays,
  filterResearchSessions,
  formatRemainingDays,
} from "./researchSessionList";

function session(
  sessionId: string,
  status: ResearchSession["status"],
): ResearchSession {
  return {
    sessionId,
    schemaVersion: 1,
    ownerId: "owner",
    sessionType: "seven_day_three_sets",
    subject: "小峰",
    relationshipScope: "我和小峰之間的感情互動",
    startDate: "2026-07-24",
    validationDeadline: "2026-07-31",
    status,
    currentSet: "A",
    completedSets: [],
    totalCards: 15,
    groupDrawResults: [],
    events: [],
    verificationResults: [],
    validatedQuestionIds: [],
    createdAt: null,
    updatedAt: null,
    completedAt: null,
    invalidReason: null,
  };
}

describe("7-day research list presentation", () => {
  const sessions = [
    session("draft", "draft"),
    session("drawing", "drawing"),
    session("completed", "completed"),
  ];

  it("filters sessions by status and preserves all for the all filter", () => {
    expect(filterResearchSessions(sessions, "all")).toHaveLength(3);
    expect(filterResearchSessions(sessions, "drawing").map((item) => item.sessionId))
      .toEqual(["drawing"]);
  });

  it("calculates remaining days using calendar dates", () => {
    expect(calculateRemainingDays("2026-07-31", "2026-07-24")).toBe(7);
    expect(calculateRemainingDays("2026-07-31", "2026-08-02")).toBe(-2);
  });

  it("formats due, overdue, completed and invalid states", () => {
    expect(formatRemainingDays(session("due", "validation_due"), "2026-07-31"))
      .toBe("今天到期");
    expect(formatRemainingDays(session("late", "validation_due"), "2026-08-02"))
      .toBe("已逾期 2 天");
    expect(formatRemainingDays(session("done", "completed"), "2026-08-02"))
      .toBe("已完成");
    expect(formatRemainingDays(session("bad", "invalid"), "2026-08-02"))
      .toBe("已失效");
  });
});
