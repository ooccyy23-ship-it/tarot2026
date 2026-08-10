import { describe, expect, it } from "vitest";
import {
  buildRecentDailySummary,
  calculateDailyHighFrequencyCards,
  calculateDailyTarotStatistics,
  filterDailyStatisticsByRange,
  getTaipeiDateKey,
} from "./tarotRecordDailyStatistics";
import type { ParsedTarotRecord } from "../types/tarotRecord";

function record(overrides: Partial<ParsedTarotRecord> = {}): ParsedTarotRecord {
  return {
    id: "G1-01",
    groupId: "G1",
    observationDate: "2026-08-10",
    observationTime: "00:30",
    observationDateTime: "2026-08-10T00:30:00",
    groupTitle: "測試題組",
    questionOrder: 1,
    questionText: "測試問題",
    cardName: "愚者",
    normalizedCardName: "愚者",
    arcanaType: "major",
    suit: "major",
    rank: "愚者",
    orientation: "upright",
    orientationLabel: "正位",
    createdAt: "2026-08-10T00:31:00",
    ...overrides,
  };
}

describe("tarotRecordDailyStatistics", () => {
  it("groups existing records by local observation date and group", () => {
    const statistics = calculateDailyTarotStatistics([
      record(),
      record({ id: "G1-02", questionOrder: 2, cardName: "聖杯1", normalizedCardName: "聖杯1", arcanaType: "minor", suit: "cups", rank: "1", orientation: "reversed", orientationLabel: "逆位" }),
      record({ id: "G2-01", groupId: "G2", observationTime: "13:20", observationDateTime: "2026-08-10T13:20:00" }),
    ]);

    expect(statistics[0]).toMatchObject({
      date: "2026-08-10",
      totalCount: 3,
      groupCount: 2,
      uprightCount: 2,
      reversedCount: 1,
      majorCount: 2,
      minorCount: 1,
    });
    expect(statistics[0].groups[0].groupId).toBe("G2");
    expect(statistics[0].groups[1].cards.map((card) => card.questionOrder)).toEqual([1, 2]);
  });

  it("fills missing dates with zero in the recent seven-day summary", () => {
    const now = new Date("2026-08-10T04:00:00.000Z");
    const summary = buildRecentDailySummary([
      record(),
      record({ id: "G0-01", groupId: "G0", observationDate: "2026-08-04", observationDateTime: "2026-08-04T12:00:00" }),
    ], now);

    expect(summary.days.map((day) => day.date)).toEqual([
      "2026-08-04", "2026-08-05", "2026-08-06", "2026-08-07", "2026-08-08", "2026-08-09", "2026-08-10",
    ]);
    expect(summary.days.map((day) => day.count)).toEqual([1, 0, 0, 0, 0, 0, 1]);
    expect(summary).toMatchObject({ totalCount: 2, dailyAverage: 0.3, highestCount: 1, highestDate: "2026-08-10" });
  });

  it("uses Asia/Taipei when determining today", () => {
    expect(getTaipeiDateKey(new Date("2026-08-09T16:30:00.000Z"))).toBe("2026-08-10");
  });

  it("combines upright and reversed occurrences when calculating the daily top three", () => {
    const cards = calculateDailyHighFrequencyCards([
      record({ id: "A1", normalizedCardName: "聖杯5", cardName: "聖杯5" }),
      record({ id: "A2", normalizedCardName: "聖杯5", cardName: "聖杯5", orientation: "reversed", orientationLabel: "逆位" }),
      record({ id: "B1", normalizedCardName: "正義", cardName: "正義" }),
      record({ id: "C1", normalizedCardName: "權杖騎士", cardName: "權杖騎士" }),
      record({ id: "D1", normalizedCardName: "世界", cardName: "世界" }),
    ]);

    expect(cards).toEqual([
      { cardName: "聖杯5", count: 2 },
      { cardName: "正義", count: 1 },
      { cardName: "世界", count: 1 },
    ]);
  });

  it("filters 7 and 30 calendar days while all keeps every recorded day", () => {
    const now = new Date("2026-08-10T04:00:00.000Z");
    const statistics = calculateDailyTarotStatistics([
      record(),
      record({ id: "G7", groupId: "G7", observationDate: "2026-08-04", observationDateTime: "2026-08-04T12:00:00" }),
      record({ id: "G8", groupId: "G8", observationDate: "2026-08-03", observationDateTime: "2026-08-03T12:00:00" }),
      record({ id: "OLD", groupId: "OLD", observationDate: "2026-06-01", observationDateTime: "2026-06-01T12:00:00" }),
    ]);

    expect(filterDailyStatisticsByRange(statistics, "7", now).map((item) => item.date)).toEqual(["2026-08-10", "2026-08-04"]);
    expect(filterDailyStatisticsByRange(statistics, "30", now)).toHaveLength(3);
    expect(filterDailyStatisticsByRange(statistics, "all", now)).toHaveLength(4);
  });
});
