import { describe, expect, it } from "vitest";
import defaultQuestionGroups from "./defaultQuestionGroups.json";

describe("default question groups", () => {
  it("contains the de-identified 30-day action verification spread with five ordered questions", () => {
    const group = defaultQuestionGroups.find((item) => item.id === "relationship-30-day-action-verification-01");
    expect(group).toBeDefined();
    expect(group?.questions).toHaveLength(5);
    expect(group?.questions.map((question) => question.order)).toEqual([1, 2, 3, 4, 5]);
    expect(group?.active).toBe(true);
  });

  it("contains the de-identified 7-day contact verification spread with five ordered questions", () => {
    const group = defaultQuestionGroups.find((item) => item.id === "relationship-7-day-contact-verification-a");
    expect(group).toBeDefined();
    expect(group?.title).toBe("7天題組 A：主動聯絡驗證牌陣");
    expect(group?.questions).toHaveLength(5);
    expect(group?.questions.map((question) => question.order)).toEqual([1, 2, 3, 4, 5]);
    expect(group?.questions[1].description).toContain("LINE");
    expect(group?.active).toBe(true);
  });

  it("does not expose the supplied private name in tracked default data", () => {
    expect(JSON.stringify(defaultQuestionGroups)).not.toContain("小峰");
    expect(JSON.stringify(defaultQuestionGroups)).toContain("對方");
  });
});
