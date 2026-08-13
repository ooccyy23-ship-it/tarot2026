import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { TarotCooccurrenceMatrixSection } from "../features/records/components/TarotCooccurrenceMatrixSection";
import { TarotCooccurrenceNetworkSection } from "../features/records/components/TarotCooccurrenceNetworkSection";
import { TarotClusteringSection } from "../features/records/components/TarotClusteringSection";
import { TarotCentralitySection } from "../features/records/components/TarotCentralitySection";
import { TarotTimeTrendSection } from "../features/records/components/TarotTimeTrendSection";
import { TarotRecordStatisticsSection } from "../features/records/components/TarotRecordStatisticsSection";
import { TarotAnalysisFilterToolbar } from "../features/records/components/TarotAnalysisFilterToolbar";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import type { ParsedTarotRecord, TarotRecordFilters } from "../features/records/types/tarotRecord";
import { analyticsScopeSummary, consumeAnalyticsPosition, rememberAnalyticsPosition } from "../features/records/logic/tarotRecordNavigation";
import { DEFAULT_TAROT_RECORD_FILTERS, filterTarotRecords } from "../features/records/logic/tarotRecordCollection";

export function TarotAnalysisPage() {
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<TarotRecordFilters>({ ...DEFAULT_TAROT_RECORD_FILTERS });
  const calculatedAt = useMemo(() => new Date(), []);
  const restoreScrollY = useMemo(() => consumeAnalyticsPosition(), []);
  const sourceScope = useMemo(() => analyticsScopeSummary(records, calculatedAt), [calculatedAt, records]);
  const filteredRecords = useMemo(() => filterTarotRecords(records, filters), [filters, records]);
  const filteredScope = useMemo(() => analyticsScopeSummary(filteredRecords, calculatedAt), [calculatedAt, filteredRecords]);
  const effectiveDateFrom = filters.dateFrom || sourceScope.dateFrom;
  const effectiveDateTo = filters.dateTo || sourceScope.dateTo;

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

  useEffect(() => {
    getTarotRecordService().listRecords()
      .then(setRecords)
      .catch((reason) => setError(tarotRecordStorageErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || restoreScrollY === null) return;
    window.requestAnimationFrame(() => window.scrollTo({ top: restoreScrollY, behavior: "auto" }));
  }, [loading, restoreScrollY]);

  return (
    <main className="content-page records-page records-analysis-page" onClickCapture={(event) => {
      const target = event.target as Element;
      if (target.closest<HTMLAnchorElement>('a[href^="#/records"]')) rememberAnalyticsPosition();
    }}>
      <PageHeader eyebrow="Tarot Analytics" title="統計分析" description="統計全部已儲存的抽牌資料，觀察牌卡頻率、共現關係與時間變化。" actions={<a className="secondary-button button-link" href="#/records">返回抽牌資料庫</a>} />

      {error ? <p className="status-message error" role="alert">{error}</p> : null}
      {loading ? (
        <section className="panel records-placeholder" aria-live="polite">
          <strong>正在載入分析資料…</strong>
        </section>
      ) : error ? null : records.length === 0 ? (
        <section className="panel"><EmptyState title="尚無可分析的資料" description="先匯入完整的五題抽牌紀錄，即可建立統計分析。" action={<a className="primary-button button-link" href="#/import">前往紀錄匯入</a>} /></section>
      ) : (
        <>
          <TarotAnalysisFilterToolbar
            dateFrom={effectiveDateFrom}
            dateTo={effectiveDateTo}
            minimumDate={sourceScope.dateFrom}
            maximumDate={sourceScope.dateTo}
            cardCount={filteredScope.cardCount}
            groupCount={filteredScope.groupCount}
            onDateFromChange={updateDateFrom}
            onDateToChange={updateDateTo}
            onReset={() => setFilters({ ...DEFAULT_TAROT_RECORD_FILTERS })}
          />
          <TarotRecordStatisticsSection records={filteredRecords} />
          <TarotCooccurrenceNetworkSection records={filteredRecords} />
          <TarotCooccurrenceMatrixSection records={filteredRecords} />
          <TarotClusteringSection records={filteredRecords} />
          <TarotCentralitySection records={filteredRecords} />
          <TarotTimeTrendSection records={filteredRecords} />
        </>
      )}
    </main>
  );
}
