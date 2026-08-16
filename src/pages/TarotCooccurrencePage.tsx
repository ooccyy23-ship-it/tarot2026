import { useEffect, useState } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { TarotAnalysisFilterToolbar } from "../features/records/components/TarotAnalysisFilterToolbar";
import { TarotCentralitySection } from "../features/records/components/TarotCentralitySection";
import { TarotClusteringSection } from "../features/records/components/TarotClusteringSection";
import { TarotCooccurrenceMatrixSection } from "../features/records/components/TarotCooccurrenceMatrixSection";
import { TarotCooccurrenceNetworkSection } from "../features/records/components/TarotCooccurrenceNetworkSection";
import { TarotCooccurrencePartnersSection } from "../features/records/components/TarotCooccurrencePartnersSection";
import { useTarotAnalysisRecords } from "../features/records/hooks/useTarotAnalysisRecords";

export function TarotCooccurrencePage() {
  const analysis = useTarotAnalysisRecords();
  const [minimumCount, setMinimumCount] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState(() => window.sessionStorage.getItem("tarot2026:cooccurrence-selected-card:v1") ?? "");

  useEffect(() => {
    if (selectedCardId) window.sessionStorage.setItem("tarot2026:cooccurrence-selected-card:v1", selectedCardId);
    else window.sessionStorage.removeItem("tarot2026:cooccurrence-selected-card:v1");
  }, [selectedCardId]);

  return (
    <main className="content-page records-page records-analysis-page records-cooccurrence-page">
      <PageHeader
        eyebrow="Co-occurrence Analysis"
        title="牌卡共現分析"
        description="分析牌卡在同一五牌題組中的共同出現關係；連線越粗，代表共同出現越頻繁。"
        actions={<a className="secondary-button button-link" href="#/analytics">返回統計分析</a>}
      />

      {analysis.error ? <p className="status-message error" role="alert">{analysis.error}</p> : null}
      {analysis.loading ? (
        <section className="panel records-placeholder" aria-live="polite">
          <strong>正在載入共現資料…</strong>
        </section>
      ) : analysis.error ? null : analysis.records.length === 0 ? (
        <section className="panel">
          <EmptyState title="尚無可分析的資料" description="先匯入完整的五題抽牌紀錄，即可建立共現分析。" action={<a className="primary-button button-link" href="#/import">前往紀錄匯入</a>} />
        </section>
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
          <TarotCooccurrenceNetworkSection records={analysis.filteredRecords} minimumCount={minimumCount} onMinimumCountChange={setMinimumCount} />
          <TarotCooccurrencePartnersSection
            records={analysis.filteredRecords}
            selectedCardId={selectedCardId}
            minimumCount={minimumCount}
            dateFrom={analysis.effectiveDateFrom}
            dateTo={analysis.effectiveDateTo}
            onSelectedCardChange={setSelectedCardId}
          />
          <TarotCooccurrenceMatrixSection records={analysis.filteredRecords} />
          <TarotClusteringSection records={analysis.filteredRecords} />
          <TarotCentralitySection records={analysis.filteredRecords} />
          <section className="cooccurrence-extension-space" aria-label="後續共現分析擴充區" />
        </>
      )}
    </main>
  );
}
