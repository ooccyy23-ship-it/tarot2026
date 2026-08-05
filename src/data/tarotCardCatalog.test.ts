import { describe, expect, it } from "vitest";
import { normalizeTarotCardName, tarotCardCatalog } from "./tarotCardCatalog";

describe("tarot card catalog", () => {
  it("contains exactly 78 unique standard cards", () => {
    expect(tarotCardCatalog).toHaveLength(78);
    expect(new Set(tarotCardCatalog.map((card) => card.name)).size).toBe(78);
  });

  it.each([
    ["聖杯九", "聖杯9"],
    ["聖杯王牌", "聖杯1"],
    ["聖杯Ace", "聖杯1"],
    ["聖杯Ａ", "聖杯1"],
    ["聖杯１", "聖杯1"],
    ["錢幣1", "星幣1"],
    ["金幣國王", "星幣國王"],
    ["女教皇", "女祭司"],
    ["法王", "教皇"],
    ["審判者", "審判"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeTarotCardName(input)).toBe(expected);
  });
});
