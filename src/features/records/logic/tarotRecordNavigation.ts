import { tarotCardCatalog } from "../../../data/tarotCardCatalog";
import { DEFAULT_TAROT_RECORD_FILTERS } from "./tarotRecordCollection";
import type { ParsedTarotRecord, TarotRecordFilters } from "../types/tarotRecord";

export const TAROT_RECORD_VIEW_STATE_KEY = "tarot2026:records-view-state:v1";
export const TAROT_RECORD_VIEW_STATE_VERSION = 1;
export const TAROT_ANALYTICS_VIEW_STATE_KEY = "tarot2026:analytics-view-state:v1";

export type TarotRecordSortDirection = "desc" | "asc";

export type TarotRecordViewState = {
  version: 1;
  filters: TarotRecordFilters;
  page: number;
  pageSize: 25 | 50 | 100;
  sortDirection: TarotRecordSortDirection;
  scrollY: number;
  restoreOnReturn: boolean;
  savedAt: string;
};

export type ParsedRecordFilterQuery = {
  filters: TarotRecordFilters;
  invalidParameters: string[];
};

const validOrientations = new Set(["upright", "reversed"]);
const validArcanaTypes = new Set(["major", "minor"]);
const validSuits = new Set(["major", "cups", "swords", "wands", "pentacles"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function tarotCardStableId(order: number): string {
  return `TAROT_${String(order).padStart(2, "0")}`;
}

export function cardNameFromStableId(cardId: string): string {
  return tarotCardCatalog.find((card) => tarotCardStableId(card.order) === cardId)?.name ?? "";
}

export function cardStableIdFromName(cardName: string): string {
  const match = tarotCardCatalog.find((card) => card.name === cardName);
  return match ? tarotCardStableId(match.order) : "";
}

export function parseRecordFiltersFromHash(hash = window.location.hash): ParsedRecordFilterQuery {
  const query = hash.split("?")[1] ?? "";
  const parameters = new URLSearchParams(query);
  const filters = { ...DEFAULT_TAROT_RECORD_FILTERS };
  const invalidParameters: string[] = [];

  filters.keyword = parameters.get("keyword")?.trim() ?? "";
  filters.groupId = parameters.get("groupId")?.trim() ?? "";

  const dateFrom = parameters.get("from")?.trim() ?? "";
  const dateTo = parameters.get("to")?.trim() ?? "";
  if (dateFrom && !datePattern.test(dateFrom)) invalidParameters.push("from");
  else filters.dateFrom = dateFrom;
  if (dateTo && !datePattern.test(dateTo)) invalidParameters.push("to");
  else filters.dateTo = dateTo;

  const cardId = parameters.get("cardId")?.trim() ?? "";
  if (cardId) {
    const cardName = cardNameFromStableId(cardId);
    if (cardName) filters.cardName = cardName;
    else invalidParameters.push("cardId");
  }

  const orientation = parameters.get("orientation")?.trim() ?? "";
  if (orientation && !validOrientations.has(orientation)) invalidParameters.push("orientation");
  else filters.orientation = orientation as TarotRecordFilters["orientation"];

  const arcanaType = parameters.get("arcana")?.trim() ?? "";
  if (arcanaType && !validArcanaTypes.has(arcanaType)) invalidParameters.push("arcana");
  else filters.arcanaType = arcanaType as TarotRecordFilters["arcanaType"];

  const suit = parameters.get("suit")?.trim() ?? "";
  if (suit && !validSuits.has(suit)) invalidParameters.push("suit");
  else filters.suit = suit as TarotRecordFilters["suit"];

  return { filters, invalidParameters };
}

export function buildRecordsHash(filters: Partial<TarotRecordFilters> = {}): string {
  const merged = { ...DEFAULT_TAROT_RECORD_FILTERS, ...filters };
  const parameters = new URLSearchParams();
  if (merged.keyword.trim()) parameters.set("keyword", merged.keyword.trim());
  if (merged.dateFrom) parameters.set("from", merged.dateFrom);
  if (merged.dateTo) parameters.set("to", merged.dateTo);
  if (merged.groupId) parameters.set("groupId", merged.groupId);
  if (merged.cardName) {
    const cardId = cardStableIdFromName(merged.cardName);
    if (cardId) parameters.set("cardId", cardId);
  }
  if (merged.orientation) parameters.set("orientation", merged.orientation);
  if (merged.arcanaType) parameters.set("arcana", merged.arcanaType);
  if (merged.suit) parameters.set("suit", merged.suit);
  const query = parameters.toString();
  return `#/records${query ? `?${query}` : ""}`;
}

export function buildRecordDetailHash(groupId: string, returnHash: string): string {
  const parameters = new URLSearchParams({ groupId, return: returnHash });
  return `#/records/detail?${parameters.toString()}`;
}

export function readTarotRecordViewState(storage: Storage = window.sessionStorage): TarotRecordViewState | null {
  try {
    const parsed = JSON.parse(storage.getItem(TAROT_RECORD_VIEW_STATE_KEY) ?? "null") as Partial<TarotRecordViewState> | null;
    if (!parsed || parsed.version !== TAROT_RECORD_VIEW_STATE_VERSION) return null;
    const pageSize = [25, 50, 100].includes(Number(parsed.pageSize)) ? Number(parsed.pageSize) as 25 | 50 | 100 : 25;
    return {
      version: 1,
      filters: parsed.filters && typeof parsed.filters === "object"
        ? { ...DEFAULT_TAROT_RECORD_FILTERS, ...parsed.filters }
        : { ...DEFAULT_TAROT_RECORD_FILTERS },
      page: Math.max(1, Number(parsed.page) || 1),
      pageSize,
      sortDirection: parsed.sortDirection === "asc" ? "asc" : "desc",
      scrollY: Math.max(0, Number(parsed.scrollY) || 0),
      restoreOnReturn: parsed.restoreOnReturn === true,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    };
  } catch {
    return null;
  }
}

export function writeTarotRecordViewState(
  state: Omit<TarotRecordViewState, "version" | "savedAt">,
  storage: Storage = window.sessionStorage,
): void {
  storage.setItem(TAROT_RECORD_VIEW_STATE_KEY, JSON.stringify({
    ...state,
    version: TAROT_RECORD_VIEW_STATE_VERSION,
    savedAt: new Date().toISOString(),
  } satisfies TarotRecordViewState));
}

export function summarizeFilteredRecords(records: ParsedTarotRecord[]): { appearances: number; groups: number } {
  return { appearances: records.length, groups: new Set(records.map((record) => record.groupId)).size };
}

export function rememberAnalyticsPosition(storage: Storage = window.sessionStorage): void {
  storage.setItem(TAROT_ANALYTICS_VIEW_STATE_KEY, JSON.stringify({ version: 1, scrollY: window.scrollY, restore: true }));
}

export function consumeAnalyticsPosition(storage: Storage = window.sessionStorage): number | null {
  try {
    const parsed = JSON.parse(storage.getItem(TAROT_ANALYTICS_VIEW_STATE_KEY) ?? "null") as { version?: number; scrollY?: number; restore?: boolean } | null;
    if (!parsed || parsed.version !== 1 || parsed.restore !== true) return null;
    storage.setItem(TAROT_ANALYTICS_VIEW_STATE_KEY, JSON.stringify({ ...parsed, restore: false }));
    return Math.max(0, Number(parsed.scrollY) || 0);
  } catch {
    return null;
  }
}

export function analyticsScopeSummary(records: ParsedTarotRecord[], calculatedAt = new Date()): {
  cardCount: number;
  groupCount: number;
  dateFrom: string;
  dateTo: string;
  calculatedAt: string;
} {
  const dates = records.map((record) => record.observationDate).filter(Boolean).sort();
  return {
    cardCount: records.length,
    groupCount: new Set(records.map((record) => record.groupId)).size,
    dateFrom: dates[0] ?? "",
    dateTo: dates[dates.length - 1] ?? "",
    calculatedAt: calculatedAt.toLocaleString("zh-TW", { hour12: false }),
  };
}
