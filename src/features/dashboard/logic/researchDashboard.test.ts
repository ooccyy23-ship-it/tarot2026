import { describe, expect, it } from "vitest";
import type { ParsedTarotRecord } from "../../records/types/tarotRecord";
import type { ResearchSession } from "../../researchSessions/types/researchSession";
import { buildPendingActions, groupFormalRecords, groupsInRecentDays, sessionTimingLabel } from "./researchDashboard";

function session(id: string, status: ResearchSession["status"], deadline: string): ResearchSession {
  return { sessionId: id, schemaVersion: 1, ownerId: "owner", sessionType: "seven_day_three_sets", subject: "小峰", relationshipScope: "我和小峰之間的感情互動", startDate: "2026-08-10", validationDeadline: deadline, status, currentSet: "A", completedSets: [], totalCards: 15, groupDrawResults: [], events: [], verificationResults: [], validatedQuestionIds: [], createdAt: null, updatedAt: null, completedAt: null, invalidReason: null };
}

function record(groupId: string, date: string, order: number): ParsedTarotRecord {
  return { id: `${groupId}-${order}`, groupId, observationDate: date, observationTime: "21:18", observationDateTime: `${date}T21:18:00`, groupTitle: `題組 ${groupId}`, questionOrder: order, questionText: "題目", cardName: `牌 ${order}`, normalizedCardName: `牌 ${order}`, arcanaType: "major", suit: "major", rank: String(order), orientation: "upright", orientationLabel: "正位", createdAt: "" };
}

describe("research dashboard derivations", () => {
  it("sorts due work before drafts and never presents negative days", () => {
    const due = session("due", "observing", "2026-08-12");
    const actions = buildPendingActions({ sessions: [due], today: "2026-08-13", hasDrawDraft: true, hasImportDraft: true });
    expect(actions.map((item) => item.id)).toEqual(["validation:due", "draw-draft", "import-draft"]);
    expect(sessionTimingLabel(due, "2026-08-13")).toBe("待驗證");
  });

  it("distinguishes today and tomorrow deadlines", () => {
    expect(sessionTimingLabel(session("today", "observing", "2026-08-13"), "2026-08-13")).toBe("今天開始驗證");
    expect(sessionTimingLabel(session("tomorrow", "observing", "2026-08-14"), "2026-08-13")).toBe("剩餘 1 天");
  });

  it("groups only supplied formal records and returns newest groups first", () => {
    const groups = groupFormalRecords([record("old", "2026-08-10", 1), record("new", "2026-08-13", 2), record("new", "2026-08-13", 1)]);
    expect(groups.map((group) => group.groupId)).toEqual(["new", "old"]);
    expect(groups[0].cards.map((card) => card.questionOrder)).toEqual([1, 2]);
    expect(groupsInRecentDays(groups, "2026-08-13", 7)).toBe(2);
  });
});
