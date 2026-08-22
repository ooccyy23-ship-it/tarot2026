import { describe, expect, it } from "vitest";
import type { ParsedTarotRecord } from "../../records/types/tarotRecord";
import { CALENDAR_WEEK_MONDAY_STRATEGY, calculateTrendAnalysis, getTrendCardDetails } from "./trendAnalysis";
import type { TrendMappingCategory } from "../types/trendAnalysis";

function record(id: string, date: string, groupId: string, cardName = "聖杯皇后", orientation: "upright" | "reversed" = "upright"): ParsedTarotRecord {
  return {
    id, groupId, observationDate: date, observationTime: "12:00", observationDateTime: `${date}T12:00:00+08:00`,
    groupTitle: "正式題組", questionOrder: 1, questionText: "題目", cardName, normalizedCardName: cardName,
    arcanaType: "minor", suit: "cups", rank: "皇后", orientation, orientationLabel: orientation === "upright" ? "正位" : "逆位", createdAt: "",
  };
}

const category = (item: ParsedTarotRecord): TrendMappingCategory => item.cardName.startsWith("情") ? "EMOTIONAL_CONNECTION"
  : item.cardName.startsWith("行") ? "ACTION_MOMENTUM"
    : item.cardName.startsWith("防") ? "DEFENSE_LIMITATION" : "UNASSIGNED";

describe("trendAnalysis", () => {
  it("groups fixed Monday-Sunday periods and marks clipped periods", () => {
    expect(CALENDAR_WEEK_MONDAY_STRATEGY.getWindow("2026-08-19")).toEqual({ start: "2026-08-17", end: "2026-08-23" });
    const result = calculateTrendAnalysis([record("1", "2026-08-19", "A")], "2026-08-19", "2026-08-22");
    expect(result.periods).toHaveLength(1);
    expect(result.periods[0]).toMatchObject({ periodStart: "2026-08-19", periodEnd: "2026-08-22", isPartial: true });
  });

  it("uses normalized share when period sizes differ and ignores orientation", () => {
    const records = [
      record("1", "2026-08-03", "A", "情1", "upright"), record("2", "2026-08-03", "A", "行1"),
      record("3", "2026-08-10", "B", "情2", "reversed"), record("4", "2026-08-10", "B", "情3"),
      ...Array.from({ length: 8 }, (_, index) => record(`x${index}`, "2026-08-10", `X${index}`, "行2")),
    ];
    const result = calculateTrendAnalysis(records, "2026-08-03", "2026-08-16", CALENDAR_WEEK_MONDAY_STRATEGY, category);
    expect(result.periods[0].constructMetrics.EMOTIONAL_CONNECTION.share).toBe(50);
    expect(result.periods[1].constructMetrics.EMOTIONAL_CONNECTION.count).toBe(2);
    expect(result.periods[1].constructMetrics.EMOTIONAL_CONNECTION.share).toBe(20);
    expect(result.periods[1].constructMetrics.EMOTIONAL_CONNECTION.direction).toBe("DOWN");
  });

  it("can report a rising share even when the raw count falls", () => {
    const records = [
      ...Array.from({ length: 4 }, (_, index) => record(`e1-${index}`, "2026-08-03", `E1-${index}`, "情1")),
      ...Array.from({ length: 6 }, (_, index) => record(`a1-${index}`, "2026-08-03", `A1-${index}`, "行1")),
      ...Array.from({ length: 3 }, (_, index) => record(`e2-${index}`, "2026-08-10", `E2-${index}`, "情2")),
      record("a2", "2026-08-10", "A2", "行2"),
    ];
    const result = calculateTrendAnalysis(records, "2026-08-03", "2026-08-16", CALENDAR_WEEK_MONDAY_STRATEGY, category);
    expect(result.periods[0].constructMetrics.EMOTIONAL_CONNECTION).toMatchObject({ count: 4, share: 40 });
    expect(result.periods[1].constructMetrics.EMOTIONAL_CONNECTION).toMatchObject({ count: 3, share: 75, changePp: 35, direction: "UP" });
  });

  it("preserves top ties, identifies new constructs, and excludes unassigned from denominator", () => {
    const records = [
      record("1", "2026-08-03", "A", "情1"), record("2", "2026-08-03", "A", "行1"), record("3", "2026-08-03", "A", "未知"),
      record("4", "2026-08-10", "B", "情2"), record("5", "2026-08-10", "B", "防1"),
    ];
    const result = calculateTrendAnalysis(records, "2026-08-03", "2026-08-16", CALENDAR_WEEK_MONDAY_STRATEGY, category);
    expect(result.periods[0].mappedCards).toBe(2);
    expect(result.periods[0].unassignedCount).toBe(1);
    expect(result.periods[0].topConstructs).toEqual(["EMOTIONAL_CONNECTION", "ACTION_MOMENTUM"]);
    expect(result.periods[1].constructMetrics.DEFENSE_LIMITATION.direction).toBe("NEW");
  });

  it("keeps continuous empty weeks and does not fabricate values", () => {
    const result = calculateTrendAnalysis([record("1", "2026-08-03", "A", "未知")], "2026-08-03", "2026-08-23", CALENDAR_WEEK_MONDAY_STRATEGY, category);
    expect(result.periods).toHaveLength(3);
    expect(result.periods[1].totalCards).toBe(0);
    expect(result.periods[1].constructMetrics.EMOTIONAL_CONNECTION.share).toBeNull();
    expect(result.summary.currentTop).toBeNull();
  });

  it("drills from a construct to cards and involved groups", () => {
    const result = calculateTrendAnalysis([
      record("1", "2026-08-03", "A"), record("2", "2026-08-03", "A"), record("3", "2026-08-04", "B"),
    ], "2026-08-03", "2026-08-09");
    expect(getTrendCardDetails(result.periods[0], "EMOTIONAL_CONNECTION")).toEqual([
      expect.objectContaining({ cardId: "TAROT_48", cardName: "聖杯皇后", count: 3, groupCount: 2, constructShare: 100 }),
    ]);
  });
});
