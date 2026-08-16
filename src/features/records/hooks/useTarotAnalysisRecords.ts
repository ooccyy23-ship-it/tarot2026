import { useEffect, useMemo, useState } from "react";
import { DEFAULT_TAROT_RECORD_FILTERS, filterTarotRecords } from "../logic/tarotRecordCollection";
import { analyticsScopeSummary } from "../logic/tarotRecordNavigation";
import { tarotRecordStorageErrorMessage } from "../storage/tarotRecordError";
import { getTarotRecordService } from "../storage/tarotRecordService";
import type { ParsedTarotRecord, TarotRecordFilters, TarotRecordType } from "../types/tarotRecord";

export function useTarotAnalysisRecords() {
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<TarotRecordFilters>({ ...DEFAULT_TAROT_RECORD_FILTERS });
  const calculatedAt = useMemo(() => new Date(), []);
  const sourceScope = useMemo(() => analyticsScopeSummary(records, calculatedAt), [calculatedAt, records]);
  const filteredRecords = useMemo(() => filterTarotRecords(records, filters), [filters, records]);
  const comparisonRecords = useMemo(() => filterTarotRecords(records, { ...filters, recordType: "" }), [filters, records]);
  const filteredScope = useMemo(() => analyticsScopeSummary(filteredRecords, calculatedAt), [calculatedAt, filteredRecords]);

  useEffect(() => {
    getTarotRecordService().listRecords()
      .then(setRecords)
      .catch((reason) => setError(tarotRecordStorageErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  const updateDateFrom = (value: string) => setFilters((current) => ({
    ...current,
    dateFrom: value,
    dateTo: current.dateTo && value > current.dateTo ? value : current.dateTo,
  }));

  const updateDateTo = (value: string) => setFilters((current) => ({
    ...current,
    dateFrom: current.dateFrom && value < current.dateFrom ? value : current.dateFrom,
    dateTo: value,
  }));

  const updateRecordType = (value: TarotRecordType | "") => setFilters((current) => ({ ...current, recordType: value }));

  return {
    records,
    filteredRecords,
    comparisonRecords,
    loading,
    error,
    sourceScope,
    filteredScope,
    effectiveDateFrom: filters.dateFrom || sourceScope.dateFrom,
    effectiveDateTo: filters.dateTo || sourceScope.dateTo,
    updateDateFrom,
    updateDateTo,
    recordType: filters.recordType,
    updateRecordType,
    resetFilters: () => setFilters({ ...DEFAULT_TAROT_RECORD_FILTERS }),
  };
}
