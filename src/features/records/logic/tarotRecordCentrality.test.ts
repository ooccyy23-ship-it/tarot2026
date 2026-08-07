import { describe, expect, it } from "vitest";
import type { ParsedTarotRecord } from "../types/tarotRecord";
import { calculateTarotCardCentrality } from "./tarotRecordCentrality";

function record(groupId: string, cardName: string, questionOrder: number): ParsedTarotRecord {
  return {
    id: `${groupId}-${questionOrder}-${cardName}`,
    groupId,
    observationDate: "2026-08-08",
    observationTime: "20:23",
    observationDateTime: "2026-08-08T20:23:00",
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
    createdAt: "2026-08-08T20:24:00.000Z",
  };
}

function metric(records: ParsedTarotRecord[], cardName: string, minimumCount = 1) {
  return calculateTarotCardCentrality(records, minimumCount).cards.find((card) => card.cardName === cardName);
}

describe("tarot record centrality", () => {
  const star = [
    record("G1", "愚者", 1), record("G1", "皇帝", 2),
    record("G2", "愚者", 1), record("G2", "女祭司", 2),
    record("G3", "愚者", 1), record("G3", "隱者", 2),
  ];

  it("identifies the center of a star network", () => {
    const center = metric(star, "愚者");
    expect(center).toMatchObject({ degree: 3, weightedDegree: 3 });
    expect(center?.betweenness).toBeCloseTo(1);
    expect(center?.closeness).toBeCloseTo(1);
  });

  it("normalizes leaf centrality", () => {
    const leaf = metric(star, "皇帝");
    expect(leaf).toMatchObject({ degree: 1, weightedDegree: 1, betweenness: 0 });
    expect(leaf?.closeness).toBeCloseTo(2 / 3);
  });

  it("keeps isolated cards at zero centrality", () => {
    const isolated = metric([...star, record("ONLY", "月亮", 1)], "月亮");
    expect(isolated).toMatchObject({ degree: 0, weightedDegree: 0, betweenness: 0, closeness: 0 });
  });

  it("applies the minimum co-occurrence threshold", () => {
    const repeated = [...star, record("G4", "愚者", 1), record("G4", "皇帝", 2)];
    const result = calculateTarotCardCentrality(repeated, 2);
    expect(result.connectedCards).toBe(2);
    expect(metric(repeated, "愚者", 2)?.degree).toBe(1);
    expect(metric(repeated, "女祭司", 2)?.degree).toBe(0);
  });
});
