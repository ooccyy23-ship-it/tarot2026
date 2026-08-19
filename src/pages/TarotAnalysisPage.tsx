import { useEffect, useMemo } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { TarotTimeTrendSection } from "../features/records/components/TarotTimeTrendSection";
import { TarotRecordStatisticsSection } from "../features/records/components/TarotRecordStatisticsSection";
import { TarotAnalysisFilterToolbar } from "../features/records/components/TarotAnalysisFilterToolbar";
import { TarotObservationTypeComparison } from "../features/records/components/TarotObservationTypeComparison";
import { consumeAnalyticsPosition, rememberAnalyticsPosition } from "../features/records/logic/tarotRecordNavigation";
import { useTarotAnalysisRecords } from "../features/records/hooks/useTarotAnalysisRecords";

export function TarotAnalysisPage() {
  const analysis = useTarotAnalysisRecords();
  const restoreScrollY = useMemo(() => consumeAnalyticsPosition(), []);

  useEffect(() => {
    if (analysis.loading || restoreScrollY === null) return;
    window.requestAnimationFrame(() => window.scrollTo({ top: restoreScrollY, behavior: "auto" }));
  }, [analysis.loading, restoreScrollY]);

  return (
    <main className="content-page records-page records-analysis-page" onClickCapture={(event) => {
      const target = event.target as Element;
      if (target.closest<HTMLAnchorElement>('a[href^="#/records"]')) rememberAnalyticsPosition();
    }}>
      <PageHeader eyebrow="Tarot Analytics" title="統計分析" description="統計全部已儲存的抽牌資料，觀察牌卡頻率與時間變化。" actions={<a className="secondary-button button-link" href="#/records">返回抽牌資料庫</a>} />

      {analysis.error ? <p className="status-message error" role="alert">{analysis.error}</p> : null}
      {analysis.loading ? (
        <section className="panel records-placeholder" aria-live="polite">
          <strong>正在載入分析資料…</strong>
        </section>
      ) : analysis.error ? null : analysis.records.length === 0 ? (
        <section className="panel"><EmptyState title="尚無可分析的資料" description="先匯入完整的五題抽牌紀錄，即可建立統計分析。" action={<a className="primary-button button-link" href="#/import">前往紀錄匯入</a>} /></section>
      ) : (
        <>
          <TarotAnalysisFilterToolbar
            dateFrom={analysis.effectiveDateFrom}
            dateTo={analysis.effectiveDateTo}
            minimumDate={analysis.sourceScope.dateFrom}
            maximumDate={analysis.sourceScope.dateTo}
            cardCount={analysis.filteredScope.cardCount}
            groupCount={analysis.filteredScope.groupCount}
            recordType={analysis.recordType}
            onDateFromChange={analysis.updateDateFrom}
            onDateToChange={analysis.updateDateTo}
            onRecordTypeChange={analysis.updateRecordType}
            onReset={analysis.resetFilters}
          />
          <TarotRecordStatisticsSection records={analysis.filteredRecords} />
          <TarotObservationTypeComparison records={analysis.comparisonRecords} />
          <TarotTimeTrendSection records={analysis.filteredRecords} />
        </>
      )}
    </main>
  );
}
