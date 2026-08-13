import { describe, expect, it } from "vitest";
import type { ParsedTarotRecord } from "../types/tarotRecord";
import {
  buildTarotCooccurrenceEdges,
  buildTarotCooccurrencePartners,
  calculateTarotCooccurrenceMatrix,
  findTarotCooccurrenceGroups,
} from "./tarotRecordCooccurrence";

function record(groupId: string, cardName: string, questionOrder: number): ParsedTarotRecord {
  return {
    id: `${groupId}-${questionOrder}`,
    groupId,
    observationDate: groupId === "G2" ? "2026-08-07" : "2026-08-06",
    observationTime: "20:23",
    observationDateTime: "2026-08-06T20:23:00",
    groupTitle: `題組 ${groupId}`,
    questionOrder,
    questionText: `問題 ${questionOrder}`,
    cardName,
    normalizedCardName: cardName,
    arcanaType: cardName === "愚者" ? "major" : "minor",
    suit: cardName === "愚者" ? "major" : "cups",
    rank: cardName.replace(/[^0-9]/g, "") || cardName,
    orientation: "upright",
    orientationLabel: "正位",
    createdAt: "2026-08-06T20:24:00.000Z",
  };
}

describe("tarot record co-occurrence", () => {
  const records = [
    record("G1", "愚者", 1),
    record("G1", "聖杯3", 2),
    record("G1", "權杖2", 3),
    record("G2", "愚者", 1),
    record("G2", "聖杯3", 2),
    record("G2", "寶劍6", 3),
  ];

  it("counts a card pair once per group and mirrors the matrix", () => {
    const matrix = calculateTarotCooccurrenceMatrix(records, 8);
    const fool = matrix.cards.findIndex((card) => card.cardName === "愚者");
    const cupsThree = matrix.cards.findIndex((card) => card.cardName === "聖杯3");
    expect(matrix.totalGroups).toBe(2);
    expect(matrix.counts[fool][cupsThree]).toBe(2);
    expect(matrix.counts[cupsThree][fool]).toBe(2);
    expect(matrix.counts[fool][fool]).toBe(0);
  });

  it("does not count duplicate card rows twice inside one group", () => {
    const matrix = calculateTarotCooccurrenceMatrix([
      ...records,
      record("G1", "愚者", 4),
    ]);
    const fool = matrix.cards.findIndex((card) => card.cardName === "愚者");
    const cupsThree = matrix.cards.findIndex((card) => card.cardName === "聖杯3");
    expect(matrix.cards[fool].groupCount).toBe(2);
    expect(matrix.counts[fool][cupsThree]).toBe(2);
  });

  it("selects the most frequent cards and uses tarot order for ties", () => {
    const matrix = calculateTarotCooccurrenceMatrix(records, 3);
    expect(matrix.cards.map((card) => card.cardName)).toEqual(["愚者", "聖杯3", "權杖2"]);
  });

  it("returns matching source groups newest first", () => {
    const groups = findTarotCooccurrenceGroups(records, "愚者", "聖杯3");
    expect(groups.map((group) => group.groupId)).toEqual(["G2", "G1"]);
    expect(groups[0].records.map((item) => item.questionOrder)).toEqual([1, 2, 3]);
  });

  it("builds each undirected network edge once and applies the threshold", () => {
    const matrix = calculateTarotCooccurrenceMatrix(records, 8);
    const allEdges = buildTarotCooccurrenceEdges(matrix);
    const strongEdges = buildTarotCooccurrenceEdges(matrix, 2);
    expect(allEdges.every((edge) => edge.sourceIndex < edge.targetIndex)).toBe(true);
    expect(strongEdges).toHaveLength(1);
    expect(strongEdges[0].count).toBe(2);
  });

  it("ranks partners from the existing matrix and excludes the selected card", () => {
    const matrix = calculateTarotCooccurrenceMatrix(records, 78);
    const partners = buildTarotCooccurrencePartners(matrix, "愚者", 1, 10);
    expect(partners.map((partner) => [partner.cardName, partner.cooccurrenceCount])).toEqual([
      ["聖杯3", 2],
      ["權杖2", 1],
      ["寶劍6", 1],
    ]);
    expect(partners.some((partner) => partner.cardName === "愚者")).toBe(false);
  });

  it("shares the minimum threshold and Top 10 limit", () => {
    const matrix = calculateTarotCooccurrenceMatrix(records, 78);
    expect(buildTarotCooccurrencePartners(matrix, "愚者", 2, 10)).toHaveLength(1);
    expect(buildTarotCooccurrencePartners(matrix, "愚者", 3, 10)).toEqual([]);
  });
});
