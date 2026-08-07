import { describe, expect, it } from "vitest";
import type { ParsedTarotRecord } from "../types/tarotRecord";
import { calculateTarotRecordTrend } from "./tarotRecordTrend";

function record(groupId: string, date: string, cardName: string, questionOrder = 1): ParsedTarotRecord {
  return {
    id: `${groupId}-${questionOrder}-${cardName}`,
    groupId,
    observationDate: date,
    observationTime: "20:23",
    observationDateTime: `${date}T20:23:00`,
    groupTitle: groupId,
    questionOrder,
    questionText: `問題 ${questionOrder}`,
    cardName,
    normalizedCardName: cardName,
    arcanaType: "major",
    suit: "major",
    rank: cardName,
    orientation: "upright",
    orientationLabel: "正位",
    createdAt: `${date}T20:24:00.000Z`,
  };
}

describe("tarot record time trend", () => {
  const records = [
    record("G1", "2026-08-05", "愚者"),
    record("G2", "2026-08-07", "愚者"),
    record("G2", "2026-08-07", "皇帝", 2),
    record("G3", "2026-08-08", "皇帝"),
    record("OLD", "2026-07-20", "女祭司"),
  ];

  it("fills dates without records with zero", () => {
    const trend = calculateTarotRecordTrend(records, 4, 5, "2026-08-08");
    expect(trend.dateFrom).toBe("2026-08-05");
    expect(trend.dateTo).toBe("2026-08-08");
    expect(trend.series.find((item) => item.cardName === "愚者")?.points.map((point) => point.count)).toEqual([1, 0, 1, 0]);
  });

  it("ranks cards by total occurrences inside the selected range", () => {
    const trend = calculateTarotRecordTrend([...records, record("G4", "2026-08-08", "皇帝", 2)], 4, 1, "2026-08-08");
    expect(trend.series).toHaveLength(1);
    expect(trend.series[0]).toMatchObject({ cardName: "皇帝", totalCount: 3 });
  });

  it("excludes records outside the selected range", () => {
    const trend = calculateTarotRecordTrend(records, 4, 5, "2026-08-08");
    expect(trend.totalRecords).toBe(4);
    expect(trend.totalGroups).toBe(3);
    expect(trend.series.some((item) => item.cardName === "女祭司")).toBe(false);
  });

  it("uses the latest valid record date when no end date is supplied", () => {
    const trend = calculateTarotRecordTrend(records, 2);
    expect(trend.dateTo).toBe("2026-08-08");
    expect(trend.dateFrom).toBe("2026-08-07");
  });

  it("returns an empty result when no valid observation date exists", () => {
    const trend = calculateTarotRecordTrend([record("BAD", "invalid", "愚者")]);
    expect(trend.series).toEqual([]);
    expect(trend.dateFrom).toBe("");
  });
});
