import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { TarotCooccurrenceMatrixSection } from "../features/records/components/TarotCooccurrenceMatrixSection";
import { TarotCooccurrenceNetworkSection } from "../features/records/components/TarotCooccurrenceNetworkSection";
import { TarotClusteringSection } from "../features/records/components/TarotClusteringSection";
import { TarotCentralitySection } from "../features/records/components/TarotCentralitySection";
import { TarotTimeTrendSection } from "../features/records/components/TarotTimeTrendSection";
import { TarotRecordStatisticsSection } from "../features/records/components/TarotRecordStatisticsSection";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import type { ParsedTarotRecord } from "../features/records/types/tarotRecord";
import { analyticsScopeSummary, consumeAnalyticsPosition, rememberAnalyticsPosition } from "../features/records/logic/tarotRecordNavigation";

export function TarotAnalysisPage() {
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const calculatedAt = useMemo(() => new Date(), []);
  const restoreScrollY = useMemo(() => consumeAnalyticsPosition(), []);
  const scope = useMemo(() => analyticsScopeSummary(records, calculatedAt), [calculatedAt, records]);

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
          <section className="panel records-analysis-scope" aria-label="本次統計範圍">
            <div><p className="eyebrow">Analysis Scope</p><h2>本次統計範圍</h2></div>
            <dl>
              <div><dt>資料條件</dt><dd>全部正式已儲存紀錄</dd></div>
              <div><dt>題組數</dt><dd>{scope.groupCount} 個</dd></div>
              <div><dt>牌卡總數</dt><dd>{scope.cardCount} 張</dd></div>
              <div><dt>日期範圍</dt><dd>{scope.dateFrom.replace(/-/g, "/")} 至 {scope.dateTo.replace(/-/g, "/")}</dd></div>
              <div><dt>計算時間</dt><dd>{scope.calculatedAt}</dd></div>
            </dl>
            <p>以下數字均由目前正式紀錄即時計算；點選統計項目可查看構成該數字的原始牌卡出現紀錄。</p>
          </section>
          <TarotRecordStatisticsSection records={records} />
          <TarotCooccurrenceNetworkSection records={records} />
          <TarotCooccurrenceMatrixSection records={records} />
          <TarotClusteringSection records={records} />
          <TarotCentralitySection records={records} />
          <TarotTimeTrendSection records={records} />
        </>
      )}
    </main>
  );
}
