import { describe, expect, it } from "vitest";
import type { ParsedTarotRecord } from "../types/tarotRecord";
import { createTarotRecordsCsv, tarotRecordsCsvFilename } from "./tarotRecordCsv";

const record: ParsedTarotRecord = {
  id: "GRP-1-01",
  groupId: "GRP-1",
  observationDate: "2026-08-05",
  observationTime: "22:07",
  observationDateTime: "2026-08-05T22:07:00",
  groupTitle: "情感本質觀測",
  questionOrder: 1,
  questionText: "對方說：\"你好\"嗎？",
  cardName: "聖杯3",
  normalizedCardName: "聖杯3",
  arcanaType: "minor",
  suit: "cups",
  rank: "3",
  orientation: "upright",
  orientationLabel: "正位",
  createdAt: "2026-08-05T22:08:00.000Z",
};

describe("tarot record CSV", () => {
  it("exports UTF-8 BOM, Chinese text and escaped quotes", () => {
    const csv = createTarotRecordsCsv([record]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("情感本質觀測");
    expect(csv).toContain('"對方說：""你好""嗎？"');
  });

  it("uses a stable date-based filename", () => {
    expect(tarotRecordsCsvFilename(new Date(2026, 7, 6))).toBe("tarot-records-20260806.csv");
  });
});
