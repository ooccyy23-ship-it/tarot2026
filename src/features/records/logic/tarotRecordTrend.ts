import { tarotCardCatalog } from "../../../data/tarotCardCatalog";
import type { ParsedTarotRecord } from "../types/tarotRecord";

export type TarotTrendPoint = {
  date: string;
  count: number;
};

export type TarotTrendSeries = {
  cardName: string;
  totalCount: number;
  points: TarotTrendPoint[];
};

export type TarotRecordTrend = {
  dateFrom: string;
  dateTo: string;
  days: number;
  totalRecords: number;
  totalGroups: number;
  maxDailyCount: number;
  series: TarotTrendSeries[];
};

const cardOrder = new Map(tarotCardCatalog.map((card) => [card.name, card.order]));

function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function buildDateRange(end: Date, days: number): string[] {
  const start = addDays(end, -(days - 1));
  return Array.from({ length: days }, (_, index) => dateKey(addDays(start, index)));
}

export function calculateTarotRecordTrend(
  records: ParsedTarotRecord[],
  days = 30,
  limit = 5,
  endDate?: string,
): TarotRecordTrend {
  const safeDays = Math.max(1, Math.floor(days));
  const datedRecords = records.filter((record) => parseDateKey(record.observationDate));
  const latestDate = datedRecords.reduce(
    (latest, record) => record.observationDate > latest ? record.observationDate : latest,
    "",
  );
  const resolvedEnd = parseDateKey(endDate ?? "") ?? parseDateKey(latestDate);
  if (!resolvedEnd) {
    return { dateFrom: "", dateTo: "", days: safeDays, totalRecords: 0, totalGroups: 0, maxDailyCount: 0, series: [] };
  }

  const dates = buildDateRange(resolvedEnd, safeDays);
  const dateSet = new Set(dates);
  const included = datedRecords.filter((record) => dateSet.has(record.observationDate));
  const totals = new Map<string, number>();
  const dailyCounts = new Map<string, Map<string, number>>();
  included.forEach((record) => {
    const name = record.normalizedCardName;
    if (!name) return;
    totals.set(name, (totals.get(name) ?? 0) + 1);
    const cardDays = dailyCounts.get(name) ?? new Map<string, number>();
    cardDays.set(record.observationDate, (cardDays.get(record.observationDate) ?? 0) + 1);
    dailyCounts.set(name, cardDays);
  });

  const topCards = [...totals.entries()]
    .sort(([leftName, leftCount], [rightName, rightCount]) => rightCount - leftCount
      || (cardOrder.get(leftName) ?? Number.MAX_SAFE_INTEGER) - (cardOrder.get(rightName) ?? Number.MAX_SAFE_INTEGER)
      || leftName.localeCompare(rightName, "zh-Hant"))
    .slice(0, Math.max(0, limit));
  const series = topCards.map(([cardName, totalCount]) => ({
    cardName,
    totalCount,
    points: dates.map((date) => ({ date, count: dailyCounts.get(cardName)?.get(date) ?? 0 })),
  }));

  return {
    dateFrom: dates[0],
    dateTo: dates[dates.length - 1],
    days: safeDays,
    totalRecords: included.length,
    totalGroups: new Set(included.map((record) => record.groupId)).size,
    maxDailyCount: Math.max(0, ...series.flatMap((item) => item.points.map((point) => point.count))),
    series,
  };
}
