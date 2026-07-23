import { describe, expect, it } from "vitest";
import type { QuestionGroup } from "../../questionGroups/types/questionGroup";
import { shouldRefreshDefaultQuestionGroup } from "./database";

function createGroup(updatedAt: string): QuestionGroup {
  return {
    id: "relationship-7-day-contact-verification-a",
    category: "關係行動驗證",
    title: "測試題組",
    questions: [],
    source: "custom",
    active: true,
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt,
  };
}

describe("default question group refresh", () => {
  it("adds a default group that does not exist locally", () => {
    expect(shouldRefreshDefaultQuestionGroup(undefined, createGroup("2026-07-23T13:48:00.000Z"))).toBe(true);
  });

  it("refreshes only when the incoming default is newer", () => {
    const existing = createGroup("2026-07-23T00:00:00.000Z");
    expect(shouldRefreshDefaultQuestionGroup(existing, createGroup("2026-07-23T13:48:00.000Z"))).toBe(true);
    expect(shouldRefreshDefaultQuestionGroup(existing, createGroup("2026-07-22T13:48:00.000Z"))).toBe(false);
  });
});
