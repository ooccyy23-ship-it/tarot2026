import type { ParsedTarotRecord } from "../types/tarotRecord";

export type DailyStatisticsRange = "7" | "30" | "all";

export type DailyTarotGroup = {
  groupId: string;
  groupTitle: string;
  observationTime: string;
  cardCount: number;
  cards: ParsedTarotRecord[];
};

export type DailyTarotStatistics = {
  date: string;
  totalCount: number;
  groupCount: number;
  uprightCount: number;
  reversedCount: number;
  majorCount: number;
  minorCount: number;
  groups: DailyTarotGroup[];
};

export type RecentDailyCount = {
  date: string;
  label: string;
  count: number;
};

export type RecentDailySummary = {
  days: RecentDailyCount[];
  totalCount: number;
  dailyAverage: number;
  highestCount: number;
  highestDate: string;
};

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatDateKey(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftDateKey(date: string, amount: number): string {
  const match = DATE_PATTERN.exec(date);
  if (!match) throw new Error("日期必須使用 YYYY-MM-DD 格式。");
  const shifted = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + amount));
  return formatDateKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

export function getTaipeiDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatShortDate(date: string): string {
  const match = DATE_PATTERN.exec(date);
  if (!match) return date;
  return `${Number(match[2])}/${String(Number(match[3])).padStart(2, "0")}`;
}

export function formatDailyDate(date: string): string {
  return date.replace(/-/g, "/");
}

export function calculateDailyTarotStatistics(records: ParsedTarotRecord[]): DailyTarotStatistics[] {
  const recordsByDate = new Map<string, ParsedTarotRecord[]>();
  records.forEach((record) => {
    if (!DATE_PATTERN.test(record.observationDate)) return;
    const dailyRecords = recordsByDate.get(record.observationDate) ?? [];
    dailyRecords.push(record);
    recordsByDate.set(record.observationDate, dailyRecords);
  });

  return [...recordsByDate.entries()]
    .map(([date, dailyRecords]) => {
      const recordsByGroup = new Map<string, ParsedTarotRecord[]>();
      dailyRecords.forEach((record) => {
        const groupRecords = recordsByGroup.get(record.groupId) ?? [];
        groupRecords.push(record);
        recordsByGroup.set(record.groupId, groupRecords);
      });
      const groups = [...recordsByGroup.entries()]
        .map(([groupId, groupRecords]) => {
          const cards = [...groupRecords].sort((left, right) => left.questionOrder - right.questionOrder);
          return {
            groupId,
            groupTitle: cards[0]?.groupTitle ?? groupId,
            observationTime: cards[0]?.observationTime ?? "",
            cardCount: cards.length,
            cards,
          };
        })
        .sort((left, right) => right.observationTime.localeCompare(left.observationTime));

      return {
        date,
        totalCount: dailyRecords.length,
        groupCount: groups.length,
        uprightCount: dailyRecords.filter((record) => record.orientation === "upright").length,
        reversedCount: dailyRecords.filter((record) => record.orientation === "reversed").length,
        majorCount: dailyRecords.filter((record) => record.arcanaType === "major").length,
        minorCount: dailyRecords.filter((record) => record.arcanaType === "minor").length,
        groups,
      };
    })
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function filterDailyStatisticsByRange(
  statistics: DailyTarotStatistics[],
  range: DailyStatisticsRange,
  now: Date = new Date(),
): DailyTarotStatistics[] {
  if (range === "all") return statistics;
  const today = getTaipeiDateKey(now);
  const firstDate = shiftDateKey(today, -(Number(range) - 1));
  return statistics.filter((item) => item.date >= firstDate && item.date <= today);
}

export function buildRecentDailySummary(
  records: ParsedTarotRecord[],
  now: Date = new Date(),
): RecentDailySummary {
  const today = getTaipeiDateKey(now);
  const counts = new Map<string, number>();
  records.forEach((record) => {
    if (DATE_PATTERN.test(record.observationDate)) {
      counts.set(record.observationDate, (counts.get(record.observationDate) ?? 0) + 1);
    }
  });
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDateKey(today, index - 6);
    return { date, label: formatShortDate(date), count: counts.get(date) ?? 0 };
  });
  const totalCount = days.reduce((total, day) => total + day.count, 0);
  const highestCount = Math.max(...days.map((day) => day.count), 0);
  const highestDate = highestCount === 0
    ? ""
    : [...days].reverse().find((day) => day.count === highestCount)?.date ?? "";

  return {
    days,
    totalCount,
    dailyAverage: Math.round((totalCount / 7) * 10) / 10,
    highestCount,
    highestDate,
  };
}
