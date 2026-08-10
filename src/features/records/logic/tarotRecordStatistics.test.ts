import { describe, expect, it } from "vitest";
import type { ParsedTarotRecord } from "../types/tarotRecord";
import {
  buildTarotCardFrequencyTable,
  calculateTarotRecordStatistics,
  sortTarotCardFrequencies,
} from "./tarotRecordStatistics";

function record(overrides: Partial<ParsedTarotRecord> = {}): ParsedTarotRecord {
  return {
    id: "GRP-1-01",
    groupId: "GRP-1",
    observationDate: "2026-08-05",
    observationTime: "22:07",
    observationDateTime: "2026-08-05T22:07:00",
    groupTitle: "主動聯繫",
    questionOrder: 1,
    questionText: "是否主動聯繫？",
    cardName: "聖杯3",
    normalizedCardName: "聖杯3",
    arcanaType: "minor",
    suit: "cups",
    rank: "3",
    orientation: "upright",
    orientationLabel: "正位",
    createdAt: "2026-08-05T22:08:00.000Z",
    ...overrides,
  };
}

describe("tarot record statistics", () => {
  it("does not treat upright and reversed as different cards", () => {
    const stats = calculateTarotRecordStatistics([
      record(),
      record({ id: "GRP-1-02", orientation: "reversed", orientationLabel: "逆位" }),
    ]);
    const cupsThree = stats.frequencies.find((row) => row.cardName === "聖杯3");
    expect(stats.uniqueCards).toBe(1);
    expect(cupsThree).toMatchObject({ totalCount: 2, uprightCount: 1, reversedCount: 1 });
  });

  it("always returns a complete 78-card table including zero counts", () => {
    const table = buildTarotCardFrequencyTable([]);
    expect(table).toHaveLength(78);
    expect(table.every((row) => row.totalCount === 0)).toBe(true);
  });

  it("calculates summary, suit and monthly counts", () => {
    const stats = calculateTarotRecordStatistics([
      record(),
      record({ id: "2", normalizedCardName: "惡魔", cardName: "惡魔", arcanaType: "major", suit: "major", rank: "惡魔", orientation: "reversed", orientationLabel: "逆位", observationDate: "2026-09-01" }),
    ]);
    expect(stats).toMatchObject({ totalRecords: 2, uniqueCards: 2, uprightPercentage: 50, majorPercentage: 50 });
    expect(stats.monthlyCounts).toEqual([{ month: "2026-08", count: 1 }, { month: "2026-09", count: 1 }]);
  });

  it("uses minor arcana only as the suit denominator and keeps the fixed suit order", () => {
    const stats = calculateTarotRecordStatistics([
      record(),
      record({ id: "2", normalizedCardName: "聖杯4", cardName: "聖杯4", rank: "4" }),
      record({ id: "3", normalizedCardName: "寶劍2", cardName: "寶劍2", suit: "swords", rank: "2" }),
      record({ id: "4", normalizedCardName: "惡魔", cardName: "惡魔", arcanaType: "major", suit: "major", rank: "惡魔" }),
    ]);

    expect(stats.suitDistribution.map((item) => item.suit)).toEqual(["cups", "swords", "wands", "pentacles"]);
    expect(stats.suitDistribution.map((item) => item.percentage)).toEqual([66.7, 33.3, 0, 0]);
  });

  it("sorts equal counts by standard card order", () => {
    const sorted = sortTarotCardFrequencies(buildTarotCardFrequencyTable([]), "totalCount", "desc");
    expect(sorted.slice(0, 3).map((row) => row.cardName)).toEqual(["愚者", "魔術師", "女祭司"]);
  });
});
