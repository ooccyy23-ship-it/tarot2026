import { describe, expect, it } from "vitest";
import type {
  QuestionGroupVerificationResult,
  QuestionVerificationResult,
} from "../types/researchSession";
import {
  calculateQuestionGroupHitRate,
  calculateSessionHitRate,
  calculateValidationDueDate,
  countValidVerificationQuestions,
} from "./researchSessionCalculations";

function question(questionId: string, result: QuestionVerificationResult["result"]): QuestionVerificationResult {
  return { questionId, result };
}

function group(
  groupKey: QuestionGroupVerificationResult["groupKey"],
  results: QuestionVerificationResult["result"][],
): QuestionGroupVerificationResult {
  return {
    groupKey,
    questionGroupId: `group-${groupKey}`,
    questions: results.map((result, index) => question(`q${index + 1}`, result)),
  };
}

describe("7-day research session calculations", () => {
  it("adds seven calendar days across month and year boundaries", () => {
    expect(calculateValidationDueDate("2026-07-24")).toBe("2026-07-31");
    expect(calculateValidationDueDate("2026-12-28")).toBe("2027-01-04");
  });

  it("rejects invalid calendar dates", () => {
    expect(() => calculateValidationDueDate("2026-02-30")).toThrow("開始日不是有效日期。");
    expect(() => calculateValidationDueDate("2026/07/24")).toThrow("日期格式必須為 YYYY-MM-DD。");
  });

  it("counts only scored verification questions", () => {
    const questions = [
      question("q1", "matched"),
      question("q2", "partial"),
      question("q3", "not_matched"),
      question("q4", "undetermined"),
      question("q5", "not_applicable"),
    ];
    expect(countValidVerificationQuestions(questions)).toBe(3);
  });

  it("calculates one question group's hit rate and excludes unscored results", () => {
    expect(calculateQuestionGroupHitRate(group("communication", [
      "matched",
      "partial",
      "not_matched",
      "undetermined",
      "not_applicable",
    ]))).toBe(0.5);
    expect(calculateQuestionGroupHitRate(group("communication", [
      "undetermined",
      "not_applicable",
    ]))).toBeNull();
  });

  it("calculates the whole session using all valid questions as the denominator", () => {
    const results = [
      group("communication", ["matched", "partial"]),
      group("interaction", ["not_matched", "undetermined"]),
      group("progress", ["matched", "not_applicable"]),
    ];
    expect(calculateSessionHitRate(results)).toBe(0.625);
    expect(calculateSessionHitRate([
      group("communication", ["undetermined"]),
      group("interaction", ["not_applicable"]),
    ])).toBeNull();
  });
});
