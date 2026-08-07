import { useEffect, useState } from "react";
import { TarotCooccurrenceMatrixSection } from "../features/records/components/TarotCooccurrenceMatrixSection";
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
      <header className="page-title records-page-title">
        <div>
          <p className="eyebrow">Tarot Analytics</p>
          <h1>抽牌分析儀表板</h1>
          <p>統計全部已儲存的抽牌資料，觀察牌卡頻率、正逆位與牌組分布。</p>
        </div>
        <a className="secondary-button button-link" href="#/records">返回抽牌紀錄</a>
      </header>

      {error ? <p className="status-message error" role="alert">{error}</p> : null}
      {loading ? (
        <section className="panel records-placeholder" aria-live="polite">
          <strong>正在載入分析資料…</strong>
        </section>
      ) : error ? null : (
        <>
          <TarotRecordStatisticsSection records={records} />
          <TarotCooccurrenceMatrixSection records={records} />
        </>
      )}
    </main>
  );
}
