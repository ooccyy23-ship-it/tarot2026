import { describe, expect, it } from "vitest";
import {
  assertResearchSessionTransition,
  canTransitionResearchSession,
} from "./researchSessionState";

describe("research session state transitions", () => {
  it("allows the required forward lifecycle", () => {
    expect(canTransitionResearchSession("draft", "drawing")).toBe(true);
    expect(canTransitionResearchSession("drawing", "observing")).toBe(true);
    expect(canTransitionResearchSession("observing", "validation_due")).toBe(true);
    expect(canTransitionResearchSession("validation_due", "completed")).toBe(true);
  });

  it("allows invalid only from unfinished states", () => {
    expect(canTransitionResearchSession("draft", "invalid")).toBe(true);
    expect(canTransitionResearchSession("drawing", "invalid")).toBe(true);
    expect(canTransitionResearchSession("observing", "invalid")).toBe(true);
    expect(canTransitionResearchSession("validation_due", "invalid")).toBe(true);
    expect(canTransitionResearchSession("completed", "invalid")).toBe(false);
  });

  it("prevents a completed session from returning to another state", () => {
    expect(canTransitionResearchSession("completed", "drawing")).toBe(false);
    expect(() => assertResearchSessionTransition("completed", "drawing"))
      .toThrow("Session 狀態不可由 completed 轉為 drawing。");
  });
});
