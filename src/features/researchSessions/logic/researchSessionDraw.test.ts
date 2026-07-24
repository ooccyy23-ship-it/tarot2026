import { describe, expect, it } from "vitest";
import type { DrawResult } from "../../observations/types/observation";
import {
  advanceResearchDrawProgress,
  buildLockedResearchSetResult,
  canOpenResearchSet,
  createResearchDrawContext,
  getResearchSetConfig,
  researchSetResultToDrawResult,
} from "./researchSessionDraw";

function drawResult(
  drawTime: string,
  selectedWeekday: number,
  seed: number,
): DrawResult {
  return {
    drawTime,
    selectedWeekday,
    sequences: [1, 2, 3, 4, 5].map((value) => value + seed),
    completedAt: `2026-07-2${seed}T01:00:00.000Z`,
    cards: [1, 2, 3, 4, 5].map((position) => ({
      position,
      questionId: `q${position}`,
      sequence: position + seed,
      cardNumber: position + seed,
      cardName: `牌 ${position + seed}`,
      coinSide: position % 2 === 0 ? "tails" as const : "heads" as const,
      orientation: position % 2 === 0 ? "reversed" as const : "upright" as const,
      orientationLabel: position % 2 === 0 ? "逆位" as const : "正位" as const,
      startedAt: `2026-07-2${seed}T01:00:0${position}.000Z`,
      stoppedAt: `2026-07-2${seed}T01:00:1${position}.000Z`,
      durationMs: position * 100,
    })),
  };
}

describe("seven-day research draw flow", () => {
  it("captures a fresh device time and independent result for every set", () => {
    const times = [
      new Date("2026-07-24T01:01:01.000Z"),
      new Date("2026-07-24T01:02:02.000Z"),
      new Date("2026-07-24T01:03:03.000Z"),
    ];
    const results = (["A", "B", "C"] as const).map((setId, index) => {
      const context = createResearchDrawContext(times[index]);
      return buildLockedResearchSetResult(
        getResearchSetConfig(setId),
        context,
        drawResult(context.drawTime, times[index].getDay(), index),
        times[index].toISOString(),
      );
    });

    expect(new Set(results.map((result) => result.drawTimestamp)).size).toBe(3);
    expect(results[0].cards).not.toBe(results[1].cards);
    expect(results[1].cards).not.toBe(results[2].cards);
    expect(results[0].sequences).not.toEqual(results[1].sequences);
    expect(results.flatMap((result) => result.cards)).toHaveLength(15);
  });

  it("does not allow B or C before previous sets are complete", () => {
    expect(canOpenResearchSet("A", [])).toBe(true);
    expect(canOpenResearchSet("B", [])).toBe(false);
    expect(() => advanceResearchDrawProgress("drawing", [], "B"))
      .toThrow("目前應抽題組 A");

    const afterA = advanceResearchDrawProgress("drawing", [], "A");
    expect(afterA.currentSet).toBe("B");
    expect(() => advanceResearchDrawProgress("drawing", afterA.completedSets, "C"))
      .toThrow("目前應抽題組 B");
  });

  it("prevents a locked set from being advanced a second time", () => {
    const afterA = advanceResearchDrawProgress("drawing", [], "A");
    expect(() => advanceResearchDrawProgress("drawing", afterA.completedSets, "A"))
      .toThrow("目前應抽題組 B");
  });

  it("restores the same five-card result after serialization", () => {
    const context = createResearchDrawContext(new Date("2026-07-24T01:01:01.000Z"));
    const locked = buildLockedResearchSetResult(
      getResearchSetConfig("A"),
      context,
      drawResult(context.drawTime, 5, 0),
      "2026-07-24T01:05:00.000Z",
    );
    const restored = researchSetResultToDrawResult(structuredClone(locked));

    expect(restored.sequences).toEqual(locked.sequences);
    expect(restored.cards.map((card) => card.cardName))
      .toEqual(locked.cards.map((card) => card.cardNameZh));
    expect(restored.completedAt).toBe(locked.lockedAt);
  });

  it("moves to observing only after C is completed", () => {
    const afterA = advanceResearchDrawProgress("drawing", [], "A");
    const afterB = advanceResearchDrawProgress("drawing", afterA.completedSets, "B");
    const afterC = advanceResearchDrawProgress("drawing", afterB.completedSets, "C");

    expect(afterA.status).toBe("drawing");
    expect(afterB.status).toBe("drawing");
    expect(afterC.status).toBe("observing");
    expect(afterC.completedSets).toEqual(["A", "B", "C"]);
  });
});
