import { describe, expect, it } from "vitest";
import type { ObservationDraft } from "../types/observationDraft";
import { buildObservation, updateObservationText, validateObservationDraft } from "./buildObservation";

function createDraft(): ObservationDraft {
  const questions = Array.from({ length: 5 }, (_, index) => ({
    id: `q${index + 1}`,
    order: index + 1,
    title: `問題 ${index + 1}`,
  }));
  const timestamp = "2026-07-21T01:00:00.000Z";
  return {
    currentStep: 6,
    observationDate: "2026-07-21",
    drawTime: "09:55",
    subjectAlias: "對方",
    topic: "測試主題",
    contextNote: "",
    weekday: 2,
    questionGroupId: "group-1",
    questionGroupSnapshot: {
      id: "group-1", category: "測試", title: "五題測試", questions,
      source: "custom", active: true, createdAt: timestamp, updatedAt: timestamp,
    },
    preEmotion: {
      primaryEmotion: "平靜", customEmotion: "", expectationLevel: 5,
      anxietyLevel: 3, calmLevel: 7, expectedResult: "", fearedResult: "", note: "",
    },
    drawResult: {
      drawTime: "09:55", selectedWeekday: 2, sequences: [55, 64, 49, 6, 39], completedAt: timestamp,
      cards: questions.map((question, index) => ({
        position: index + 1, questionId: question.id, sequence: index + 1,
        cardNumber: index + 1, cardName: `牌 ${index + 1}`, coinSide: "heads" as const,
        orientation: "upright" as const, orientationLabel: "正位" as const,
        startedAt: timestamp, stoppedAt: timestamp, durationMs: 100,
      })),
    },
    interpretations: questions.map((question) => ({ questionId: question.id, text: "解讀" })),
    overallInterpretation: { summary: "摘要", primaryJudgment: "判斷", uncertainties: "保留" },
    verification: { requirement: "uncertain", status: "pending", evidenceSources: [] },
  };
}

describe("buildObservation", () => {
  it("saves independent question-group and draw-result snapshots", () => {
    const draft = createDraft();
    const observation = buildObservation(draft, new Date("2026-07-21T02:00:00.000Z"));
    expect(observation.questionGroupSnapshot).toEqual(draft.questionGroupSnapshot);
    expect(observation.questionGroupSnapshot).not.toBe(draft.questionGroupSnapshot);
    expect(observation.drawResult).toEqual(draft.drawResult);
    expect(observation.drawResult).not.toBe(draft.drawResult);

    draft.questionGroupSnapshot!.questions[0].title = "後來修改";
    expect(observation.questionGroupSnapshot.questions[0].title).toBe("問題 1");
  });

  it("requires the verification proposition, date and criteria when verification is required", () => {
    const draft = createDraft();
    draft.verification.requirement = "required";
    expect(validateObservationDraft(draft)).toEqual([
      "請填寫可驗證命題。", "請填寫驗證期限。", "請填寫判定標準。",
    ]);
  });

  it("keeps completed draw results immutable while editing text records", () => {
    const observation = buildObservation(createDraft());
    const updated = updateObservationText(observation, {
      subjectAlias: "新代稱", topic: observation.topic, contextNote: observation.contextNote,
      interpretations: observation.interpretations, overallInterpretation: observation.overallInterpretation,
    });
    expect(updated.subjectAlias).toBe("新代稱");
    expect(updated.drawResult).toBe(observation.drawResult);
    expect(updated.questionGroupSnapshot).toBe(observation.questionGroupSnapshot);
  });
});
