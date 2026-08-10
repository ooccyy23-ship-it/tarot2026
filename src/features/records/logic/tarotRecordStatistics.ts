import { tarotCardCatalog } from "../../../data/tarotCardCatalog";
import type {
  ParsedTarotRecord,
  TarotArcanaType,
  TarotSuit,
} from "../types/tarotRecord";

export type TarotCardFrequency = {
  order: number;
  cardName: string;
  arcanaType: TarotArcanaType;
  suit: TarotSuit;
  totalCount: number;
  uprightCount: number;
  reversedCount: number;
  percentage: number;
  recentDate: string;
};

export type TarotSuitCount = {
  suit: Exclude<TarotSuit, "major">;
  count: number;
  percentage: number;
};

export type TarotMonthCount = {
  month: string;
  count: number;
};

export type TarotRecordStatistics = {
  totalRecords: number;
  uniqueCards: number;
  uprightCount: number;
  uprightPercentage: number;
  reversedCount: number;
  reversedPercentage: number;
  majorCount: number;
  majorPercentage: number;
  minorCount: number;
  minorPercentage: number;
  frequencies: TarotCardFrequency[];
  ranking: TarotCardFrequency[];
  suitDistribution: TarotSuitCount[];
  monthlyCounts: TarotMonthCount[];
};

export type TarotFrequencySortKey =
  | "order"
  | "totalCount"
  | "uprightCount"
  | "reversedCount"
  | "recentDate";

function percentage(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 1000) / 10;
}

export function buildTarotCardFrequencyTable(records: ParsedTarotRecord[]): TarotCardFrequency[] {
  const totalRecords = records.length;
  return tarotCardCatalog.map((card) => {
    const matches = records.filter((record) => record.normalizedCardName === card.name);
    const uprightCount = matches.filter((record) => record.orientation === "upright").length;
    const reversedCount = matches.filter((record) => record.orientation === "reversed").length;
    const recentDate = matches.reduce(
      (latest, record) => record.observationDate > latest ? record.observationDate : latest,
      "",
    );
    return {
      order: card.order,
      cardName: card.name,
      arcanaType: card.arcanaType,
      suit: card.suit,
      totalCount: matches.length,
      uprightCount,
      reversedCount,
      percentage: percentage(matches.length, totalRecords),
      recentDate,
    };
  });
}

export function sortTarotCardFrequencies(
  frequencies: TarotCardFrequency[],
  sortKey: TarotFrequencySortKey,
  direction: "asc" | "desc",
): TarotCardFrequency[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...frequencies].sort((left, right) => {
    const leftValue = left[sortKey];
    const rightValue = right[sortKey];
    const compared = typeof leftValue === "number" && typeof rightValue === "number"
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue));
    if (compared !== 0) return compared * factor;
    return left.order - right.order;
  });
}

export function calculateTarotRecordStatistics(records: ParsedTarotRecord[]): TarotRecordStatistics {
  const totalRecords = records.length;
  const uprightCount = records.filter((record) => record.orientation === "upright").length;
  const reversedCount = records.filter((record) => record.orientation === "reversed").length;
  const majorCount = records.filter((record) => record.arcanaType === "major").length;
  const minorCount = records.filter((record) => record.arcanaType === "minor").length;
  const frequencies = buildTarotCardFrequencyTable(records);
  const ranking = [...frequencies]
    .filter((row) => row.totalCount > 0)
    .sort((left, right) => right.totalCount - left.totalCount || left.order - right.order);
  const minorTotal = records.filter((record) => record.suit !== "major").length;
  const suits: TarotSuitCount["suit"][] = ["cups", "swords", "wands", "pentacles"];
  const suitDistribution = suits.map((suit) => {
    const count = records.filter((record) => record.suit === suit).length;
    return { suit, count, percentage: percentage(count, minorTotal) };
  });
  const monthCounts = new Map<string, number>();
  records.forEach((record) => {
    const month = record.observationDate.slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(month)) monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
  });

  return {
    totalRecords,
    uniqueCards: frequencies.filter((row) => row.totalCount > 0).length,
    uprightCount,
    uprightPercentage: percentage(uprightCount, totalRecords),
    reversedCount,
    reversedPercentage: percentage(reversedCount, totalRecords),
    majorCount,
    majorPercentage: percentage(majorCount, totalRecords),
    minorCount,
    minorPercentage: percentage(minorCount, totalRecords),
    frequencies,
    ranking,
    suitDistribution,
    monthlyCounts: [...monthCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([month, count]) => ({ month, count })),
  };
}
