import { describe, expect, it } from "vitest";
import type { ParsedTarotRecord } from "../types/tarotRecord";
import { calculateTarotCardClusters } from "./tarotRecordClustering";

function record(groupId: string, cardName: string, questionOrder: number): ParsedTarotRecord {
  return {
    id: `${groupId}-${questionOrder}-${cardName}`,
    groupId,
    observationDate: "2026-08-07",
    observationTime: "20:23",
    observationDateTime: "2026-08-07T20:23:00",
    groupTitle: groupId,
    questionOrder,
    questionText: `問題 ${questionOrder}`,
    cardName,
    normalizedCardName: cardName,
    arcanaType: cardName === "愚者" || cardName === "皇帝" ? "major" : "minor",
    suit: cardName === "愚者" || cardName === "皇帝" ? "major" : "cups",
    rank: cardName,
    orientation: "upright",
    orientationLabel: "正位",
    createdAt: "2026-08-07T20:24:00.000Z",
  };
}

describe("tarot record clustering", () => {
  const records = [
    record("A1", "愚者", 1), record("A1", "聖杯3", 2), record("A1", "權杖2", 3),
    record("A2", "愚者", 1), record("A2", "聖杯3", 2), record("A2", "權杖2", 3),
    record("B1", "皇帝", 1), record("B1", "寶劍6", 2), record("B1", "星幣5", 3),
    record("B2", "皇帝", 1), record("B2", "寶劍6", 2), record("B2", "星幣5", 3),
  ];

  it("separates disconnected co-occurrence communities", () => {
    const result = calculateTarotCardClusters(records);
    expect(result.clusters).toHaveLength(2);
    expect(result.clusters.map((cluster) => new Set(cluster.cards.map((card) => card.cardName))))
      .toEqual(expect.arrayContaining([
        new Set(["愚者", "聖杯3", "權杖2"]),
        new Set(["皇帝", "寶劍6", "星幣5"]),
      ]));
  });

  it("reports internal weight and the strongest pair", () => {
    const result = calculateTarotCardClusters(records);
    expect(result.clusters.every((cluster) => cluster.internalWeight === 6)).toBe(true);
    expect(result.clusters.every((cluster) => cluster.strongestPair?.count === 2)).toBe(true);
  });

  it("applies the minimum co-occurrence threshold", () => {
    const withWeakBridge = [...records, record("BRIDGE", "愚者", 1), record("BRIDGE", "皇帝", 2)];
    const result = calculateTarotCardClusters(withWeakBridge, 2);
    expect(result.clusters).toHaveLength(2);
    expect(result.clusters.some((cluster) => cluster.cards.some((card) => card.cardName === "愚者") && cluster.cards.some((card) => card.cardName === "皇帝"))).toBe(false);
  });

  it("keeps isolated cards outside generated clusters", () => {
    const result = calculateTarotCardClusters([record("ONLY", "月亮", 1)]);
    expect(result.clusters).toHaveLength(0);
    expect(result.ungroupedCards.map((card) => card.cardName)).toEqual(["月亮"]);
  });
});
