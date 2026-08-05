import type {
  ParsedTarotRecord,
  TarotRecordFilters,
} from "../types/tarotRecord";

export const DEFAULT_TAROT_RECORD_FILTERS: TarotRecordFilters = {
  keyword: "",
  dateFrom: "",
  dateTo: "",
  groupId: "",
  cardName: "",
  orientation: "",
  arcanaType: "",
  suit: "",
};

export function filterTarotRecords(
  records: ParsedTarotRecord[],
  filters: TarotRecordFilters,
): ParsedTarotRecord[] {
  const keyword = filters.keyword.trim().toLocaleLowerCase("zh-Hant");
  return records.filter((record) => {
    const searchable = [
      record.groupId,
      record.groupTitle,
      record.questionText,
      record.cardName,
      record.normalizedCardName,
    ].join(" ").toLocaleLowerCase("zh-Hant");
    return (!keyword || searchable.includes(keyword))
      && (!filters.dateFrom || record.observationDate >= filters.dateFrom)
      && (!filters.dateTo || record.observationDate <= filters.dateTo)
      && (!filters.groupId || record.groupId === filters.groupId)
      && (!filters.cardName || record.normalizedCardName === filters.cardName)
      && (!filters.orientation || record.orientation === filters.orientation)
      && (!filters.arcanaType || record.arcanaType === filters.arcanaType)
      && (!filters.suit || record.suit === filters.suit);
  });
}

export function sortTarotRecordsNewest(records: ParsedTarotRecord[]): ParsedTarotRecord[] {
  return [...records].sort((left, right) => {
    const byObservation = right.observationDateTime.localeCompare(left.observationDateTime);
    if (byObservation !== 0) return byObservation;
    return right.questionOrder - left.questionOrder;
  });
}

export function paginateTarotRecords(
  records: ParsedTarotRecord[],
  page: number,
  pageSize: number,
): { records: ParsedTarotRecord[]; page: number; totalPages: number; total: number } {
  const safePageSize = [25, 50, 100].includes(pageSize) ? pageSize : 25;
  const totalPages = Math.max(1, Math.ceil(records.length / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;
  return {
    records: records.slice(start, start + safePageSize),
    page: safePage,
    totalPages,
    total: records.length,
  };
}

export async function resolveUniqueGroupId(
  baseGroupId: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  if (!(await exists(baseGroupId))) return baseGroupId;
  for (let serial = 2; serial <= 999; serial += 1) {
    const candidate = `${baseGroupId}-${String(serial).padStart(2, "0")}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error("同一時間的題組過多，無法產生新的題組編號。");
}
