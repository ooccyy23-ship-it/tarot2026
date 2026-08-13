import { describe, expect, it } from "vitest";
import {
  analyticsScopeSummary,
  buildRecordsHash,
  cardNameFromStableId,
  filterRecordsByContainedCards,
  parseRecordFiltersFromHash,
  readTarotRecordViewState,
  summarizeFilteredRecords,
  TAROT_RECORD_VIEW_STATE_KEY,
} from "./tarotRecordNavigation";
import type { ParsedTarotRecord } from "../types/tarotRecord";

function record(id: string, groupId: string, date: string): ParsedTarotRecord {
  return {
    id, groupId, observationDate: date, observationTime: "12:00", observationDateTime: `${date}T12:00:00+08:00`,
    groupTitle: "測試題組", questionOrder: 1, questionText: "題目", cardName: "聖杯6", normalizedCardName: "聖杯6",
    arcanaType: "minor", suit: "cups", rank: "6", orientation: "reversed", orientationLabel: "逆位", createdAt: "",
  };
}

describe("tarotRecordNavigation", () => {
  it("builds and parses stable record filters", () => {
    const hash = buildRecordsHash({ cardName: "聖杯6", orientation: "reversed", dateFrom: "2026-08-01", dateTo: "2026-08-12" });
    expect(hash).toContain("cardId=TAROT_41");
    const parsed = parseRecordFiltersFromHash(hash);
    expect(parsed.filters.cardName).toBe("聖杯6");
    expect(parsed.filters.orientation).toBe("reversed");
    expect(parsed.invalidParameters).toEqual([]);
    expect(cardNameFromStableId("TAROT_41")).toBe("聖杯6");
  });

  it("ignores invalid query values instead of crashing", () => {
    const parsed = parseRecordFiltersFromHash("#/records?orientation=sideways&cardId=unknown&from=today");
    expect(parsed.filters.orientation).toBe("");
    expect(parsed.filters.cardName).toBe("");
    expect(parsed.invalidParameters).toEqual(["from", "cardId", "orientation"]);
  });

  it("uses stable card IDs for two-card drill-down and restores the pair", () => {
    const hash = buildRecordsHash(
      { dateFrom: "2026-08-01", dateTo: "2026-08-12" },
      ["愚者", "聖杯6"],
    );
    expect(hash).toContain("containsCard=TAROT_00");
    expect(hash).toContain("containsCard=TAROT_41");
    expect(parseRecordFiltersFromHash(hash).containsCardNames).toEqual(["愚者", "聖杯6"]);
  });

  it("returns complete groups that contain both selected cards", () => {
    const records = [
      { ...record("1", "A", "2026-08-01"), normalizedCardName: "愚者", cardName: "愚者" },
      record("2", "A", "2026-08-01"),
      { ...record("3", "A", "2026-08-01"), normalizedCardName: "權杖2", cardName: "權杖2" },
      { ...record("4", "B", "2026-08-02"), normalizedCardName: "愚者", cardName: "愚者" },
    ];
    expect(filterRecordsByContainedCards(records, ["愚者", "聖杯6"]).map((item) => item.id)).toEqual(["1", "2", "3"]);
  });

  it("rejects incompatible stored view-state versions", () => {
    const storage = { getItem: (key: string) => key === TAROT_RECORD_VIEW_STATE_KEY ? '{"version":2}' : null } as Storage;
    expect(readTarotRecordViewState(storage)).toBeNull();
  });

  it("distinguishes appearances from involved groups and summarizes analytics range", () => {
    const records = [record("1", "A", "2026-08-01"), record("2", "A", "2026-08-01"), record("3", "B", "2026-08-12")];
    expect(summarizeFilteredRecords(records)).toEqual({ appearances: 3, groups: 2 });
    expect(analyticsScopeSummary(records, new Date("2026-08-12T14:00:00+08:00"))).toMatchObject({
      cardCount: 3, groupCount: 2, dateFrom: "2026-08-01", dateTo: "2026-08-12",
    });
  });
});
