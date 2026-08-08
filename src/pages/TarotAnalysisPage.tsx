import { useEffect, useState } from "react";
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

export function TarotAnalysisPage() {
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTarotRecordService().listRecords()
      .then(setRecords)
      .catch((reason) => setError(tarotRecordStorageErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="content-page records-page records-analysis-page">
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
