import { describe, expect, it } from "vitest";
import { createCustomQuestionGroup, validateCustomQuestionGroup } from "./createQuestionGroup";

const validInput = {
  category: "關係觀測",
  title: "自訂五題",
  description: "只含去識別化欄位",
  questions: Array.from({ length: 5 }, (_, index) => ({
    title: `問題 ${index + 1}`,
    description: `說明 ${index + 1}`,
  })),
};

describe("custom question groups", () => {
  it("requires exactly five named questions", () => {
    expect(validateCustomQuestionGroup({ ...validInput, questions: validInput.questions.slice(0, 4) }))
      .toContain("題組必須包含五個問題。");
    expect(validateCustomQuestionGroup({
      ...validInput,
      questions: validInput.questions.map((question, index) => index === 2 ? { ...question, title: "" } : question),
    })).toContain("五個問題名稱都必須填寫。");
  });

  it("creates five ordered questions and custom metadata", () => {
    const group = createCustomQuestionGroup(validInput, new Date("2026-07-21T12:00:00.000Z"));
    expect(group.source).toBe("custom");
    expect(group.active).toBe(true);
    expect(group.questions).toHaveLength(5);
    expect(group.questions.map((question) => question.order)).toEqual([1, 2, 3, 4, 5]);
    expect(group.createdAt).toBe("2026-07-21T12:00:00.000Z");
  });
});
