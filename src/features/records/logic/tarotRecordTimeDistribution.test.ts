import { describe, expect, it } from "vitest";
import type { ParsedTarotRecord } from "../types/tarotRecord";
import { calculateDrawTimeDistribution } from "./tarotRecordTimeDistribution";

function record(groupId: string, observationTime: string, questionOrder = 1): ParsedTarotRecord {
  return {
    id: `${groupId}-${questionOrder}`,
    groupId,
    observationDate: "2026-08-21",
    observationTime,
    observationDateTime: `2026-08-21T${observationTime}:00`,
    groupTitle: groupId,
    questionOrder,
    questionText: "測試問題",
    cardName: "愚者",
    normalizedCardName: "愚者",
    arcanaType: "major",
    suit: "major",
    rank: "愚者",
    orientation: "upright",
    orientationLabel: "正位",
    createdAt: "2026-08-21T12:00:00",
  };
}

describe("calculateDrawTimeDistribution", () => {
  it("counts each observation group once instead of counting every card", () => {
    const result = calculateDrawTimeDistribution([
      record("G1", "22:10", 1),
      record("G1", "22:10", 2),
      record("G1", "22:10", 3),
      record("G2", "22:45"),
      record("G3", "09:30"),
    ]);

    expect(result.validGroupCount).toBe(3);
    expect(result.hours[22].count).toBe(2);
    expect(result.peakHour?.rangeLabel).toBe("22:00–22:59");
    expect(result.peakPeriod?.id).toBe("evening");
    expect(result.peakPeriod?.percentage).toBeCloseTo(66.67, 1);
  });

  it("uses fixed four-period boundaries", () => {
    const result = calculateDrawTimeDistribution([
      record("G1", "05:59"),
      record("G2", "06:00"),
      record("G3", "11:59"),
      record("G4", "12:00"),
      record("G5", "17:59"),
      record("G6", "18:00"),
      record("G7", "23:59"),
      record("G8", "00:00"),
    ]);

    expect(result.periods.map((period) => period.count)).toEqual([2, 2, 2, 2]);
    expect(result.peakPeriod?.id).toBe("overnight");
  });

  it("excludes invalid times and reports their group count", () => {
    const result = calculateDrawTimeDistribution([
      record("G1", "22:10"),
      record("G2", "下午 8:10"),
      record("G3", "24:00"),
    ]);

    expect(result.validGroupCount).toBe(1);
    expect(result.invalidGroupCount).toBe(2);
  });

  it("returns a complete zero-filled 24-hour series", () => {
    const result = calculateDrawTimeDistribution([]);

    expect(result.hours).toHaveLength(24);
    expect(result.hours.every((hour) => hour.count === 0)).toBe(true);
    expect(result.peakHour).toBeNull();
    expect(result.peakPeriod).toBeNull();
  });
});
