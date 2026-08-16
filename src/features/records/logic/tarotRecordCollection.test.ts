import { describe, expect, it } from "vitest";
import type { ParsedTarotRecord } from "../types/tarotRecord";
import {
  DEFAULT_TAROT_RECORD_FILTERS,
  filterTarotRecords,
  paginateTarotRecords,
  resolveUniqueGroupId,
  sortTarotRecordsNewest,
} from "./tarotRecordCollection";

function record(overrides: Partial<ParsedTarotRecord>): ParsedTarotRecord {
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

describe("tarot record collection helpers", () => {
  it("filters by keyword, date and card metadata", () => {
    const records = [record({}), record({ id: "GRP-2-01", groupId: "GRP-2", cardName: "惡魔", normalizedCardName: "惡魔", arcanaType: "major", suit: "major", rank: "惡魔", orientation: "reversed", orientationLabel: "逆位", observationDate: "2026-08-06" })];
    expect(filterTarotRecords(records, { ...DEFAULT_TAROT_RECORD_FILTERS, keyword: "聯繫", orientation: "upright" })).toHaveLength(1);
    expect(filterTarotRecords(records, { ...DEFAULT_TAROT_RECORD_FILTERS, dateFrom: "2026-08-06", arcanaType: "major" })[0].groupId).toBe("GRP-2");
  });

  it("treats legacy records as questioned and filters open observations separately", () => {
    const records = [record({}), record({ id: "OPEN-01", groupId: "OPEN", recordType: "open_observation", groupTitle: "", questionText: "" })];
    expect(filterTarotRecords(records, { ...DEFAULT_TAROT_RECORD_FILTERS, recordType: "questioned" })).toHaveLength(1);
    expect(filterTarotRecords(records, { ...DEFAULT_TAROT_RECORD_FILTERS, recordType: "open_observation" })[0].id).toBe("OPEN-01");
  });

  it("sorts newest first and paginates safely", () => {
    const records = Array.from({ length: 30 }, (_, index) => record({ id: String(index), observationDateTime: `2026-08-${String(index + 1).padStart(2, "0")}T22:07:00` }));
    const sorted = sortTarotRecordsNewest(records);
    expect(sorted[0].id).toBe("29");
    expect(paginateTarotRecords(sorted, 2, 25)).toMatchObject({ page: 2, totalPages: 2, total: 30 });
    expect(paginateTarotRecords(sorted, 99, 25).records).toHaveLength(5);
  });

  it("adds an incremental suffix when a group id already exists", async () => {
    const existing = new Set(["GRP-20260805-2207", "GRP-20260805-2207-02"]);
    await expect(resolveUniqueGroupId("GRP-20260805-2207", async (id) => existing.has(id)))
      .resolves.toBe("GRP-20260805-2207-03");
  });
});
