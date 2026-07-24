import { describe, expect, it } from "vitest";
import type {
  ResearchQuestionValidationRecord,
  ResearchSessionDrawCard,
  ResearchSetCode,
  ResearchVerificationResult,
  SessionQuestionGroupDrawResult,
} from "../types/researchSession";
import {
  canCompleteResearchSession,
  summarizeQuestionGroupValidation,
  summarizeSessionValidation,
  validateQuestionValidationInput,
} from "./researchSessionValidation";

function card(setId: ResearchSetCode, questionIndex: number): ResearchSessionDrawCard {
  return {
    questionIndex,
    questionId: `${setId.toLowerCase()}-q${questionIndex}`,
    questionText: `題組 ${setId} 第 ${questionIndex} 題`,
    sequence: questionIndex,
    cardId: questionIndex,
    cardNameZh: "測試牌",
    cardNameEn: "Test",
    orientation: "upright",
    orientationLabel: "正位",
    imageUrl: "",
    coinSide: "heads",
    startedAt: "",
    stoppedAt: "",
    durationMs: 1,
  };
}

function setResult(setId: ResearchSetCode): SessionQuestionGroupDrawResult {
  const groupKey = setId === "A" ? "communication" : setId === "B" ? "interaction" : "progress";
  const cards = [1, 2, 3, 4, 5].map((index) => card(setId, index));
  return {
    setId,
    setName: `題組 ${setId}`,
    researchCore: setId === "A" ? "Communication" : setId === "B" ? "Interaction" : "Progress",
    groupKey,
    questions: cards.map((item) => item.questionText),
    questionGroupId: `group-${setId}`,
    questionGroupSnapshot: {
      id: `group-${setId}`,
      category: "研究",
      title: `題組 ${setId}`,
      questions: cards.map((item) => ({
        id: item.questionId,
        order: item.questionIndex,
        title: item.questionText,
      })),
      source: "custom",
      active: true,
      createdAt: "",
      updatedAt: "",
    },
    drawDate: "2026-07-24",
    drawTime: "10:00",
    drawTimestamp: "",
    weekday: "thursday",
    sequences: [1, 2, 3, 4, 5],
    cards,
    isLocked: true,
    lockedAt: "",
  };
}

function records(
  setId: ResearchSetCode,
  statuses: ResearchVerificationResult[],
): ResearchQuestionValidationRecord[] {
  return statuses.map((validationStatus, index) => ({
    setId,
    questionIndex: index + 1,
    questionText: `題組 ${setId} 第 ${index + 1} 題`,
    cardSnapshot: card(setId, index + 1),
    validationStatus,
    validationScore: validationStatus === "matched"
      ? 1
      : validationStatus === "partial"
        ? 0.5
        : validationStatus === "not_matched"
          ? 0
          : null,
    evidence: "現實事件紀錄",
    validatedAt: null,
    updatedAt: null,
  }));
}

describe("7-day research final validation", () => {
  const setA = setResult("A");

  it("calculates five matched questions as 100%", () => {
    const summary = summarizeQuestionGroupValidation(
      setA,
      records("A", ["matched", "matched", "matched", "matched", "matched"]),
    );
    expect(summary).toEqual({ score: 5, validQuestionCount: 5, hitRate: 1 });
  });

  it("calculates 3 matched, 1 partial and 1 not matched as 70%", () => {
    const summary = summarizeQuestionGroupValidation(
      setA,
      records("A", ["matched", "matched", "matched", "partial", "not_matched"]),
    );
    expect(summary.score).toBe(3.5);
    expect(summary.validQuestionCount).toBe(5);
    expect(summary.hitRate).toBe(0.7);
  });

  it("excludes undetermined and calculates 87.5%", () => {
    const summary = summarizeQuestionGroupValidation(
      setA,
      records("A", ["matched", "matched", "matched", "partial", "undetermined"]),
    );
    expect(summary.score).toBe(3.5);
    expect(summary.validQuestionCount).toBe(4);
    expect(summary.hitRate).toBe(0.875);
  });

  it("returns no hit rate when every question is undetermined", () => {
    const summary = summarizeQuestionGroupValidation(
      setA,
      records("A", Array<ResearchVerificationResult>(5).fill("undetermined")),
    );
    expect(summary.validQuestionCount).toBe(0);
    expect(summary.hitRate).toBeNull();
  });

  it("cannot complete until all 15 questions are saved", () => {
    const sets = [setA, setResult("B"), setResult("C")];
    const fourteen = [
      ...records("A", Array<ResearchVerificationResult>(5).fill("matched")),
      ...records("B", Array<ResearchVerificationResult>(5).fill("matched")),
      ...records("C", Array<ResearchVerificationResult>(4).fill("matched")),
    ];
    expect(canCompleteResearchSession(
      { status: "validation_due", completedSets: ["A", "B", "C"] },
      sets,
      fourteen,
    )).toBe(false);
    const fifteen = [...fourteen, ...records("C", ["matched"]).map((item) => ({
      ...item,
      questionIndex: 5,
      cardSnapshot: card("C", 5),
    }))];
    expect(summarizeSessionValidation(sets, fifteen).hitRate).toBe(1);
    expect(canCompleteResearchSession(
      { status: "validation_due", completedSets: ["A", "B", "C"] },
      sets,
      fifteen,
    )).toBe(true);
  });

  it("keeps completed sessions read-only", () => {
    expect(validateQuestionValidationInput(
      { status: "completed", completedSets: ["A", "B", "C"] },
      { validationStatus: "matched", evidence: "已驗證事件" },
    )[0]).toContain("只有待驗證狀態");
  });
});
