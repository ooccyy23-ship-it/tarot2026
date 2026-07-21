import { describe, expect, it } from "vitest";
import type { Observation } from "../../observations/types/observation";
import { completeVerification, getDaysRemaining, listPendingVerifications } from "./pendingVerification";

function createObservation(id: string, dueDate: string | undefined, status: Observation["verification"]["status"] = "pending"): Observation {
  const questions = Array.from({ length: 5 }, (_, index) => ({ id: `q${index + 1}`, order: index + 1, title: `問題 ${index + 1}` }));
  return {
    id, schemaVersion: 1, observationDate: "2026-07-01", drawTime: "09:00",
    createdAt: "2026-07-01T01:00:00.000Z", updatedAt: "2026-07-01T01:00:00.000Z",
    weekday: 2, weekdayLabel: "星期二", questionGroupId: "g1",
    questionGroupSnapshot: { id: "g1", category: "測試", title: "測試題組", source: "custom", active: true, createdAt: "", updatedAt: "", questions },
    preEmotion: { primaryEmotion: "平靜", expectationLevel: 5, anxietyLevel: 5, calmLevel: 5 },
    drawResult: { drawTime: "09:00", selectedWeekday: 2, sequences: [1, 2, 3, 4, 5], completedAt: "", cards: questions.map((question, index) => ({ position: index + 1, questionId: question.id, sequence: index + 1, cardNumber: index + 1, cardName: `牌 ${index + 1}`, coinSide: "heads", orientation: "upright", orientationLabel: "正位", startedAt: "", stoppedAt: "", durationMs: 1 })) },
    interpretations: [], overallInterpretation: {},
    verification: { requirement: "required", status, dueDate, prediction: "測試命題" },
  };
}

describe("pending verification", () => {
  const today = new Date("2026-07-21T12:00:00.000Z");

  it("only includes raw pending records and sorts overdue before upcoming records", () => {
    const result = listPendingVerifications([
      createObservation("future", "2026-07-30"),
      createObservation("verified", "2026-07-19", "verified"),
      createObservation("no-date", undefined),
      createObservation("overdue", "2026-07-20"),
      createObservation("soon", "2026-07-22"),
    ], today);
    expect(result.map((item) => item.id)).toEqual(["overdue", "soon", "future", "no-date"]);
  });

  it("calculates remaining days using calendar dates", () => {
    expect(getDaysRemaining("2026-07-20", today)).toBe(-1);
    expect(getDaysRemaining("2026-07-21", today)).toBe(0);
    expect(getDaysRemaining("2026-07-24", today)).toBe(3);
  });

  it("saves a verification result without changing the locked draw result", () => {
    const observation = createObservation("pending", "2026-07-30");
    const updated = completeVerification(observation, {
      actualEvent: " 實際事件 ", result: "partially_matched", evidenceSources: ["個人觀察"],
      verifiedAt: "2026-07-22", reflection: " 保留說明 ",
    }, new Date("2026-07-22T10:00:00.000Z"));
    expect(updated.verification).toMatchObject({ status: "verified", actualEvent: "實際事件", result: "partially_matched", verifiedAt: "2026-07-22", reflection: "保留說明" });
    expect(updated.drawResult).toBe(observation.drawResult);
  });
});
