import { tarotCardStableId } from "../../records/logic/tarotRecordNavigation";
import type { ParsedTarotRecord } from "../../records/types/tarotRecord";
import { getTarotCardMetadata } from "../../../data/tarotCardCatalog";
import { TREND_CHANGE_THRESHOLD_PP, TREND_CONSTRUCT_IDS } from "../constants/constructTaxonomy";
import { CARD_CONSTRUCT_BY_NAME, validateCardConstructMappings } from "../data/cardConstructMap";
import type { ConstructMetric, TrendAnalysisResult, TrendCardDetail, TrendConstructId, TrendDirection, TrendMappingCategory, TrendPeriod, TrendPeriodStrategy, TrendSummary } from "../types/trendAnalysis";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string): Date {
  if (!DATE_PATTERN.test(value)) throw new Error(`無效日期：${value}`);
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, amount: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateKey(date);
}

export const CALENDAR_WEEK_MONDAY_STRATEGY: TrendPeriodStrategy = {
  id: "calendar-week-monday-v1",
  label: "日曆週（週一至週日）",
  getWindow(value) {
    const date = parseDate(value);
    const day = date.getUTCDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    const start = addDays(value, -daysFromMonday);
    return { start, end: addDays(start, 6) };
  },
};

function emptyMetrics(): Record<TrendConstructId, ConstructMetric> {
  return Object.fromEntries(TREND_CONSTRUCT_IDS.map((constructId) => [constructId, {
    constructId, count: 0, share: null, changePp: null, direction: "NO_DATA" as TrendDirection,
  }])) as Record<TrendConstructId, ConstructMetric>;
}

function rankedConstructs(metrics: Record<TrendConstructId, ConstructMetric>): { top: TrendConstructId[]; secondary: TrendConstructId[] } {
  const groups = new Map<number, TrendConstructId[]>();
  TREND_CONSTRUCT_IDS.forEach((id) => {
    const share = metrics[id].share;
    if (share === null || metrics[id].count === 0) return;
    groups.set(share, [...(groups.get(share) ?? []), id]);
  });
  const values = [...groups.keys()].sort((a, b) => b - a);
  return { top: groups.get(values[0]) ?? [], secondary: groups.get(values[1]) ?? [] };
}

function directionFor(current: ConstructMetric, previous: ConstructMetric | null, isFirstMappedPeriod: boolean): TrendDirection {
  if (current.share === null) return "NO_DATA";
  if (isFirstMappedPeriod || !previous || previous.share === null) return "BASELINE";
  if (previous.count === 0 && current.count > 0) return "NEW";
  const change = current.share - previous.share;
  if (change >= TREND_CHANGE_THRESHOLD_PP) return "UP";
  if (change <= -TREND_CHANGE_THRESHOLD_PP) return "DOWN";
  return "STABLE";
}

function summarize(periods: TrendPeriod[]): TrendSummary {
  const validPeriods = periods.filter((period) => period.mappedCards > 0);
  const current = validPeriods.length ? validPeriods[validPeriods.length - 1] : null;
  if (!current) return { currentTop: null, currentTopChange: null, sustainedRise: null, largestDrop: null };
  const currentTopShare = current.topConstructs.length ? current.constructMetrics[current.topConstructs[0]].share ?? 0 : 0;
  const topChanges = current.topConstructs.map((id) => current.constructMetrics[id].changePp).filter((value): value is number => value !== null);

  let longest = 0;
  let risingIds: TrendConstructId[] = [];
  TREND_CONSTRUCT_IDS.forEach((id) => {
    let run = 0;
    for (let index = validPeriods.length - 1; index >= 0 && validPeriods[index].constructMetrics[id].direction === "UP"; index -= 1) run += 1;
    if (run > longest) { longest = run; risingIds = [id]; }
    else if (run > 0 && run === longest) risingIds.push(id);
  });

  const currentChanges = TREND_CONSTRUCT_IDS.map((id) => ({ id, change: current.constructMetrics[id].changePp }))
    .filter((item): item is { id: TrendConstructId; change: number } => item.change !== null);
  const minimum = currentChanges.length ? Math.min(...currentChanges.map((item) => item.change)) : null;
  const largestDrop = minimum !== null && minimum < 0
    ? { ids: currentChanges.filter((item) => item.change === minimum).map((item) => item.id), changePp: minimum }
    : null;

  return {
    currentTop: current.topConstructs.length ? { ids: current.topConstructs, share: currentTopShare } : null,
    currentTopChange: topChanges.length ? Math.max(...topChanges) : null,
    sustainedRise: longest > 0 ? { ids: risingIds, periods: longest } : null,
    largestDrop,
  };
}

export function calculateTrendAnalysis(
  records: ParsedTarotRecord[],
  dateFrom: string,
  dateTo: string,
  strategy: TrendPeriodStrategy = CALENDAR_WEEK_MONDAY_STRATEGY,
  resolveCategory: (record: ParsedTarotRecord) => TrendMappingCategory = (record) => CARD_CONSTRUCT_BY_NAME[record.normalizedCardName]?.category ?? "UNASSIGNED",
): TrendAnalysisResult {
  const catalogCoverage = validateCardConstructMappings();
  if (!dateFrom || !dateTo || dateFrom > dateTo) {
    return { periods: [], summary: summarize([]), coverage: { mappedCatalogCards: catalogCoverage.mapped, unassignedCatalogCards: catalogCoverage.unassigned, mappedRecordCards: 0, unassignedRecordCards: 0 } };
  }
  const firstWindow = strategy.getWindow(dateFrom);
  const windows: Array<{ canonicalStart: string; canonicalEnd: string; periodStart: string; periodEnd: string }> = [];
  for (let start = firstWindow.start; start <= dateTo; start = addDays(start, 7)) {
    const end = addDays(start, 6);
    windows.push({ canonicalStart: start, canonicalEnd: end, periodStart: start < dateFrom ? dateFrom : start, periodEnd: end > dateTo ? dateTo : end });
  }

  let seenMappedPeriod = false;
  const periods: TrendPeriod[] = [];
  windows.forEach((window) => {
    const periodRecords = records.filter((record) => record.observationDate >= window.periodStart && record.observationDate <= window.periodEnd);
    const metrics = emptyMetrics();
    let unassignedCount = 0;
    periodRecords.forEach((record) => {
      const category = resolveCategory(record);
      if (category === "UNASSIGNED") unassignedCount += 1;
      else metrics[category].count += 1;
    });
    const mappedCards = periodRecords.length - unassignedCount;
    TREND_CONSTRUCT_IDS.forEach((id) => { metrics[id].share = mappedCards ? (metrics[id].count / mappedCards) * 100 : null; });
    const previous = periods.length ? periods[periods.length - 1] : null;
    const isFirstMappedPeriod = mappedCards > 0 && !seenMappedPeriod;
    TREND_CONSTRUCT_IDS.forEach((id) => {
      const priorMetric = previous?.constructMetrics[id] ?? null;
      metrics[id].changePp = metrics[id].share !== null && priorMetric?.share !== null && priorMetric?.share !== undefined ? metrics[id].share! - priorMetric.share : null;
      metrics[id].direction = directionFor(metrics[id], priorMetric, isFirstMappedPeriod);
    });
    if (mappedCards > 0) seenMappedPeriod = true;
    const ranking = rankedConstructs(metrics);
    periods.push({
      id: `${window.canonicalStart}_${window.canonicalEnd}`,
      ...window,
      isPartial: window.periodStart !== window.canonicalStart || window.periodEnd !== window.canonicalEnd,
      totalCards: periodRecords.length,
      mappedCards,
      totalQuestionGroups: new Set(periodRecords.map((record) => record.groupId)).size,
      constructMetrics: metrics,
      topConstructs: ranking.top,
      secondaryConstructs: ranking.secondary,
      unassignedCount,
      unassignedShare: periodRecords.length ? (unassignedCount / periodRecords.length) * 100 : 0,
      records: periodRecords,
    });
  });
  const mappedRecordCards = periods.reduce((sum, period) => sum + period.mappedCards, 0);
  const unassignedRecordCards = periods.reduce((sum, period) => sum + period.unassignedCount, 0);
  return {
    periods,
    summary: summarize(periods),
    coverage: { mappedCatalogCards: catalogCoverage.mapped, unassignedCatalogCards: catalogCoverage.unassigned, mappedRecordCards, unassignedRecordCards },
  };
}

export function getTrendCardDetails(period: TrendPeriod, constructId: TrendConstructId): TrendCardDetail[] {
  const matching = period.records.filter((record) => CARD_CONSTRUCT_BY_NAME[record.normalizedCardName]?.category === constructId);
  const byCard = new Map<string, ParsedTarotRecord[]>();
  matching.forEach((record) => byCard.set(record.normalizedCardName, [...(byCard.get(record.normalizedCardName) ?? []), record]));
  return [...byCard.entries()].map(([cardName, cardRecords]) => {
    const metadata = getTarotCardMetadata(cardName);
    return {
      cardId: metadata ? tarotCardStableId(metadata.order) : "",
      cardName,
      count: cardRecords.length,
      constructShare: matching.length ? (cardRecords.length / matching.length) * 100 : 0,
      groupCount: new Set(cardRecords.map((record) => record.groupId)).size,
    };
  }).sort((left, right) => right.count - left.count || left.cardId.localeCompare(right.cardId));
}

export function formatTrendPeriod(period: Pick<TrendPeriod, "periodStart" | "periodEnd" | "isPartial">): string {
  const label = `${period.periodStart.slice(5).replace("-", "/")}–${period.periodEnd.slice(5).replace("-", "/")}`;
  return `${label}${period.isPartial ? "（部分期間）" : ""}`;
}

export function formatPp(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}pp`;
}
