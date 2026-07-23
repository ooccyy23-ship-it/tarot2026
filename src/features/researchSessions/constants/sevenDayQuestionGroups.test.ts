import { describe, expect, it } from "vitest";
import { getSevenDayQuestionGroup, researchSubjectToken, sevenDayQuestionGroups } from "./sevenDayQuestionGroups";

describe("seven-day fixed question groups", () => {
  it("defines communication, interaction and progress in a fixed order", () => {
    expect(sevenDayQuestionGroups.map((group) => group.key)).toEqual([
      "communication",
      "interaction",
      "progress",
    ]);
  });

  it("keeps five ordered and globally distinct question ids per group", () => {
    const questionIds = sevenDayQuestionGroups.reduce<string[]>(
      (ids, group) => [...ids, ...group.questionGroup.questions.map((question) => question.id)],
      [],
    );
    expect(sevenDayQuestionGroups.every((group) => group.questionGroup.questions.length === 5)).toBe(true);
    expect(sevenDayQuestionGroups.every((group) =>
      group.questionGroup.questions.every((question, index) => question.order === index + 1),
    )).toBe(true);
    expect(new Set(questionIds).size).toBe(15);
  });

  it("uses a subject token instead of embedding a private name", () => {
    const text = JSON.stringify(sevenDayQuestionGroups);
    expect(text).toContain(researchSubjectToken);
    expect(text).not.toContain("小峰");
  });

  it("finds a fixed group by its research key", () => {
    expect(getSevenDayQuestionGroup("progress").dimension).toBe("Progress");
  });
});
