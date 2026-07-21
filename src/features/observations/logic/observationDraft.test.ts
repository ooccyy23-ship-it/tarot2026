import { describe, expect, it } from "vitest";
import type { DrawResult } from "../types/observation";
import type { ObservationDraft } from "../types/observationDraft";
import { attachDrawResultOnce } from "./observationDraft";

const questions = Array.from({ length: 5 }, (_, index) => ({ id: `q${index + 1}`, order: index + 1, title: `問題 ${index + 1}` }));
const result = {
  drawTime: "09:55",
  selectedWeekday: 2,
  sequences: [55, 64, 49, 6, 39],
  cards: [],
  completedAt: "2026-07-21T12:00:00.000Z",
} as DrawResult;

const draft = {
  currentStep: 3,
  observationDate: "2026-07-21",
  drawTime: "09:55",
  subjectAlias: "對方",
  topic: "測試主題",
  contextNote: "",
  weekday: 2,
  questionGroupId: "g1",
  questionGroupSnapshot: { id: "g1", category: "測試", title: "五題", questions, source: "custom", active: true, createdAt: "", updatedAt: "" },
  preEmotion: { primaryEmotion: "平靜", customEmotion: "", expectationLevel: 5, anxietyLevel: 5, calmLevel: 5, expectedResult: "", fearedResult: "", note: "" },
  drawResult: null,
  interpretations: [],
  overallInterpretation: { summary: "", primaryJudgment: "", uncertainties: "" },
  verification: { requirement: "uncertain", status: "pending", evidenceSources: [] },
} satisfies ObservationDraft;

describe("observation draw result locking", () => {
  it("attaches a result and initializes five interpretation records", () => {
    const next = attachDrawResultOnce(draft, result);
    expect(next.drawResult).toEqual(result);
    expect(next.drawResult).not.toBe(result);
    expect(next.interpretations.map((item) => item.questionId)).toEqual(["q1", "q2", "q3", "q4", "q5"]);
  });

  it("does not replace a result after it has been stored", () => {
    const stored = { ...draft, drawResult: result };
    const replacement = { ...result, completedAt: "2026-07-21T13:00:00.000Z" };
    expect(attachDrawResultOnce(stored, replacement)).toBe(stored);
    expect(stored.drawResult.completedAt).toBe("2026-07-21T12:00:00.000Z");
  });
});
