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
    expect(group?.title).toBe("7天題組 A：主動聯繫驗證牌陣（Communication）");
    expect(group?.description).toContain("Communication（聯繫）");
    expect(group?.questions).toHaveLength(5);
    expect(group?.questions.map((question) => question.order)).toEqual([1, 2, 3, 4, 5]);
    expect(group?.questions[1].description).toContain("LINE");
    expect(group?.active).toBe(true);
  });

  it("contains the de-identified 7-day interaction quality spread with five ordered questions", () => {
    const group = defaultQuestionGroups.find((item) => item.id === "relationship-7-day-interaction-quality-b");
    expect(group).toBeDefined();
    expect(group?.title).toBe("7天題組 B：現實互動驗證牌陣（Interaction）");
    expect(group?.description).toContain("Interaction（互動）");
    expect(group?.questions).toHaveLength(5);
    expect(group?.questions.map((question) => question.order)).toEqual([1, 2, 3, 4, 5]);
    expect(group?.questions[1].description).toContain("見面");
    expect(group?.active).toBe(true);
  });

  it("contains the de-identified 7-day relationship progress spread", () => {
    const group = defaultQuestionGroups.find((item) => item.id === "relationship-7-day-action-development-c");
    expect(group).toBeDefined();
    expect(group?.title).toBe("7天題組 C：關係推進驗證牌陣（Progress）");
    expect(group?.description).toContain("Progress（關係推進）");
    expect(group?.questions).toHaveLength(5);
    expect(group?.questions.map((question) => question.order)).toEqual([1, 2, 3, 4, 5]);
    expect(group?.questions[2].description).toBe("由牌驗證。");
    expect(group?.questions[3].description).toBe("由牌驗證。");
    expect(group?.active).toBe(true);
  });

  it("uses de-identified subject wording in tracked default data", () => {
    expect(JSON.stringify(defaultQuestionGroups)).toContain("對方");
  });
});
